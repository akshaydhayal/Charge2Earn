import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
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

// ----- PDA helpers -----
export function findChargerPda(code: string, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("charger"), Buffer.from(code), owner.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findDriverPda(owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("driver"), owner.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findSessionPda(chargerPda: PublicKey, driverPda: PublicKey, startTs: number) {
  const serialized = borsh.serialize(sessionIxSchema, { time: BigInt(startTs) });
  return PublicKey.findProgramAddressSync(
    [Buffer.from("session"), chargerPda.toBuffer(), driverPda.toBuffer(), Buffer.from(serialized)],
    PROGRAM_PUBKEY
  );
}

export function findListingPda(seller: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("listing"), seller.toBuffer()],
    PROGRAM_PUBKEY
  );
}

export function findUserPda(user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), user.toBuffer()],
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
      { pubkey: params.chargerPda, isSigner: false, isWritable: false },
      { pubkey: params.chargerOwner, isSigner: false, isWritable: false },
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



