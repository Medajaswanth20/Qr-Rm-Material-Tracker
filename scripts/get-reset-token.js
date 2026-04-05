/**
 * Get a password reset token without PowerShell (uses Node's http client).
 * Usage: node get-reset-token.js your@email.com
 * Port comes from Mail.env (PORT=...) — same as Server.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Mail.env') });

const http = require('http');

const emailArg = process.argv[2];
if (!emailArg) {
    console.error('Usage: node get-reset-token.js <email>');
    console.error('Example: node get-reset-token.js rahul@gmail.com');
    process.exit(1);
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const email = String(emailArg).trim().toLowerCase();
const payload = JSON.stringify({ email });

const req = http.request(
    {
        hostname: host,
        port,
        path: '/forgot-password',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    },
    (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            console.log('HTTP status:', res.statusCode);
            console.log('Raw JSON:', body);
            try {
                const j = JSON.parse(body);
                if (j.token) {
                    console.log('\n--- TOKEN (copy below) ---\n' + j.token + '\n');
                } else {
                    console.log('\n(No token)', j.message || j.error || j.hint || '');
                }
            } catch (e) {
                console.error('Could not parse JSON:', e.message);
            }
        });
    }
);

req.on('error', (err) => {
    console.error('Request failed — is the server running? (node Server.js)');
    console.error(err.message);
    process.exit(1);
});

req.write(payload);
req.end();
