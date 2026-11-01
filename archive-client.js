const archiveApi = '/api/archive';

function setStatus(form, message, isError = false) {
  const status = form.querySelector('.form-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function renderComment(comment) {
  const article = document.createElement('article');
  article.className = 'comment';
  const author = document.createElement('b');
  author.textContent = comment.author;
  const time = document.createElement('time');
  const date = new Date(comment.createdAt);
  time.dateTime = date.toISOString();
  time.textContent = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
  const body = document.createElement('p');
  body.textContent = comment.body;
  article.append(author, time, body);
  return article;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderPost(entry, index) {
  const category = document.querySelector(`[data-video-slug="${CSS.escape(entry.videoSlug)}"]`)
    ?.dataset.category ?? 'society';
  const categoryLabel = { history: '역사', science: '과학', society: '사회' }[category] ?? '기타';
  const comments = entry.comments ?? [];
  const references = (entry.references ?? []).map(reference =>
    `<li><a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference.label)}</a></li>`,
  ).join('');
  const commentMarkup = comments.map(comment => {
    const date = new Date(comment.createdAt);
    const dateText = Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
    return `<article class="comment"><b>${escapeHtml(comment.author)}</b><time>${escapeHtml(dateText)}</time><p>${escapeHtml(comment.body)}</p></article>`;
  }).join('');

  const article = document.createElement('article');
  article.className = 'archive-card';
  article.dataset.videoSlug = entry.videoSlug;
  article.dataset.category = category;
  article.innerHTML = `
    <details class="post-details">
      <summary class="post-row">
        <span class="row-category tag-${category}">${categoryLabel}</span>
        <span class="row-main"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.author)} · ${escapeHtml(entry.createdAt)}</small></span>
        <span class="comment-count">${comments.length}</span>
        <span class="row-number">${String(index).padStart(2, '0')}</span>
      </summary>
      <div class="post-detail">
        <p class="archive-summary">${escapeHtml(entry.body)}</p>
        <details class="references"><summary>참고 자료 보기 <span>＋</span></summary><ul>${references}</ul></details>
        <section class="comments">
          <h4>구독자 댓글 <span class="comment-count-value">${comments.length}</span></h4>
          <div class="comment-list">${commentMarkup}</div>
          <p class="no-comments" ${comments.length ? 'hidden' : ''}>아직 댓글이 없습니다.</p>
          <form class="comment-form" data-comment-form>
            <label>댓글 남기기</label>
            <label class="comment-nickname">닉네임<input name="author" type="text" maxlength="40" placeholder="닉네임" required></label>
            <textarea name="body" rows="3" maxlength="2000" placeholder="영상이나 정리글에 대한 생각을 나눠주세요." required></textarea>
            <div class="comment-form-bottom"><small class="form-status" aria-live="polite">SQLite 데이터베이스에 저장됩니다.</small><button type="submit">댓글 등록</button></div>
          </form>
        </section>
      </div>
    </details>`;
  return article;
}

async function loadArchive() {
  if (location.protocol === 'file:') {
    throw new Error('SQLite 기능은 HTTP 서버에서 실행해야 합니다. Node.js/Wrangler Pages 개발 서버를 시작해 주세요');
  }
  const response = await fetch(archiveApi, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`아카이브 조회 실패 (${response.status})`);
  const data = await response.json();

  const list = document.querySelector('.archive-posts');
  list.replaceChildren(...(data.entries ?? []).map(renderPost));
  document.querySelector('.archive-empty').hidden = (data.entries ?? []).length > 0;
  document.querySelector('.archive-count strong').textContent = String((data.entries ?? []).length);

  for (const entry of data.entries ?? []) {
    const post = document.querySelector(`[data-video-slug="${CSS.escape(entry.videoSlug)}"]`);
    if (!post) continue;

    const title = post.querySelector('.row-main strong');
    const summary = post.querySelector('.archive-summary');
    if (title) title.textContent = entry.title;
    if (summary) summary.textContent = entry.body;
    const count = post.querySelector('.comment-count-value');
    if (count) count.textContent = String(entry.comments?.length ?? 0);
    post.querySelectorAll('input[name="parentId"]').forEach(parentField => {
      parentField.value = String(entry.id);
    });
      parentField.value = String(entry.id);
    });
    const rowCount = post.querySelector('.post-row .comment-count');
    if (rowCount) rowCount.textContent = String(entry.comments?.length ?? 0);
  }
}

async function submitEntry(form, type) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus(form, '저장 중…');

  const values = Object.fromEntries(new FormData(form));
  const entryType = values.type || type;
  const payload = entryType === 'comment'
    ? { type: 'comment', parentId: values.parentId ? Number(values.parentId) : undefined, videoSlug: values.videoSlug || form.closest('.post-details')?.dataset.videoSlug, author: values.author || '구독자', body: values.body }
    : { type: 'post', videoSlug: values.videoSlug, title: values.title, author: values.author, body: values.body };

  try {
    const response = await fetch(archiveApi, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `저장 실패 (${response.status})`);

    setStatus(form, '저장했습니다. 목록을 새로고침합니다.');
    window.location.reload();
  } catch (error) {
    setStatus(form, `${error.message}. Cloudflare Pages Function과 D1 설정을 확인해 주세요.`, true);
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('.post-details .comment-form').forEach(form => {
  const post = form.closest('.post-details');
  if (!post?.dataset.videoSlug) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    submitEntry(form, 'comment');
  });
});

const entryForm = document.querySelector('[data-entry-form]');
entryForm?.addEventListener('submit', event => {
  event.preventDefault();
  submitEntry(entryForm, 'comment');
});

loadArchive().catch(error => {
  const list = document.querySelector('.archive-posts');
  if (list) {
    list.replaceChildren();
    const message = document.createElement('div');
    message.className = 'archive-loading archive-error';
    message.textContent = location.protocol === 'file:'
      ? 'SQLite 게시판 기능을 확인하려면 Node.js/Wrangler 서버로 실행해야 합니다. HTML 파일을 직접 열면 API에 연결할 수 없습니다.'
      : `${error.message}. Cloudflare D1 설정 후 게시글을 표시할 수 있습니다.`;
    list.append(message);
  }
  const fallback = document.querySelector('.archive-fallback');
  if (fallback) fallback.hidden = true;
  document.querySelectorAll('.form-status').forEach(status => {
    status.textContent = `${error.message}. 정적 샘플을 표시 중입니다.`;
    status.classList.add('error');
  });
});