const { Client } = require('pg')

async function tryConnect(host, port, label) {
  const client = new Client({
    host, port,
    database: 'postgres',
    user: 'postgres',
    password: 'H3vwGHQ98aGyghkW',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  })
  try {
    await client.connect()
    console.log(label + ' CONNECTED')
    try {
      await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT')
      console.log('  Added tracking_number')
    } catch(e) { console.log('  tracking_number:', e.message) }
    try {
      await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT')
      console.log('  Added tracking_url')
    } catch(e) { console.log('  tracking_url:', e.message) }
    await client.end()
    return true
  } catch(e) {
    console.log(label + ' FAILED:', e.message)
    return false
  }
}

async function run() {
  if (await tryConnect('henhsucxsfijzxzcbzrh.supabase.co', 6543, 'Pooler:6543')) return
  if (await tryConnect('henhsucxsfijzxzcbzrh.supabase.co', 5432, 'Direct:5432')) return
  console.log('All connections failed')
}
run()
