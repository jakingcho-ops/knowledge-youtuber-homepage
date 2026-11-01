const AUTH_API = '/api/auth';

function showMessage(form, message, isError = false) {
  const output = form.querySelector('.form-message');
  output.textContent = message;
  output.classList.toggle('is-error', isError);
  output.classList.toggle('is-success', !isError);
}

async function sendAuthRequest(path, payload) {
  const response = await fetch(`${AUTH_API}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `요청을 처리하지 못했습니다. (${response.status})`);
  return result;
}

function connectForm(form, endpoint, buildPayload, onSuccess) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('.member-submit');
    button.disabled = true;
    showMessage(form, '처리 중입니다…');

    try {
      const result = await sendAuthRequest(endpoint, buildPayload(new FormData(form)));
      showMessage(form, result.message || '완료되었습니다.');
      if (onSuccess) setTimeout(onSuccess, 700);
    } catch (error) {
      showMessage(form, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

const signupForm = document.querySelector('form.member-form');
if (signupForm && document.querySelector('#signup-title')) {
  connectForm(signupForm, 'register', values => ({
    nickname: values.get('nickname'),
    email: values.get('email'),
    gender: values.get('gender'),
    address: values.get('address'),
    password: values.get('password'),
    privacyConsent: values.get('privacyConsent') === 'yes',
  }), () => { window.location.href = 'login.html?registered=1'; });
}

const loginForm = document.querySelector('form.member-form');
if (loginForm && document.querySelector('#login-title')) {
  connectForm(loginForm, 'login', values => ({
    email: values.get('email'),
    password: values.get('password'),
  }), () => { window.location.href = 'creator.html'; });
}

if (new URLSearchParams(window.location.search).get('registered') === '1' && loginForm) {
  showMessage(loginForm, '회원가입이 완료됐습니다. 이메일과 비밀번호로 로그인해 주세요.');
}

async function showCurrentUser() {
  const response = await fetch(`${AUTH_API}/me`, { credentials: 'same-origin', headers: { accept: 'application/json' } });
  if (!response.ok) return;
  const { user } = await response.json();
  if (!user) return;

  const nav = document.querySelector('.member-nav');
  if (!nav) return;
  const loginLink = nav.querySelector('a[href="login.html"]');
  if (!loginLink) return;
  loginLink.textContent = `${user.nickname}님`;
  loginLink.href = '#logout';
  loginLink.addEventListener('click', async event => {
    event.preventDefault();
    await fetch(`${AUTH_API}/logout`, { method: 'POST', credentials: 'same-origin' });
    window.location.reload();
  });
}

showCurrentUser().catch(() => {});