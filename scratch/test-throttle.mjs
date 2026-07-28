

async function run() {
  console.log('Sending requests...');
  for (let i = 0; i < 15; i++) {
    const res = await fetch('http://127.0.0.1:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `test-${i}@test.com`, password: 'password123' })
    });
    console.log(`Req ${i}: status=${res.status}`);
    const headers = {};
    res.headers.forEach((val, key) => {
      if (key.includes('ratelimit') || key.includes('retry')) {
        headers[key] = val;
      }
    });
    if (Object.keys(headers).length > 0) {
      console.log('  Headers:', headers);
    }
  }
}

run().catch(console.error);
