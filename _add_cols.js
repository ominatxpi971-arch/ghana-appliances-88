const https = require('https')

const SUPABASE_URL = 'henhsucxsfijzxzcbzrh.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlbmhzdWN4c2Zpanp4emNienJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYwOTYzMCwiZXhwIjoyMDk0MTg1NjMwfQ.ueWVsoboCMTcrH4aR4PkLy0LMTBCGyT6EP3PvCxWjOI'

function sql(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query })
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Prefer': 'return=minimal',
        'Content-Profile': 'rpc'
      }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function run() {
  try {
    await sql('ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT')
    console.log('Added tracking_number')
  } catch(e) { console.log('tracking_number:', e.message) }
  try {
    await sql('ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT')
    console.log('Added tracking_url')
  } catch(e) { console.log('tracking_url:', e.message) }
}
run()
