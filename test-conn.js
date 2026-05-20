const { Pool } = require("pg")

async function tryConn(host, port, user) {
  const pool = new Pool({
    host, port, database: "postgres", user,
    password: "H3vwGHQ98aGyghkW",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  })
  try {
    const res = await pool.query("SELECT 1")
    console.log(`  OK: ${host}:${port} as ${user}`)
    await pool.end()
    return true
  } catch(e) {
    console.log(`  FAIL: ${host}:${port} - ${e.message.split('\n')[0]}`)
    return false
  }
}

async function main() {
  const ref = "henhsucxsfijzxzcbzrh"
  const combos = [
    ["aws-0-us-west-1.pooler.supabase.com", 6543, `postgres.${ref}`],
    ["aws-0-us-west-1.pooler.supabase.com", 5432, `postgres.${ref}`],
    ["aws-0-ap-southeast-1.pooler.supabase.com", 6543, `postgres.${ref}`],
    [`db.${ref}.supabase.co`, 5432, "postgres"],
    [`db.${ref}.supabase.co`, 6543, "postgres"],
  ]
  for (const [h,p,u] of combos) {
    await tryConn(h, p, u)
  }
}

main()
