import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import argon2 from "argon2";
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const sm = new SecretsManagerClient({ region: process.env.AWS_REGION });
const SECRET_ID = process.env.GLOBAL_SECRET_ID!;

let cached: string | null = null, last = 0; const TTL = 60_000;
let refreshing: Promise<void> | null = null;

async function fetchSecret() {
    const r = await sm.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));
    if (!r.SecretString) throw new Error("Missing SecretString");
    cached = r.SecretString; last = Date.now();
}

export async function getGlobalHash(): Promise<string> {
    const now = Date.now();
    if (cached && now - last < TTL) return cached;
    if (cached && !refreshing) refreshing = fetchSecret().finally(() => (refreshing = null));
    if (!cached && !refreshing) await fetchSecret();
    return cached!;
}

// * Sets global password for all users, only accessible by admins
export const setGlobalHash: any = async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
  try {
    const newHash = await argon2.hash(req.body.passphrase);
    await sm.send(new PutSecretValueCommand({ SecretId: SECRET_ID, SecretString: newHash }));
    cached = newHash;
    last = Date.now();
    return res.status(200).json({ message: "Global passphrase updated" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
