const encoder = new TextEncoder();

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function validSameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

export function randomHex(bytes) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return [...values].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, saltHex, iterations) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g), byte => Number.parseInt(byte, 16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return [...new Uint8Array(bits)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function sessionCookie(token, maxAge) {
  return `__Host-knowledge_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function readCookie(request, name) {
  const cookies = request.headers.get('Cookie') ?? '';
  const prefix = `${name}=`;
  const value = cookies.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function clearSessionCookie() {
  return '__Host-knowledge_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}