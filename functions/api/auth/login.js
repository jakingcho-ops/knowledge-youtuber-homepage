import { constantTimeEqual, hashPassword, hashToken, jsonResponse, randomHex, sessionCookie, validSameOrigin } from '../../../auth-utils.js';

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export async function onRequestPost({ request, env }) {
  if (!validSameOrigin(request)) return jsonResponse({ error: '요청 출처를 확인할 수 없습니다.' }, 403);
  if (!env.DB) return jsonResponse({ error: '회원 데이터베이스가 연결되지 않았습니다.' }, 503);

  let input;
  try { input = await request.json(); } catch { return jsonResponse({ error: 'JSON 요청이 필요합니다.' }, 400); }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || email.length > 254 || !password || password.length > 128) return jsonResponse({ error: '이메일과 비밀번호를 확인해 주세요.' }, 400);

  const user = await env.DB.prepare(
    `SELECT id, nickname, email, gender, password_hash, password_salt, password_iterations
     FROM users WHERE email = ?`,
  ).bind(email).first();
  if (!user) return jsonResponse({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);

  const candidate = await hashPassword(password, user.password_salt, user.password_iterations);
  if (!constantTimeEqual(candidate, user.password_hash)) return jsonResponse({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);

  const token = randomHex(32);
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await env.DB.prepare(`UPDATE users SET session_token_hash = ?, session_expires_at = ? WHERE id = ?`)
    .bind(tokenHash, expiresAt, user.id).run();

  return jsonResponse(
    { user: { id: user.id, nickname: user.nickname, email: user.email, gender: user.gender } },
    200,
    { 'set-cookie': sessionCookie(token, SESSION_SECONDS) },
  );
}

export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
}