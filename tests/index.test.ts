import { clusterApiUrl, Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {beforeAll, describe, test} from "bun:test";
import * as borsh from "borsh";
import * as web3 from "@solana/web3.js";
import * as bs58 from "bs58";

let chargerAddSchema:borsh.Schema={
    struct:{
        code: 'string',
        name: 'string',
        city: 'string',
        address: 'string',
        latitude: 'f64',
        longitude: 'f64',
        power_kw: 'f32',
        rate_points_per_sec: 'u64',
        price_per_sec_lamports: 'u64',
    }
}
let chargerSchema:borsh.Schema={
    struct:{
        accountType: 'u8',
        is_initialized: 'bool',
        authority: {array:{type:'u8',len:32}}, 
        code: 'string',
        name: 'string',
        city: 'string',
        address: 'string',
        latitude: 'f64',
        longitude: 'f64',
        power_kw: 'f32',
        rate_points_per_sec: 'u64',
        price_per_sec_lamports: 'u64',
    }
}
let sessionIxSchema:borsh.Schema={
    struct:{time:'i64'}
};

let sessionSchema:borsh.Schema={
    struct:{
        accountType: 'u8',
        is_initialized: 'bool',
        driver: {array:{type:'u8',len:32}},
        charger: {array:{type:'u8',len:32}},
        start_ts: 'i64',
        end_ts: 'i64',
        points_awarded: 'u64',
        settled: 'bool',
    }
}
let driverSchema:borsh.Schema={
    struct:{
        accountType: 'u8',
        is_initialized: 'bool',
        owner: {array:{type:'u8',len:32}},
        amp_balance: 'u64',
    }
}

let createListingIxSchema:borsh.Schema={
    struct:{
        amount_points: 'u64',
        price_per_point_lamports: 'u64'
    }
};
let listingSchema:borsh.Schema={
    struct:{
        accountType: 'u8',
        is_initialized: 'bool',
        seller: {array:{type:'u8',len:32}},
        amount_total: 'u64',
        price_per_point_lamports: 'u64',
    }
};

let buyListingIxSchema:borsh.Schema={
    struct:{buy_points:'u64'}
};
let userSchema:borsh.Schema={
    struct:{
        accountType: 'u8',
        amp_balance: 'u64',
    }
}

describe("Charge2Earn tests",()=>{
    let connection:Connection;
    let user:Keypair;
    let energyProgram:PublicKey;

    let chargerPda:PublicKey;
    let driverPda:PublicKey;
    let sessionPda:PublicKey;
    let chargerCode:string;
    let start_ts:number;
    let end_ts:number;
    let bump;

    beforeAll(()=>{
        connection=new Connection(clusterApiUrl("devnet"));
        user=Keypair.fromSecretKey(Uint8Array.from([48,182,182,234,169,224,236,113,52,199,47,66,39,2,163,52,183,44,45,27,127,49,133,151,64,70,248,16,46,218,234,198,42,180,5,68,243,235,189,56,197,37,17,85,205,189,100,191,64,74,171,3,37,193,199,195,213,54,156,198,228,15,248,188]));
        energyProgram=new PublicKey("9kH9wQbeFXKr1FQ9jcQv51F5wn2XP9D2MVx7CFa72mfr");

        chargerCode="xyz40";
        [chargerPda,bump]=PublicKey.findProgramAddressSync([Buffer.from("charger1"), Buffer.from(chargerCode), user.publicKey.toBuffer()],energyProgram);
        console.log("charger pda : ",chargerPda.toBase58());
        
        [driverPda, bump]=PublicKey.findProgramAddressSync([Buffer.from("driver1"),user.publicKey.toBuffer()],energyProgram);
        console.log("driver  pda : ",driverPda.toBase58());
        
        start_ts=123;
        end_ts=153;
        let serialised_start_ts=borsh.serialize(sessionIxSchema,{time:start_ts})
        console.log('serialised_start_ts : ',serialised_start_ts);
        
        [sessionPda,bump]=PublicKey.findProgramAddressSync([Buffer.from("session1"),chargerPda.toBuffer(), driverPda.toBuffer(), serialised_start_ts],energyProgram);
        console.log("session pda : ",sessionPda.toBase58());
    }),
    
    test("add charger",async()=>{
        let adminPrivateKey="DXJYMJbWPNisrpUEK3dQragXgcofQjRk95jYafoCBYA6FL3M13SW5azpaJQXxvxfwqxvycD7Qt8V9wNLPm1UK2j";
        let adminkp=bs58.default.decode(adminPrivateKey);
        let admin=Keypair.fromSecretKey(adminkp);

        let serialisedChargerData=borsh.serialize(chargerAddSchema, {code: chargerCode, name: 'charger3',city: 'jaipur1', address: 'jaipur, Rajasthan', latitude: 34.5, longitude: 67.8, power_kw: 3.4,rate_points_per_sec: 45,price_per_sec_lamports: 78});

        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isWritable:true, isSigner:true},
                {pubkey:chargerPda, isWritable:true, isSigner:false},
                {pubkey:admin.publicKey, isWritable:true, isSigner:false},
                {pubkey:SystemProgram.programId, isWritable:false, isSigner:false}
            ],
            data:Buffer.concat([Buffer.from([0]) , serialisedChargerData])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log('add charger tx : ',txStatus);

        let chargerData=await connection.getAccountInfo(chargerPda);
        let deserialisedChargerData=borsh.deserialize(chargerSchema,chargerData?.data);
        console.log('deserialisedChargerData : ',deserialisedChargerData);
        
    })
    ,
    test("start charging session",async()=>{
        let serialised_start_ts=borsh.serialize(sessionIxSchema,{time:start_ts})
        console.log('serialised_start_ts : ',serialised_start_ts);
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:sessionPda, isSigner:false, isWritable:true},
                {pubkey:chargerPda, isSigner:false, isWritable:false},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([Buffer.from([1]), serialised_start_ts])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("starts session tx : ",txStatus);
        
        
        let sessionData=await connection.getAccountInfo(sessionPda);
        let deserialisedSessionData=borsh.deserialize(sessionSchema,sessionData?.data);
        console.log('deserialisedSessionData : ',deserialisedSessionData);

        let driverData=await connection.getAccountInfo(driverPda);
        let deserialisedDriverData=borsh.deserialize(driverSchema,driverData?.data);
        console.log('deserialisedDriverData : ',deserialisedDriverData);
    })
    ,
    test("end charging session",async()=>{
        let chargerOwner=new PublicKey("BWkUkMnQB449fXF8JVnHTejsbcDrL2i11ut876q1t6w");

        let serialised_end_ts=borsh.serialize(sessionIxSchema,{time:end_ts})
        console.log('serialised_end_ts : ',serialised_end_ts);
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:sessionPda, isSigner:false, isWritable:true},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:chargerPda, isSigner:false, isWritable:false},
                {pubkey:chargerOwner, isSigner:false, isWritable:false},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([Buffer.from([2]), serialised_end_ts])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("stop session tx : ",txStatus);
        
        
        let sessionData=await connection.getAccountInfo(sessionPda);
        let deserialisedSessionData=borsh.deserialize(sessionSchema,sessionData?.data);
        console.log('deserialisedSessionData : ',deserialisedSessionData);

        let driverData=await connection.getAccountInfo(driverPda);
        let deserialisedDriverData=borsh.deserialize(driverSchema,driverData?.data);
        console.log('deserialisedDriverData : ',deserialisedDriverData);
    })
    ,
    test("create listing",async()=>{
        let [listingPda,bump]=PublicKey.findProgramAddressSync([Buffer.from("listing1"),user.publicKey.toBuffer()],energyProgram);
        
        let serialisedListingData=borsh.serialize(createListingIxSchema,{amount_points: 145, price_per_point_lamports: 45})
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:listingPda, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([Buffer.from([3]), serialisedListingData])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("create listing tx : ",txStatus);
        
        
        let listingData=await connection.getAccountInfo(listingPda);
        let deserialisedListingData=borsh.deserialize(listingSchema,listingData?.data);
        console.log('deserialisedListingData : ',deserialisedListingData);

        let driverData=await connection.getAccountInfo(driverPda);
        let deserialisedDriverData=borsh.deserialize(driverSchema,driverData?.data);
        console.log('deserialisedDriverData : ',deserialisedDriverData);
    })
    ,
    test("create second listing",async()=>{
        let [listingPda,bump]=PublicKey.findProgramAddressSync([Buffer.from("listing1"),user.publicKey.toBuffer()],energyProgram);
        
        let serialisedListingData=borsh.serialize(createListingIxSchema,{amount_points: 175, price_per_point_lamports: 30})
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:listingPda, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([Buffer.from([3]), serialisedListingData])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("create second listing tx : ",txStatus);
        
        
        let listingData=await connection.getAccountInfo(listingPda);
        let deserialisedListingData=borsh.deserialize(listingSchema,listingData?.data);
        console.log('deserialisedListingData : ',deserialisedListingData);

        let driverData=await connection.getAccountInfo(driverPda);
        let deserialisedDriverData=borsh.deserialize(driverSchema,driverData?.data);
        console.log('deserialisedDriverData : ',deserialisedDriverData);
    })
    ,
    test("buy listing",async()=>{
        let [listingPda,bump1]=PublicKey.findProgramAddressSync([Buffer.from("listing1"),user.publicKey.toBuffer()],energyProgram);
        let [userPda,bump2]=PublicKey.findProgramAddressSync([Buffer.from("user1"),user.publicKey.toBuffer()],energyProgram);
        console.log("user pda : ",userPda.toBase58());
        
        let serialisedBuyListingData=borsh.serialize(buyListingIxSchema,{buy_points: 135})
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:userPda, isSigner:false, isWritable:true},
                {pubkey:listingPda, isSigner:false, isWritable:true},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([Buffer.from([4]), serialisedBuyListingData])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("buy listing tx : ",txStatus);
        
        
        let listingData=await connection.getAccountInfo(listingPda);
        let deserialisedListingData=borsh.deserialize(listingSchema,listingData?.data);
        console.log('deserialisedListingData : ',deserialisedListingData);

        let userPdaData=await connection.getAccountInfo(userPda);
        let deserialisedUserData=borsh.deserialize(userSchema,userPdaData?.data);
        console.log('deserialisedUserData : ',deserialisedUserData);
    })
    ,
    test("cancel listing",async()=>{
        let [listingPda,bump1]=PublicKey.findProgramAddressSync([Buffer.from("listing1"),user.publicKey.toBuffer()],energyProgram);
        
        let ix=new TransactionInstruction({
            programId:energyProgram,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:driverPda, isSigner:false, isWritable:true},
                {pubkey:listingPda, isSigner:false, isWritable:true},
            ],
            data:Buffer.from([5])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"finalized");
        console.log("cancel listing tx : ",txStatus);
        
        let listingData=await connection.getAccountInfo(listingPda);
        let deserialisedListingData=borsh.deserialize(listingSchema,listingData?.data);
        console.log('deserialisedListingData : ',deserialisedListingData);

        let driverPdaData=await connection.getAccountInfo(driverPda);
        let deserialisedDriverData=borsh.deserialize(driverSchema,driverPdaData?.data);
        console.log('deserialisedDriverData : ',deserialisedDriverData);
    }),
    
    test("get ac info",async()=>{
            let driverPdaData=await connection.getAccountInfo(driverPda);
            let deserialisedDriverData=borsh.deserialize(driverSchema,driverPdaData?.data);
            console.log('deserialisedDriverData : ',deserialisedDriverData);
    })

})