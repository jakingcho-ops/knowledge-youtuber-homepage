import { hashToken, jsonResponse, readCookie } from '../../../auth-utils.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: '회원 데이터베이스가 연결되지 않았습니다.' }, 503);
  const token = readCookie(request, '__Host-knowledge_session');
  if (!token) return jsonResponse({ user: null });

  const tokenHash = await hashToken(token);
  const user = await env.DB.prepare(
    `SELECT id, nickname, email, gender, session_expires_at FROM users WHERE session_token_hash = ?`,
  ).bind(tokenHash).first();
  if (!user || Date.parse(user.session_expires_at) <= Date.now()) return jsonResponse({ user: null });
  return jsonResponse({ user: { id: user.id, nickname: user.nickname, email: user.email, gender: user.gender } });
}