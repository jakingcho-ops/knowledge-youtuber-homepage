# 지식의 지도 — 지식 유튜버 홈페이지

역사·과학·사회 등 다양한 지식을 쉽고 재미있게 소개하는 크리에이터 **지식의 지도**의 반응형 소개 홈페이지입니다. 별도의 빌드 과정 없이 HTML, CSS, JavaScript 파일을 웹 브라우저에서 바로 열어 확인할 수 있습니다.

## 기술 스택

| 기술 | 사용 목적 |
| --- | --- |
| **HTML5** | 페이지 콘텐츠와 시맨틱 구조, 내비게이션, 메타데이터를 작성합니다. |
| **CSS3** | 색상·타이포그래피·레이아웃·카드 디자인과 화면 크기별 반응형 스타일을 구현합니다. |
| **Vanilla JavaScript (ES6+)** | 영상 주제 필터, 현재 페이지 메뉴 표시, 모바일 메뉴 열기·닫기를 처리합니다. 별도의 JavaScript 프레임워크는 사용하지 않습니다. |
| **Google Fonts** | 한글 본문 글꼴 `Noto Sans KR`과 영문 UI 글꼴 `DM Sans`를 불러옵니다. |
| **PNG 프로필 이미지** | `images/my-profile.png`를 메인 및 크리에이터 소개 페이지의 프로필 이미지로 사용합니다. |

## 페이지 구성

- `index.html` — 사이트 루트에서 메인 페이지로 연결하는 진입 페이지입니다. `/creator` 경로로 이동하도록 설정되어 있습니다.
- `creator.html` — 메인 소개, 크리에이터 소개, 대표 영상, 관심 분야를 담은 홈페이지입니다.
- `creator-about.html` — 크리에이터 소개 페이지입니다.
- `creator-videos.html` — 역사·과학·사회별 영상 목록과 주제 필터가 있는 페이지입니다.
- `creator-topics.html` — 홈페이지의 관심 분야를 소개하는 페이지입니다.
- `knowledge-archive.html` — 영상별 핵심 내용과 참고 자료를 정리한 게시판형 아카이브입니다.
- `archive.css` — 아카이브 게시판 전용 반응형 스타일입니다. 게시글 상세는 HTML `<details>` 요소로 펼쳐 볼 수 있습니다.
- `archive-client.js` — 아카이브와 Pages Function API 간 게시글·댓글 조회/등록을 연결합니다.
- `functions/api/archive.js` — Cloudflare Pages Function API입니다. `GET /api/archive`로 목록을 읽고 `POST /api/archive`로 게시글/댓글을 저장합니다.
- `functions/api/auth/` — 회원가입, 로그인, 세션 확인, 로그아웃용 Pages Function API입니다. 비밀번호는 사용자별 salt와 반복 횟수를 사용해 PBKDF2-SHA256으로 해시합니다.
- `migrations/0001_create_archive_entries.sql` — 게시글과 댓글을 함께 보관하는 단일 D1 테이블 `archive_entries`와 초기 글/댓글 데이터입니다.
- `migrations/0002_create_users.sql` — 회원가입 양식용 `users` 테이블 스키마입니다. 이메일은 중복을 막고 성별 값과 입력 길이를 제한합니다.
- `wrangler.toml` — Pages 출력 폴더와 D1 바인딩을 설정합니다. Cloudflare에서 생성한 D1 ID가 필요합니다.
- `sitemap.xml` — 검색엔진용 XML 사이트맵입니다.
- `creator.css` — 홈페이지와 하위 페이지의 공통 스타일 및 반응형 레이아웃입니다.
- `creator.js` — 영상 필터, 현재 페이지 표시, 모바일 내비게이션 동작입니다.
- `robots.txt` — 검색 로봇별 크롤링 규칙입니다.

## 로컬에서 보기

1. 정적 화면은 `creator.html` 또는 `knowledge-archive.html`을 브라우저에서 엽니다. 실제 API 연동을 테스트하려면 Node.js/npm을 설치하고 `npx wrangler pages dev .`를 실행합니다.
2. Cloudflare Pages에서 Functions/D1 binding을 구성한 후 배포된 URL의 `/knowledge-archive`에서 게시글과 댓글을 이용할 수 있습니다.

권장 진입 페이지:

```text
creator.html
```

검색엔진용 사이트맵:

```text
sitemap.xml
```

## 동작 및 외부 의존성

- 콘텐츠 페이지의 필터와 모바일 메뉴, 아카이브 데이터 조회/등록은 브라우저 JavaScript로 동작합니다.
- 게시글·댓글 저장용 Pages Function API와 D1 migration 코드가 준비되어 있습니다. 게시글과 댓글은 `entry_type`과 `parent_id`로 구분해 단일 `archive_entries` 테이블에 저장하도록 설계했습니다.
- 회원가입/로그인도 Pages Functions와 D1 `users` 테이블로 처리합니다. 비밀번호는 평문이 아닌 PBKDF2-SHA256 해시로 저장하고, 로그인 세션은 HttpOnly·Secure·SameSite 쿠키로 관리합니다.
- 회원가입 UI에 대응하는 `users` 테이블 스키마도 준비되어 있지만, 이 프로젝트 요청 범위에서는 백엔드와 인증 처리를 구현하지 않았으므로 회원 정보를 실제로 저장하지 않습니다.
- Cloudflare D1 생성, `DB` binding 및 migration 적용이 끝나야 API가 실제 데이터를 읽고 씁니다. 그 전에는 저장 API가 동작하지 않습니다.

### Cloudflare D1 초기 설정

Node.js와 npm을 설치한 뒤 저장소 루트에서 Wrangler를 사용합니다.

```sh
npm install --save-dev wrangler
npx wrangler login
npx wrangler d1 create knowledge-youtuber-archive
```

생성 결과의 `database_id`를 `wrangler.toml`의 `REPLACE_WITH_D1_DATABASE_ID` 대신 입력합니다. Cloudflare 대시보드의 Pages 프로젝트 설정에서 Functions의 D1 binding 이름을 `DB`로 지정하고 같은 데이터베이스를 연결합니다. 그다음 스키마와 초기 글/댓글 데이터를 적용합니다.

```sh
npx wrangler d1 migrations apply knowledge-youtuber-archive --local
npx wrangler pages dev .
```

원격 D1을 준비하고 같은 migration을 production에 적용합니다.

```sh
npx wrangler d1 migrations apply knowledge-youtuber-archive --remote
```

`migrations/0001_create_archive_entries.sql`은 Wrangler D1 migration으로 적용합니다. 초기 게시글과 디자인 예시 댓글도 들어 있으므로 빈 새 DB에 한 번 적용해야 합니다.

배포 후 `POST /api/archive`는 게시글/댓글을 저장하고 `GET /api/archive`는 목록을 읽습니다. Pages 프로젝트는 Functions 경로(`/api/*`)를 실행하기 위해 Git 연동 방식으로 배포되어야 합니다. 브라우저에서 SQLite 파일에 직접 쓰지 않고 서버 측 Function이 입력값을 검증해 DB에 저장합니다.

현재 개발 환경에는 Node.js/Wrangler와 Cloudflare 인증이 준비되어 있지 않아 원격 D1 생성, binding 등록, migration 적용 및 실제 원격 저장 확인은 아직 수행되지 않았습니다. `wrangler.toml`의 database ID도 Cloudflare 생성 후 교체해야 합니다. `file://`로 페이지를 직접 열면 API를 사용할 수 없으므로 Pages 개발 서버 또는 배포 URL에서 테스트해야 합니다. 공개 서비스 전에는 댓글 작성 인증, 스팸 방지 및 요청 빈도 제한도 추가해야 합니다.
- Google Fonts는 인터넷 연결이 필요합니다. 연결할 수 없는 경우 브라우저의 대체 글꼴이 사용됩니다. 프로필 사진은 저장소의 로컬 PNG 자산을 사용합니다.
- 현재 영상 카드와 구독 링크는 시안용 YouTube 링크를 사용합니다. 실제 채널을 연결할 때 각 링크를 해당 영상 또는 채널 주소로 교체해야 합니다.
- 프론트엔드 화면은 정적 HTML/CSS 파일이지만, 게시글과 댓글 저장 API를 로컬에서 실행하려면 Node.js/npm과 Wrangler가 필요합니다.