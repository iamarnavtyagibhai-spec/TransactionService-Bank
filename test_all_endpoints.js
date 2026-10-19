const https = require('https');

function testUrl(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EndpointCheck/1.0',
        ...headers
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, body: body.slice(0, 160) });
      });
    });

    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'Timeout 15s' }); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function checkAll() {
  console.log('Testing Microservices and Endpoints...\n');
  const checks = [
    // UserService
    { name: 'UserService Health', url: 'https://userservice-bank.onrender.com/auth/health' },
    { name: 'UserService Login POST', url: 'https://userservice-bank.onrender.com/auth/login', method: 'POST', data: { email: 'dummy@test.com', password: 'wrong' } },
    
    // AccountService
    { name: 'AccountService Root', url: 'https://accountservice-bank-f76c.onrender.com/accounts' },
    { name: 'AccountService Health', url: 'https://accountservice-bank-f76c.onrender.com/health' },

    // TransactionService
    { name: 'TransactionService Health', url: 'https://transactionservice-bank-oxbz.onrender.com/health' },
    { name: 'TransactionService Risk Assess', url: 'https://transactionservice-bank-oxbz.onrender.com/transactions/assess-risk', method: 'POST', data: { amount: 500, senderAccount: 'ACC001', receiverAccount: 'ACC002', ipAddress: '127.0.0.1', deviceFingerprint: 'DEV_TEST' } },
    { name: 'TransactionService Auth Proxy', url: 'https://transactionservice-bank-oxbz.onrender.com/auth/login', method: 'POST', data: { email: 'dummy@test.com', password: 'wrong' } },

    // GitHub Pages Frontend
    { name: 'Frontend GitHub Pages', url: 'https://iamarnavtyagibhai-spec.github.io/TransactionService-Bank/' }
  ];

  for (const c of checks) {
    const res = await testUrl(c.url, c.method, c.data);
    const detail = res.error ? `ERROR: ${res.error}` : `HTTP ${res.status} | Body: ${res.body.replace(/\r?\n/g, ' ')}`;
    console.log(`[${c.name.padEnd(28)}] ${detail}`);
  }
}

checkAll();
