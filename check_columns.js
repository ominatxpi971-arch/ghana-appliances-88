const net = require('net');

// Test direct TCP connectivity
try {
  const sock = net.createConnection({ host: 'db.henhsucxsfijzxzcbzrh.supabase.co', port: 5432, timeout: 5000 }, () => {
    console.log('Direct DB TCP: CONNECTED');
    sock.destroy();
  });
  sock.on('error', (e) => console.log('Direct DB TCP:', e.message));
  sock.on('timeout', () => { console.log('Direct DB TCP: TIMEOUT'); sock.destroy(); });
} catch(e) { console.log('Direct DB:', e.message); }

// Test pooler TCP
try {
  const sock2 = net.createConnection({ host: 'aws-0-us-west-1.pooler.supabase.com', port: 6543, timeout: 5000 }, () => {
    console.log('Pooler us-west-1 TCP: CONNECTED');
    sock2.destroy();
  });
  sock2.on('error', (e) => console.log('Pooler us-west-1 TCP:', e.message));
  sock2.on('timeout', () => { console.log('Pooler us-west-1 TCP: TIMEOUT'); sock2.destroy(); });
} catch(e) { console.log('Pooler:', e.message); }
