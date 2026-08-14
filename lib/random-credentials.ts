import { randomInt } from 'crypto';

const LOGIN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
// Avoids visually ambiguous characters (0/O, 1/l/I) since this gets read off a phone screen.
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function randomString(chars: string, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += chars[randomInt(chars.length)];
  return out;
}

export function generateLogin(): string {
  return `usr${randomString(LOGIN_CHARS, 8)}`;
}

export function generatePassword(): string {
  return randomString(PASSWORD_CHARS, 12);
}
