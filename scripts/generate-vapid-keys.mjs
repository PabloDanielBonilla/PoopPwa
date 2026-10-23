#!/usr/bin/env node
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function generateVapidKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  const publicJwk = publicKey.export({ format: 'jwk' });
  const privateJwk = privateKey.export({ format: 'jwk' });

  const exported = {
    publicKey: {
      kty: 'EC',
      crv: 'P-256',
      x: publicJwk.x,
      y: publicJwk.y,
      ext: true,
      key_ops: ['verify'],
    },
    privateKey: {
      kty: 'EC',
      crv: 'P-256',
      x: privateJwk.x,
      y: privateJwk.y,
      d: privateJwk.d,
      ext: true,
      key_ops: ['sign'],
    },
  };

  const applicationServerKey = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(publicJwk.x, 'base64url'),
    Buffer.from(publicJwk.y, 'base64url'),
  ]).toString('base64url');

  return {
    applicationServerKey,
    keysJson: JSON.stringify(exported),
  };
}

function readEnvValue(file, key) {
  if (!existsSync(file)) return '';
  const text = readFileSync(file, 'utf8');
  const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) return '';
  return match[1].replace(/^['"]|['"]$/g, '').trim();
}

function isPlaceholder(value) {
  return (
    !value ||
    value.includes('...') ||
    value.startsWith('YOUR_') ||
    value === 'generate-a-long-random-value'
  );
}

function hasRealValue(file, key) {
  return !isPlaceholder(readEnvValue(file, key));
}

function upsertEnv(file, key, value, quote = '"') {
  const line = `${key}=${quote}${value}${quote}`;
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(text)) {
    writeFileSync(file, text.replace(pattern, () => line));
  } else {
    writeFileSync(file, `${text.trimEnd()}\n${line}\n`);
  }
}

const { applicationServerKey, keysJson } = generateVapidKeys();
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@poop.lol';

if (!process.argv.includes('--write')) {
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${applicationServerKey}"`);
  console.log(`VAPID_KEYS_JSON='${keysJson}'`);
  console.log(`VAPID_SUBJECT="${subject}"`);
  process.exit(0);
}

const root = process.cwd();
const localFile = resolve(root, '.env.local');
const functionsFile = resolve(root, '.env.functions');
const force = process.argv.includes('--force');

if (
  !force &&
  (hasRealValue(localFile, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY') ||
    hasRealValue(functionsFile, 'VAPID_KEYS_JSON'))
) {
  console.error(
    'Ya existen llaves VAPID en .env.local o .env.functions. Usa --force para rotarlas.',
  );
  process.exit(1);
}

upsertEnv(localFile, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', applicationServerKey, '"');
upsertEnv(functionsFile, 'VAPID_KEYS_JSON', keysJson, "'");
upsertEnv(functionsFile, 'VAPID_SUBJECT', subject, '"');

console.log('Llaves VAPID escritas en .env.local y .env.functions.');
console.log('No subas .env.functions ni la llave privada al repositorio.');
