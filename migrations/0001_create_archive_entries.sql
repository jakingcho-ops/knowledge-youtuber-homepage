CREATE TABLE IF NOT EXISTS archive_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('post', 'comment')),
  parent_id INTEGER REFERENCES archive_entries(id) ON DELETE CASCADE,
  video_slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (entry_type = 'post' AND parent_id IS NULL AND title <> '') OR
    (entry_type = 'comment' AND parent_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS archive_entries_parent_created
  ON archive_entries(parent_id, created_at);

CREATE INDEX IF NOT EXISTS archive_entries_type_created
  ON archive_entries(entry_type, created_at);

-- Initial archive posts and sample discussion, stored in the same table.
INSERT INTO archive_entries (entry_type, parent_id, video_slug, title, author, body, created_at) VALUES
  ('post', NULL, 'joseon-names', '조선의 왕들은 왜 이름이 두 개였을까?', '지식의 지도', '왕의 본명인 휘와 사후 종묘에 모실 때 정한 묘호는 역할이 달랐습니다. 묘호의 조·종 선택에는 왕실 평가와 정치적 맥락이 반영됐습니다.', '2025-05-12T09:00:00.000Z'),
  ('post', NULL, 'sleep-science', '잠은 왜 꼭 자야 할까?', '지식의 지도', '수면은 뇌와 몸이 정보를 정리하고 회복하는 능동적인 과정입니다. 렘수면과 비렘수면이 반복되며 기억과 신체 기능에 관여합니다.', '2025-05-10T09:00:00.000Z'),
  ('post', NULL, 'wealthy-cities', '도시는 어떻게 부자가 될까?', '지식의 지도', '도시의 성장은 집적에 따른 교류·분업·지식 확산과 관련됩니다. 생산성뿐 아니라 주거비, 교통, 성장의 분배도 함께 살펴야 합니다.', '2025-05-08T09:00:00.000Z'),
  ('post', NULL, 'silk-road', '실크로드는 무엇을 바꿨을까?', '지식의 지도', '실크로드는 유라시아를 잇던 육상·해상 교역망이었습니다. 물품과 함께 종교, 기술, 예술과 지식도 이동했습니다.', '2025-05-06T09:00:00.000Z'),
  ('post', NULL, 'starlight', '우리는 왜 별을 올려다볼까?', '지식의 지도', '빛은 유한한 속도로 이동하므로 먼 천체를 관측하는 것은 과거의 빛을 보는 일입니다. 별빛은 우주의 거리와 시간에 관한 단서입니다.', '2025-05-04T09:00:00.000Z'),
  ('post', NULL, 'how-trends-spread', '유행은 어떻게 만들어질까?', '지식의 지도', '유행은 선택이 사회적 관계망과 미디어를 통해 확산되는 현상입니다. 네트워크, 반복 노출, 집단 규범이 함께 작용합니다.', '2025-05-02T09:00:00.000Z');

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '역사산책', '묘호에 조와 종을 붙이는 기준이 궁금했는데 정리돼서 좋네요!', '2025-05-13T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'joseon-names';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '호기심별', '종묘에 직접 가서 정전도 살펴보고 싶어요.', '2025-05-14T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'joseon-names';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '잠꾸러기', '수면 주기를 알고 나니 잠을 더 잘 챙겨야겠어요.', '2025-05-11T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'sleep-science';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '도시관찰자', '도시가 커지는 것과 모두가 잘사는 건 다를 수 있다는 말이 기억에 남아요.', '2025-05-09T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'wealthy-cities';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '별보는밤', '멀리 있는 별을 본다는 게 과거를 보는 거라는 설명이 인상적이에요.', '2025-05-05T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'starlight';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '은하수', '다음엔 별의 색과 온도 관계도 다뤄주세요!', '2025-05-05T10:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'starlight';

INSERT INTO archive_entries (entry_type, parent_id, video_slug, author, body, created_at)
SELECT 'comment', id, video_slug, '유행탐구', '요즘 유행도 이런 흐름으로 보면 더 재밌겠네요.', '2025-05-03T09:00:00.000Z'
FROM archive_entries WHERE entry_type = 'post' AND video_slug = 'how-trends-spread';