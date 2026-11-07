import 'dotenv/config';
import { pool } from '../config/database.js';
import { encryptTotpSecret, hashPassword, makeTotpUri, newTotpSecret, verifyTotp } from '../modules/auth/auth.service.js';

function hiddenInput(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered without echo.');
  }
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') { process.stdin.setRawMode(false); process.exit(130); }
        if (char === '\r' || char === '\n') {
          process.stdin.off('data', onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  const email = (await hiddenInput('Admin email: ')).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
  const password = await hiddenInput('Admin password (at least 15 characters): ');
  if (Buffer.byteLength(password) < 15 || Buffer.byteLength(password) > 1024) throw new Error('Password must be between 15 and 1024 bytes.');
  const secret = newTotpSecret();
  process.stdout.write('\nAdd this authenticator account before continuing (enter the URI manually in your authenticator app):\n');
  process.stdout.write(`${makeTotpUri(secret, email)}\n\n`);
  let step = null;
  for (let tries = 0; tries < 3 && step === null; tries += 1) {
    const code = (await hiddenInput('Authenticator code: ')).trim();
    step = verifyTotp(secret, code);
    if (step === null) process.stdout.write('Code not accepted. Try again.\n');
  }
  if (step === null) throw new Error('Authenticator verification failed; no administrator was created.');

  const passwordHash = await hashPassword(password);
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, totp_secret_enc, totp_last_step, full_name, role, email_verified_at, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', UTC_TIMESTAMP(), 1)`,
      [email, passwordHash, encryptTotpSecret(secret), step, email],
    );
    process.stdout.write(`Admin account created (user id ${result.insertId}). Store the authenticator safely.\n`);
  } finally { connection.release(); await pool.end(); }
}

main().catch(async (error) => {
  console.error(error.message);
  await pool.end().catch(() => {});
  process.exitCode = 1;
});
