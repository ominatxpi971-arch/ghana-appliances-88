const { Pool } = require("pg")
const fs = require("fs")
const path = require("path")

const pool = new Pool({
  host: "aws-0-us-west-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.henhsucxsfijzxzcbzrh",
  password: "H3vwGHQ98aGyghkW",
  ssl: { rejectUnauthorized: false, sslmode: 'require' },
  connectionTimeoutMillis: 10000
})

async function main() {
  try {
    const res = await pool.query("SELECT 1 as test")
    console.log("Connected!", res.rows)
    
    const files = ["migration-v5.sql","migration-v6.sql","migration-v7.sql","migration-v8.sql","migration-v9.sql"]
    for (const f of files) {
      const sql = fs.readFileSync(path.join(__dirname, "supabase", f), "utf8")
      console.log(`Running ${f}...`)
      try {
        await pool.query(sql)
        console.log(`  OK`)
      } catch(e) {
        const m = e.message.split('\n')[0]
        if (m.includes('already exists') || m.includes('duplicate')) console.log(`  Skipped`)
        else console.log(`  ${m}`)
      }
    }
    console.log("All done!")
  } catch(e) {
    console.log("FAIL:", e.message.split('\n')[0])
  } finally {
    await pool.end()
  }
}

main()