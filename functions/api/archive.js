const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeEntry(row) {
  return {
    id: row.id,
    type: row.entry_type,
    parentId: row.parent_id,
    videoSlug: row.video_slug,
    title: row.title,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  };
}

const referenceLinks = {
  'joseon-names': [
    { label: '한국민족문화대백과사전 — 묘호·종묘 관련 항목', url: 'https://encykorea.aks.ac.kr/' },
    { label: '국가유산포털 — 종묘와 조선 왕실 의례', url: 'https://www.heritage.go.kr/' },
  ],
  'sleep-science': [
    { label: 'NINDS — Understanding Sleep', url: 'https://www.ninds.nih.gov/health-information/disorders/brain-basics-understanding-sleep' },
    { label: 'CDC — About Sleep', url: 'https://www.cdc.gov/sleep/about/index.html' },
  ],
  'wealthy-cities': [
    { label: 'OECD — Regional Development and Cities', url: 'https://www.oecd.org/regional/' },
    { label: 'World Bank — Urban Development', url: 'https://www.worldbank.org/en/topic/urbandevelopment' },
  ],
  'silk-road': [
    { label: 'UNESCO — Silk Roads Programme', url: 'https://en.unesco.org/silkroad/' },
    { label: 'Encyclopaedia Britannica — Silk Road', url: 'https://www.britannica.com/topic/Silk-Road-trade-route' },
  ],
  starlight: [
    { label: 'NASA Science — The Universe', url: 'https://science.nasa.gov/universe/' },
    { label: 'NASA Imagine the Universe', url: 'https://imagine.gsfc.nasa.gov/' },
  ],
  'how-trends-spread': [
    { label: 'Nature — Social influence and cultural change', url: 'https://www.nature.com/articles/s41586-019-1715-1' },
    { label: 'Pew Research Center — Internet & Technology', url: 'https://www.pewresearch.org/internet/' },
  ],
};

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 503);

  const url = new URL(request.url);
  const slug = url.searchParams.get('video');
  const posts = slug
    ? await env.DB.prepare(
        `SELECT id, entry_type, parent_id, video_slug, title, author, body, created_at
         FROM archive_entries WHERE entry_type = 'post' AND video_slug = ? ORDER BY created_at DESC`,
      ).bind(slug).all()
    : await env.DB.prepare(
        `SELECT id, entry_type, parent_id, video_slug, title, author, body, created_at
         FROM archive_entries WHERE entry_type = 'post' ORDER BY created_at DESC`,
      ).all();

  const entries = await Promise.all(posts.results.map(async row => {
    const comments = await env.DB.prepare(
      `SELECT id, entry_type, parent_id, video_slug, title, author, body, created_at
       FROM archive_entries WHERE entry_type = 'comment' AND parent_id = ? ORDER BY created_at ASC`,
    ).bind(row.id).all();
    return {
      ...normalizeEntry(row),
      references: referenceLinks[row.video_slug] ?? [],
      comments: comments.results.map(normalizeEntry),
    };
  }));

  return json({ entries });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Database binding DB is not configured.' }, 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: '요청 본문은 JSON이어야 합니다.' }, 400);
  }

  const author = typeof payload.author === 'string' ? payload.author.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const type = payload.type;
  const videoSlug = typeof payload.videoSlug === 'string' ? payload.videoSlug.trim() : '';

  if (!author || author.length > 40) return json({ error: '닉네임은 1~40자로 입력해 주세요.' }, 400);
  if (!body || body.length > 2000) return json({ error: '내용은 1~2000자로 입력해 주세요.' }, 400);

  if (type === 'comment') {
    const parentId = Number(payload.parentId);
    const videoSlug = typeof payload.videoSlug === 'string' ? payload.videoSlug.trim() : '';
    if ((!Number.isSafeInteger(parentId) || parentId < 1) && !/^[a-z0-9-]{1,60}$/.test(videoSlug)) {
      return json({ error: '댓글 대상 게시글이 올바르지 않습니다.' }, 400);
    }

    const parent = Number.isSafeInteger(parentId) && parentId > 0
      ? await env.DB.prepare(
          `SELECT id, video_slug FROM archive_entries WHERE id = ? AND entry_type = 'post'`,
        ).bind(parentId).first()
      : await env.DB.prepare(
          `SELECT id, video_slug FROM archive_entries WHERE video_slug = ? AND entry_type = 'post' ORDER BY id DESC LIMIT 1`,
        ).bind(videoSlug).first();
    if (!parent) return json({ error: '게시글을 찾을 수 없습니다.' }, 404);

    const result = await env.DB.prepare(
      `INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body)
       VALUES ('comment', ?, ?, ?, ?) RETURNING id, entry_type, parent_id, video_slug, title, author, body, created_at`,
    ).bind(parent.id, parent.video_slug, author, body).first();

    return json({ entry: normalizeEntry(result) }, 201);
  }

  if (type === 'post') {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title || title.length > 160) return json({ error: '제목은 1~160자로 입력해 주세요.' }, 400);
    if (!/^[a-z0-9-]{1,60}$/.test(videoSlug)) return json({ error: '영상 식별자가 올바르지 않습니다.' }, 400);

    const result = await env.DB.prepare(
      `INSERT INTO archive_entries (entry_type, parent_id, video_slug, title, author, body)
       VALUES ('post', NULL, ?, ?, ?, ?) RETURNING id, entry_type, parent_id, video_slug, title, author, body, created_at`,
    ).bind(videoSlug, title, author, body).first();

    return json({ entry: normalizeEntry(result) }, 201);
  }

  return json({ error: 'type은 post 또는 comment여야 합니다.' }, 400);
}