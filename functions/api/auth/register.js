import { hashPassword, jsonResponse, randomHex, validSameOrigin } from '../../../auth-utils.js';

const PASSWORD_ITERATIONS = 310_000;

export async function onRequestPost({ request, env }) {
  if (!validSameOrigin(request)) return jsonResponse({ error: '요청 출처를 확인할 수 없습니다.' }, 403);
  if (!env.DB) return jsonResponse({ error: '회원 데이터베이스가 연결되지 않았습니다.' }, 503);

  let input;
  try { input = await request.json(); } catch { return jsonResponse({ error: 'JSON 요청이 필요합니다.' }, 400); }

  const nickname = typeof input.nickname === 'string' ? input.nickname.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const gender = input.gender;
  const address = typeof input.address === 'string' ? input.address.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (nickname.length < 2 || nickname.length > 40) return jsonResponse({ error: '닉네임은 2~40자로 입력해 주세요.' }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: '올바른 이메일 주소를 입력해 주세요.' }, 400);
  if (!['female', 'male', 'undisclosed'].includes(gender)) return jsonResponse({ error: '성별 항목을 선택해 주세요.' }, 400);
  if (!address || address.length > 300) return jsonResponse({ error: '집주소는 1~300자로 입력해 주세요.' }, 400);
  if (password.length < 12 || password.length > 128) return jsonResponse({ error: '비밀번호는 12~128자로 설정해 주세요.' }, 400);
  if (input.privacyConsent !== true) return jsonResponse({ error: '개인정보 수집·이용 동의가 필요합니다.' }, 400);

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt, PASSWORD_ITERATIONS);
  try {
    await env.DB.prepare(
      `INSERT INTO users (nickname, email, gender, home_address, password_hash, password_salt, password_iterations)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(nickname, email, gender, address, passwordHash, salt, PASSWORD_ITERATIONS).run();
  } catch (error) {
    if (/UNIQUE constraint failed: users.email/i.test(error.message)) return jsonResponse({ error: '이미 가입된 이메일 주소입니다.' }, 409);
    return jsonResponse({ error: '회원가입을 처리하지 못했습니다.' }, 500);
  }

  return jsonResponse({ message: '회원가입이 완료되었습니다. 이메일과 비밀번호로 로그인해 주세요.' }, 201);
}

export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
}
