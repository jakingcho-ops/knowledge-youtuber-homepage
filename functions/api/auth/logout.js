import { clearSessionCookie, hashToken, jsonResponse, readCookie } from '../../../auth-utils.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: '회원 데이터베이스가 연결되지 않았습니다.' }, 503, { 'set-cookie': clearSessionCookie() });
  const token = readCookie(request, '__Host-knowledge_session');
  if (token) {
    const tokenHash = await hashToken(token);
    await env.DB.prepare('UPDATE users SET session_token_hash = NULL, session_expires_at = NULL WHERE session_token_hash = ?').bind(tokenHash).run();
  }
  return jsonResponse({ message: '로그아웃되었습니다.' }, 200, { 'set-cookie': clearSessionCookie() });
}

export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
}