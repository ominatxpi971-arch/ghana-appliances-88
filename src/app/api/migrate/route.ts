import { NextResponse } from "next/server";

const DB_PASSWORD = "H3vwGHQ98aGyghkW";
const PROJECT_REF = "henhsucxsfijzxzcbzrh";

export async function GET() {
  const hosts = [
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-east-2.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-sa-east-1.pooler.supabase.com",
  ];

  for (const host of hosts) {
    try {
      const { Client } = await import("pg");
      const client = new Client({
        host,
        port: 5432,
        user: `postgres.${PROJECT_REF}`,
        password: DB_PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await client.connect();
      const result = await client.query(
        "ALTER TABLE customer_profiles DROP COLUMN IF EXISTS postal_code;"
      );
      await client.end();
      return NextResponse.json({ success: true, host, command: result.command });
    } catch (e: any) {
      if (e.message?.includes("tenant") || e.message?.includes("not found")) {
        continue; // wrong region, try next
      }
      return NextResponse.json({ success: false, host, error: e.message?.slice(0, 200) });
    }
  }
  return NextResponse.json({ success: false, error: "All pooler hosts failed" });
}
