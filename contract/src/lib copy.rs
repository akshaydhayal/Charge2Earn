// lib.rs - native Solana program (no Anchor)
// Compile with: cargo build-bpf (or modern toolchain for BPF)
// Uses borsh for (de)serialization

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::IsInitialized,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar, system_program
};

/// 0.5 SOL registration fee
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const REG_FEE_LAMPORTS: u64 = LAMPORTS_PER_SOL / 2; // 0.5 SOL

// PDA seeds:
const STATE_SEED: &[u8] = b"charge2earn_state";
const CHARGER_SEED: &[u8] = b"charger"; // + charger_code (bytes)
const DRIVER_SEED: &[u8] = b"driver"; // + driver_pubkey
const SESSION_SEED: &[u8] = b"session"; // + charger_pubkey + driver_pubkey + start_ts
const LISTING_SEED: &[u8] = b"listing"; // + seller_pubkey + nonce

// ----- Instructions -----
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum Instruction {
    /// Initialize program state
    Initialize { admin: Pubkey },

    AddCharger {code: String,                // unique code up to ~32
        name: String,city: String,address: String,latitude: f64,longitude: f64,
        power_kw: f32, rate_points_per_sec: u64,       // points per second
        price_per_sec_lamports: u64,    // how many lamports per second driver pays
    },
    StartSession { start_ts: i64 },

    // / Stop session: compute duration, transfer SOL to charger owner, credit AMP points to driver
    StopSession { end_ts: i64 },

    // / Create listing (seller reserves points)   
    CreateListing { nonce: u64, amount_points: u64, price_per_point_lamports: u64 },

    // / Buy from listing    
    // BuyFromListing { buy_amount_points: u64 },

    // / Cancel listing 
    // CancelListing {},
}

// ----- State structs -----
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ProgramState {
    pub is_initialized: bool,
    pub admin: Pubkey,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ChargerAccount {
    pub is_initialized: bool,
    pub authority: Pubkey, // owner/operator
    pub code: String,
    pub name: String,
    pub city: String,
    pub address: String,
    pub latitude: f64,
    pub longitude: f64,
    pub power_kw: f32,
    pub rate_points_per_sec: u64,
    pub price_per_sec_lamports: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct DriverAccount {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub amp_balance: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SessionAccount {
    pub is_initialized: bool,
    pub driver: Pubkey,
    pub charger: Pubkey,
    pub start_ts: i64,
    pub end_ts: i64,
    pub points_awarded: u64,
    pub settled: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ListingAccount {
    pub is_initialized: bool,
    pub seller: Pubkey,
    pub nonce: u64,
    pub amount_total: u64,
    pub amount_remaining: u64,
    pub price_per_point_lamports: u64,
}

// ---------- Entrypoint ----------
entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let ix = Instruction::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)?;
    match ix {
        Instruction::Initialize { admin } => instruction_initialize(program_id, accounts, admin),
        Instruction::AddCharger { code, name, city, address, latitude,
            longitude,power_kw,rate_points_per_sec,price_per_sec_lamports,
        } => instruction_add_charger(program_id,accounts,code,name,city,address,
            latitude,longitude,power_kw,rate_points_per_sec,price_per_sec_lamports
        ),
        Instruction::StartSession { start_ts } => instruction_start_session(program_id, accounts, start_ts),
        Instruction::StopSession { end_ts } => instruction_stop_session(program_id, accounts, end_ts),
        Instruction::CreateListing { nonce, amount_points, price_per_point_lamports } => {
            instruction_create_listing(program_id, accounts, nonce, amount_points, price_per_point_lamports)
        }
        // Instruction::BuyFromListing { buy_amount_points } => instruction_buy_from_listing(program_id, accounts, buy_amount_points),
        // Instruction::CancelListing {} => instruction_cancel_listing(program_id, accounts),
    }
}

// ---------- Instruction handlers ----------

fn instruction_initialize(program_id: &Pubkey, accounts: &[AccountInfo], admin: Pubkey) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let admin_signer = next_account_info(account_info_iter)?; // signer
    let state_account = next_account_info(account_info_iter)?; // writable, PDA

    if !admin_signer.is_signer {
        msg!("Admin must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Write state
    let mut state_data = ProgramState::try_from_slice(&state_account.data.borrow()).unwrap_or(ProgramState { is_initialized: false, admin: Pubkey::default() });
    state_data.is_initialized = true;
    state_data.admin = admin;
    state_data.serialize(&mut *state_account.data.borrow_mut())?;

    msg!("Initialized program state");
    Ok(())
}

fn instruction_add_charger(program_id: &Pubkey,accounts: &[AccountInfo],code: String,name: String,
    city: String,address: String,latitude: f64,longitude: f64,power_kw: f32,rate_points_per_sec: u64,price_per_sec_lamports: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?; // signer, will pay reg fee
    let charger_account = next_account_info(account_info_iter)?; // writable PDA
    let admin_account = next_account_info(account_info_iter)?; 
    // let state_account = next_account_info(account_info_iter)?; // writable - to read admin

    if !payer.is_signer {
        msg!("Payer must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }
    msg!("code : {} , address : {}",code,address);
    let seeds=&[b"charger",code.as_bytes().as_ref(), payer.key.as_ref()];
    let (expected_charger_pda_account,bump)=Pubkey::find_program_address(seeds, program_id);
    let seeds_with_bump=&[b"charger", code.as_bytes(), payer.key.as_ref(), &[bump]];
    if expected_charger_pda_account!=*charger_account.key{
        return  Err(ProgramError::InvalidSeeds);
    }
    let rent=Rent::get()?;
    let charger_account_size:usize=1+ 32+
                                   4+ code.len() + 4+ name.len() + 4+ city.len() + 4+ address.len()+
                                   8+ 8+ 4+ 8+ 8;
    let charger_min_bal_for_rent_exempt=rent.minimum_balance(charger_account_size);
    let charger_pda_create_ix=system_instruction::create_account(payer.key,
        charger_account.key, charger_min_bal_for_rent_exempt, charger_account_size as u64, program_id);
        invoke_signed(&charger_pda_create_ix,
        &[payer.clone(), charger_account.clone()], &[seeds_with_bump])?;

    msg!("charger pda created!!");
    // Read state to get admin
    // let state = ProgramState::try_from_slice(&state_account.data.borrow())?;
    // if !state.is_initialized {
    //     msg!("State not initialized");
    //     return Err(ProgramError::UninitializedAccount);
    // }

    // Transfer registration fee from payer -> admin
    msg!("Transferring registration fee: {} lamports", REG_FEE_LAMPORTS);
    // let admin_pubkey = state.admin;
    // let transfer_ix = system_instruction::transfer(payer.key, &admin_pubkey, REG_FEE_LAMPORTS);
    let transfer_ix = system_instruction::transfer(payer.key, admin_account.key, REG_FEE_LAMPORTS);
    invoke(
        &transfer_ix,
        &[ payer.clone(), admin_account.clone()
            // AccountInfo::new(&admin_pubkey, false, true, &mut 0u64, // dummy; not used by invoke because admin account is a system account already in runtime; client must include it as writable account if needed
            //     &mut [], &system_program::ID, false, 0),
        ],
    ).map(|_| ()).map_err(|e| {
        msg!("Registration transfer failed: {:?}", e);
        e
    })?;
    // NOTE: above: in practice the client must pass the admin account info in the accounts list.
    // For clarity, please ensure the client includes state.admin account as writable in the account list.

    // Populate charger account
    let mut charger = ChargerAccount { is_initialized: true, authority: *payer.key,
        code, name, city, address, latitude, longitude, power_kw, rate_points_per_sec, price_per_sec_lamports,
    };
    charger.serialize(&mut *charger_account.data.borrow_mut())?;

    msg!("Charger added by {}", payer.key);
    Ok(())
}


fn instruction_start_session(program_id: &Pubkey, accounts: &[AccountInfo], start_ts: i64) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let user = next_account_info(account_info_iter)?; // signer
    let driver_pda = next_account_info(account_info_iter)?; // signer
    let session_pda = next_account_info(account_info_iter)?; // writable PDA
    let charger_pda = next_account_info(account_info_iter)?; // readonly

    msg!("start ts in contract : {}",start_ts);

    let driver_seeds=&[b"driver",user.key.as_ref()];
    let (expected_driver_pda,bump)=Pubkey::find_program_address(driver_seeds, program_id);
    msg!("expected_driver_pda : {}",expected_driver_pda);
    let driver_seeds_with_bump=&[b"driver",user.key.as_ref(),&[bump]];
    if expected_driver_pda!=*driver_pda.key{
        return Err(ProgramError::InvalidSeeds);
    }

    //Create driver account if it does not exists
    if driver_pda.data_is_empty(){
        let rent=Rent::get()?;
        let driver_pda_account_size:usize=1+ 32+ 8;
        let driver_pda_rent_exempt_bal=rent.minimum_balance(driver_pda_account_size);
        let driver_pda_create_ix=system_instruction::create_account(user.key,
            driver_pda.key, driver_pda_rent_exempt_bal, driver_pda_account_size as u64, program_id);
        invoke_signed(&driver_pda_create_ix,
            &[user.clone(), driver_pda.clone()],
            &[driver_seeds_with_bump])?;
            msg!("driver pda created");
    }

    let driver_data=DriverAccount{owner:*user.key, is_initialized:true, amp_balance:0};
    driver_data.serialize(&mut *driver_pda.data.borrow_mut())?;
    msg!("driver pda data updated"); 

    //Create Session account if it does not exists
    let start_ts_bytes=start_ts.to_le_bytes();
    let session_seeds=&[b"session",charger_pda.key.as_ref(), driver_pda.key.as_ref(),start_ts_bytes.as_ref()];
    let (expected_session_pda,bump)=Pubkey::find_program_address(session_seeds, program_id);
    msg!("expected_session_pda : {}",expected_session_pda);
    let session_seeds_with_bump=&[b"session",charger_pda.key.as_ref(), driver_pda.key.as_ref(),start_ts_bytes.as_ref(),&[bump]];
    if expected_session_pda!=*session_pda.key{
        return Err(ProgramError::InvalidSeeds);
    }
    
    let rent=Rent::get()?;
    let session_pda_account_size:usize=1+ 32+ 32+ 8+ 8+ 8+ 1;
    let session_pda_rent_exempt_bal=rent.minimum_balance(session_pda_account_size);
    let session_pda_create_ix=system_instruction::create_account(user.key,
        session_pda.key, session_pda_rent_exempt_bal, session_pda_account_size as u64, program_id);
    invoke_signed(&session_pda_create_ix,
        &[user.clone(), session_pda.clone()],
        &[session_seeds_with_bump])?;
    msg!("session pda created");

    // Verify charger exists
    let charger = ChargerAccount::try_from_slice(&charger_pda.data.borrow())?;
    if !charger.is_initialized {
        msg!("Charger not initialized");
        return Err(ProgramError::UninitializedAccount);
    }

    // Create session record
    let session = SessionAccount {is_initialized: true, driver: *driver_pda.key,
        charger: *charger_pda.key, start_ts, end_ts: 0, points_awarded: 0, settled: false,
    };
    session.serialize(&mut *session_pda.data.borrow_mut())?;
    msg!("Session started at {}", start_ts);
    Ok(())
}

fn instruction_stop_session(program_id: &Pubkey, accounts: &[AccountInfo], end_ts: i64) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?; // signer
    let session_account = next_account_info(account_info_iter)?; // writable
    let driver_pda = next_account_info(account_info_iter)?; // writable DriverAccount PDA
    let charger_pda = next_account_info(account_info_iter)?; // writable ChargerAccount
    let charger_owner_account = next_account_info(account_info_iter)?; // writable receiver
    let system_program_acc = next_account_info(account_info_iter)?;

    if !user.is_signer {
        msg!("Driver must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut session = SessionAccount::try_from_slice(&session_account.data.borrow())?;
    if !session.is_initialized {
        msg!("Session not inited");
        return Err(ProgramError::UninitializedAccount);
    }
    if session.settled {
        msg!("Session already settled");
        return Err(ProgramError::InvalidAccountData);
    }

    // compute duration
    let start = session.start_ts;
    if end_ts <= start {
        msg!("Invalid end_ts");
        return Err(ProgramError::InvalidArgument);
    }
    let duration_secs = (end_ts - start) as u64;

    // read charger to get rates
    let charger = ChargerAccount::try_from_slice(&charger_pda.data.borrow())?;
    if !charger.is_initialized {
        msg!("Charger uninitialized");
        return Err(ProgramError::UninitializedAccount);
    }

    // total payment lamports
    let total_price = charger.price_per_sec_lamports.checked_mul(duration_secs).ok_or(ProgramError::InvalidArgument)?;
    msg!("Total price (lamports) for session: {}", total_price);

    // Transfer lamports from driver -> charger owner
    // driver must sign; include both driver and charger_owner in accounts
    let transfer_ix = system_instruction::transfer(user.key, &charger.authority, total_price);
    invoke(
        &transfer_ix,
        &[
            user.clone(),
            charger_owner_account.clone(), // MUST be the same pubkey as charger.authority; client must pass it
            system_program_acc.clone(),
        ],
    )?;

    // credit points to driver account
    let points_awarded = charger.rate_points_per_sec.checked_mul(duration_secs).ok_or(ProgramError::InvalidArgument)?;
    let mut drv_acc = DriverAccount::try_from_slice(&driver_pda.data.borrow())?;

    // sanity: driver_account.owner must match signer
    if drv_acc.owner != *user.key && drv_acc.owner != Pubkey::default() {
        msg!("Driver account owner mismatch");
        return Err(ProgramError::IllegalOwner);
    }
   
    drv_acc.amp_balance = drv_acc.amp_balance.checked_add(points_awarded).ok_or(ProgramError::InvalidArgument)?;
    drv_acc.serialize(&mut *driver_pda.data.borrow_mut())?;

    // update session
    session.end_ts = end_ts;
    session.points_awarded = points_awarded;
    session.settled = true;
    session.serialize(&mut *session_account.data.borrow_mut())?;

    msg!("Stopped session. awarded {} points", points_awarded);
    Ok(())
}

fn instruction_create_listing(program_id: &Pubkey, accounts: &[AccountInfo], nonce: u64, amount_points: u64, price_per_point_lamports: u64) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user = next_account_info(account_info_iter)?; // signer
    let driver_pda = next_account_info(account_info_iter)?; // writable DriverAccount PDA
    let listing_pda = next_account_info(account_info_iter)?; // writable listing PDA

    if !user.is_signer {
        msg!("Seller must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // load seller driver acc
    let mut drv_acc = DriverAccount::try_from_slice(&driver_pda.data.borrow()).map_err(|_| ProgramError::UninitializedAccount)?;
    if !drv_acc.is_initialized {
        msg!("Seller driver account not init");
        return Err(ProgramError::UninitializedAccount);
    }
    if drv_acc.owner != *user.key {
        msg!("Seller does not own driver account");
        return Err(ProgramError::IllegalOwner);
    }
    if drv_acc.amp_balance < amount_points {
        msg!("Insufficient points to create listing");
        return Err(ProgramError::InsufficientFunds);
    }

    // deduct points into listing reservation
    drv_acc.amp_balance = drv_acc.amp_balance.checked_sub(amount_points).ok_or(ProgramError::InvalidArgument)?;
    drv_acc.serialize(&mut *driver_pda.data.borrow_mut())?;


    let nonce_bytes=nonce.to_le_bytes();
    let listing_seeds=&[b"listing", user.key.as_ref(), nonce_bytes.as_ref()];
    let (expected_listing_pda_account,bump)=Pubkey::find_program_address(listing_seeds, program_id);
    let listing_seeds_with_bump=&[b"listing", user.key.as_ref(), nonce_bytes.as_ref(), &[bump]];
    if expected_listing_pda_account!=*listing_pda.key{
        return  Err(ProgramError::InvalidSeeds);
    }
    let rent=Rent::get()?;
    let listing_account_size:usize=1+ 32+ 8+ 8+ 8+ 8;
    let listing_min_bal_for_rent_exempt=rent.minimum_balance(listing_account_size);
    let listing_pda_create_ix=system_instruction::create_account(user.key,
        listing_pda.key, listing_min_bal_for_rent_exempt, listing_account_size as u64, program_id);
        invoke_signed(&listing_pda_create_ix,
        &[user.clone(), listing_pda.clone()],
        &[listing_seeds_with_bump])?;

    msg!("listing pda created!!");
    // const LISTING_SEED: &[u8] = b"listing"; // + seller_pubkey + nonce

    let listing = ListingAccount {
        is_initialized: true,
        seller: *user.key,
        nonce,
        amount_total: amount_points,
        amount_remaining: amount_points,
        price_per_point_lamports,
    };
    listing.serialize(&mut *listing_pda.data.borrow_mut())?;
    msg!("Listing created: {} points at {} lamports each", amount_points, price_per_point_lamports);
    Ok(())
}

fn instruction_buy_from_listing(program_id: &Pubkey, accounts: &[AccountInfo], buy_amount_points: u64) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let buyer = next_account_info(account_info_iter)?; // signer
    let buyer_driver_acc = next_account_info(account_info_iter)?; // writable buyer DriverAccount PDA
    let listing_acc = next_account_info(account_info_iter)?; // writable listing PDA
    let seller_account = next_account_info(account_info_iter)?; // writable seller pubkey to receive lamports
    let system_program_acc = next_account_info(account_info_iter)?;

    if !buyer.is_signer {
        msg!("Buyer must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut listing = ListingAccount::try_from_slice(&listing_acc.data.borrow()).map_err(|_| ProgramError::UninitializedAccount)?;
    if !listing.is_initialized {
        msg!("Listing not initialized");
        return Err(ProgramError::UninitializedAccount);
    }
    if buy_amount_points == 0 || buy_amount_points > listing.amount_remaining {
        msg!("Invalid buy amount");
        return Err(ProgramError::InvalidArgument);
    }

    // total price
    let total_price = listing.price_per_point_lamports.checked_mul(buy_amount_points).ok_or(ProgramError::InvalidArgument)?;
    msg!("Buyer must pay {} lamports", total_price);

    // transfer lamports from buyer -> seller
    let transfer_ix = system_instruction::transfer(buyer.key, &listing.seller, total_price);
    invoke(
        &transfer_ix,
        &[
            buyer.clone(),
            seller_account.clone(), // client must pass listing.seller account
            system_program_acc.clone(),
        ],
    )?;

    // credit points to buyer driver account
    let mut buyer_drv = DriverAccount::try_from_slice(&buyer_driver_acc.data.borrow()).unwrap_or(DriverAccount {
        is_initialized: true,
        owner: *buyer.key,
        amp_balance: 0,
    });
    if buyer_drv.owner != *buyer.key && buyer_drv.owner != Pubkey::default() {
        msg!("Buyer driver owner mismatch");
        return Err(ProgramError::IllegalOwner);
    }
    buyer_drv.is_initialized = true;
    buyer_drv.owner = *buyer.key;
    buyer_drv.amp_balance = buyer_drv.amp_balance.checked_add(buy_amount_points).ok_or(ProgramError::InvalidArgument)?;
    buyer_drv.serialize(&mut *buyer_driver_acc.data.borrow_mut())?;

    // reduce listing remaining
    listing.amount_remaining = listing.amount_remaining.checked_sub(buy_amount_points).ok_or(ProgramError::InvalidArgument)?;
    listing.serialize(&mut *listing_acc.data.borrow_mut())?;
    msg!("Buyer purchased {} points", buy_amount_points);
    Ok(())
}

fn instruction_cancel_listing(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let seller = next_account_info(account_info_iter)?; // signer
    let seller_driver_acc = next_account_info(account_info_iter)?; // writable
    let listing_acc = next_account_info(account_info_iter)?; // writable

    if !seller.is_signer {
        msg!("Seller must sign");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut listing = ListingAccount::try_from_slice(&listing_acc.data.borrow()).map_err(|_| ProgramError::UninitializedAccount)?;
    if listing.seller != *seller.key {
        msg!("Only listing seller can cancel");
        return Err(ProgramError::IllegalOwner);
    }

    let remaining = listing.amount_remaining;
    if remaining > 0 {
        // return remaining points to seller driver account
        let mut drv = DriverAccount::try_from_slice(&seller_driver_acc.data.borrow()).unwrap_or(DriverAccount {
            is_initialized: true,
            owner: *seller.key,
            amp_balance: 0,
        });
        if drv.owner != *seller.key && drv.owner != Pubkey::default() {
            msg!("Seller driver owner mismatch");
            return Err(ProgramError::IllegalOwner);
        }
        drv.amp_balance = drv.amp_balance.checked_add(remaining).ok_or(ProgramError::InvalidArgument)?;
        drv.serialize(&mut *seller_driver_acc.data.borrow_mut())?;
    }

    // zero out listing
    listing.amount_remaining = 0;
    listing.serialize(&mut *listing_acc.data.borrow_mut())?;
    msg!("Listing canceled, returned {} points", remaining);
    Ok(())
}
