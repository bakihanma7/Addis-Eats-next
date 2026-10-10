// Stand-in user store (in memory, seeded). Replace with a database table.
// Passwords are stored as scrypt hashes, never in plain text. The demo
// passwords below are only here so the project can be tried without a sign-up
// flow; they are documented in AUTH.md.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

function hash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

const users = (globalThis.__addisUsers ??= [
  { id: 'u_abel', email: 'abel@example.com', name: 'Abel', role: 'customer', passwordHash: hash('abel-password') },
  { id: 'u_selam', email: 'selam@example.com', name: 'Selam', role: 'customer', passwordHash: hash('selam-password') },
  { id: 'u_kitchen', email: 'kitchen@addis-eats.test', name: 'Kitchen', role: 'staff', passwordHash: hash('kitchen-password') },
]);

// Public shape: never includes the password hash.
const toPublic = ({ passwordHash, ...user }) => user;

export function getUserById(id) {
  const user = users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}

const DUMMY_HASH = hash('not-a-real-password');

// Returns the public user for a correct email + password, otherwise null.
// A wrong email still pays for one hash comparison so response time doesn't
// reveal which emails have accounts.
export function verifyCredentials(email, password) {
  const user = users.find((u) => u.email === String(email).trim().toLowerCase());
  const [salt, expectedHex] = (user ? user.passwordHash : DUMMY_HASH).split(':');
  const expected = Buffer.from(expectedHex, 'hex');
  const given = scryptSync(String(password), salt, 64);
  const match = timingSafeEqual(given, expected);
  return user && match ? toPublic(user) : null;
}
