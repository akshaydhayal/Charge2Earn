import { Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import * as borsh from "borsh";
import { PROGRAM_ID } from "./config";

export const PROGRAM_PUBKEY = new PublicKey(PROGRAM_ID);

// ----- Schemas (match program/tests) -----
const chargerAddSchema: borsh.Schema = {
  struct: {
    code: "string",
    name: "string",
    city: "string",
    address: "string",
    latitude: "f64",
    longitude: "f64",
    power_kw: "f32",
    rate_points_per_sec: "u64",
    price_per_sec_lamports: "u64",
  },
};

const sessionIxSchema: borsh.Schema = { struct: { time: "i64" } };

const createListingIxSchema: borsh.Schema = {
  struct: { amount_points: "u64", price_per_point_lamports: "u64" },
};

const buyListingIxSchema: borsh.Schema = { struct: { buy_points: "u64" } };

const chargerAccountSchema: borsh.Schema = {
  struct: {
    account_type: "u8",
    is_initialized: "bool",
    authority: { array: { type: "u8", len: 32 } },
    code: "string",
    name: "string",
    city: "string",
    address: "string",
    latitude: "f64",
    longitude: "f64",
    power_kw: "f32",
    rate_points_per_sec: "u64",
    price_per_sec_lamports: "u64",
  },
};

export type ChargerAccount = {
  account_type: number;
  is_initialized: boolean;
  authority: Uint8Array; // 32
  code: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  power_kw: number;
  rate_points_per_sec: bigint;
  price_per_sec_lamports: bigint;
};

export async function fetchChargers(connection: Connection) {
  const accounts = await connection.getProgramAccounts(PROGRAM_PUBKEY);
  const items: Array<{ pubkey: PublicKey; data: ChargerAccount }> = [];
  for (const acc of accounts) {
    try {
      const data = borsh.deserialize(chargerAccountSchema, acc.account.data) as ChargerAccount;
      if (data && data.is_initialized && data.account_type === 1) {
        items.push({ pubkey: acc.pubkey, data });
      }
    } catch {
      // not a charger account; skip
    }
  }
  return items;
}

export async function fetchChargerByPda(connection: Connection, chargerPda: PublicKey): Promise<ChargerAccount | null> {
  const info = await connection.getAccountInfo(chargerPda);
  if (!info?.data) return null;
  try {
    const data = borsh.deserialize(chargerAccountSchema, info.data) as ChargerAccount;
    if (data.account_type !== 1 || !data.is_initialized) return null;
    return data;
  } catch {
    return null;
  }
}

const listingAccountSchema: borsh.Schema = {
  struct: {
    account_type: "u8",
    is_initialized: "bool",
    seller: { array: { type: "u8", len: 32 } },
    amount_total: "u64",
    price_per_point_lamports: "u64",
  },
};

export type ListingAccount = {
  account_type: number;
  is_initialized: boolean;
  seller: Uint8Array;
  amount_total: bigint;
  price_per_point_lamports: bigint;
};

export async function fetchListings(connection: Connection) {
  // ListingAccount has fixed size: 49 bytes; filter client-side to avoid RPC quirks
  const accounts = await connection.getProgramAccounts(PROGRAM_PUBKEY);
  const items: Array<{ pubkey: PublicKey; data: ListingAccount }> = [];
  for (const acc of accounts) {
    try {
      // new layout adds 1-byte account_type at the beginning; minimum size now 50 bytes
      if (acc.account.data.length < 50) continue;
      const buf = acc.account.data.subarray(0, 50);
      const data = borsh.deserialize(listingAccountSchema, buf) as ListingAccount;
      if (data && data.account_type === 4 && data.is_initialized && data.amount_total > BigInt(0)) {
        items.push({ pubkey: acc.pubkey, data });
      }
    } catch {
      // not a listing account; skip
    }
  }
  return items;
}

const driverAccountSchema: borsh.Schema = {
  struct: {
    account_type: "u8",
    is_initialized: "bool",
    owner: { array: { type: "u8", len: 32 } },
    amp_balance: "u64",
  },
};

export type DriverAccount = {
  account_type: number;
  is_initialized: boolean;
  owner: Uint8Array;
  amp_balance: bigint;
};

export async function fetchDriver(connection: Connection, driverPda: PublicKey): Promise<DriverAccount | null> {
  const info = await connection.getAccountInfo(driverPda);
  if (!info?.data) return null;
  try {
    return borsh.deserialize(driverAccountSchema, info.data) as DriverAccount;
  } catch {
    return null;
  }
}

// ----- PDA helpers -----
export function findChargerPda(code: string, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("charger1"), Buffer.from(code), owner.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findDriverPda(owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("driver1"), owner.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findSessionPda(chargerPda: PublicKey, driverPda: PublicKey, startTs: number) {
  const serialized = borsh.serialize(sessionIxSchema, { time: BigInt(startTs) });
  return PublicKey.findProgramAddressSync(
    [Buffer.from("session1"), chargerPda.toBuffer(), driverPda.toBuffer(), Buffer.from(serialized)],
    PROGRAM_PUBKEY
  );
}

export function findListingPda(seller: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing1"), seller.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findUserPda(user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user1"), user.toBuffer()],
    PROGRAM_PUBKEY
  );
}

// ----- Instruction builders -----
export function ixAddCharger(params: {
  payer: PublicKey;
  chargerPda: PublicKey;
  admin: PublicKey;
  data: {
    code: string;
    name: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    power_kw: number;
    rate_points_per_sec: bigint | number;
    price_per_sec_lamports: bigint | number;
  };
}) {
  const data = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(
      borsh.serialize(chargerAddSchema, {
        ...params.data,
        rate_points_per_sec: BigInt(params.data.rate_points_per_sec),
        price_per_sec_lamports: BigInt(params.data.price_per_sec_lamports),
      })
    ),
  ]);
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.chargerPda, isSigner: false, isWritable: true },
      { pubkey: params.admin, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function ixStartSession(params: {
  user: PublicKey;
  driverPda: PublicKey;
  sessionPda: PublicKey;
  chargerPda: PublicKey;
  startTs: number;
}) {
  const payload = Buffer.from(borsh.serialize(sessionIxSchema, { time: BigInt(params.startTs) }));
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.user, isSigner: true, isWritable: false },
      { pubkey: params.driverPda, isSigner: false, isWritable: true },
      { pubkey: params.sessionPda, isSigner: false, isWritable: true },
      { pubkey: params.chargerPda, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([1]), payload]),
  });
}

export function ixStopSession(params: {
  user: PublicKey;
  sessionPda: PublicKey;
  driverPda: PublicKey;
  chargerPda: PublicKey;
  chargerOwner: PublicKey;
  endTs: number;
}) {
  const payload = Buffer.from(borsh.serialize(sessionIxSchema, { time: BigInt(params.endTs) }));
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.user, isSigner: true, isWritable: false },
      { pubkey: params.sessionPda, isSigner: false, isWritable: true },
      { pubkey: params.driverPda, isSigner: false, isWritable: true },
      { pubkey: params.chargerPda, isSigner: false, isWritable: true },
      { pubkey: params.chargerOwner, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([2]), payload]),
  });
}

export function ixCreateListing(params: {
  seller: PublicKey;
  driverPda: PublicKey;
  listingPda: PublicKey;
  amountPoints: number | bigint;
  pricePerPointLamports: number | bigint;
}) {
  const payload = Buffer.from(
    borsh.serialize(createListingIxSchema, {
      amount_points: BigInt(params.amountPoints),
      price_per_point_lamports: BigInt(params.pricePerPointLamports),
    })
  );
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.seller, isSigner: true, isWritable: false },
      { pubkey: params.driverPda, isSigner: false, isWritable: true },
      { pubkey: params.listingPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([3]), payload]),
  });
}

export function ixBuyFromListing(params: {
  buyer: PublicKey;
  userPda: PublicKey;
  listingPda: PublicKey;
  sellerPubkey: PublicKey;
  buyPoints: number | bigint;
}) {
  const payload = Buffer.from(borsh.serialize(buyListingIxSchema, { buy_points: BigInt(params.buyPoints) }));
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.buyer, isSigner: true, isWritable: false },
      { pubkey: params.userPda, isSigner: false, isWritable: true },
      { pubkey: params.listingPda, isSigner: false, isWritable: true },
      { pubkey: params.sellerPubkey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([Buffer.from([4]), payload]),
  });
}

export function ixCancelListing(params: {
  seller: PublicKey;
  driverPda: PublicKey;
  listingPda: PublicKey;
}) {
  return new TransactionInstruction({
    programId: PROGRAM_PUBKEY,
    keys: [
      { pubkey: params.seller, isSigner: true, isWritable: false },
      { pubkey: params.driverPda, isSigner: false, isWritable: true },
      { pubkey: params.listingPda, isSigner: false, isWritable: true },
    ],
    data: Buffer.from([5]),
  });
}



