# TASKS: Vercel Readiness Blueprint

Dokumen ini hanya berisi Phase 1 dan Phase 2. Tidak ada kode aplikasi yang diubah.

Catatan sumber: `docs/PRD.md` tidak ditemukan di workspace ini, jadi review PRD dilakukan dari `README.md`, `DEPLOYMENT.md`, `src/`, `public/`, `vercel.json`, dan laporan fase sebelumnya.

## Phase 1 - Review PRD

### Ringkasan produk yang terbaca

Project `text-over-image-api` adalah REST API Node.js/Express CommonJS untuk menambahkan watermark ke gambar secara in-memory memakai Sharp. Endpoint inti yang terlihat dari source adalah `POST /upload`, `POST /upload-url`, `GET /health`, `GET /api`, dan `GET /api-docs`. Aplikasi memakai autentikasi Bearer token statik, validasi input, rate limiting, Helmet, CORS, dan Swagger/OpenAPI.

### Ambiguitas atau yang terlewat

| Topik | Status | Dampak |
|---|---|---|
| `docs/PRD.md` | Tidak ada di workspace | Spec final harus mengandalkan dokumen repo yang tersedia. Jika PRD asli berbeda, task ini perlu disesuaikan. |
| Target deploy utama | Belum eksplisit | Perlu diputuskan apakah Vercel adalah jalur utama atau hanya tambahan di samping Docker/Dokploy. |
| Mode runtime Vercel | Belum dijelaskan | Perlu diputuskan apakah tetap memakai root route Express lewat adapter Vercel atau struktur serverless lain. |
| `/api-docs` | Konsisten belum jelas | README dan source tidak sepenuhnya sejalan. Perlu diputuskan public atau protected. |
| Auth scheme | OpenAPI menyebut JWT, source memakai static API token | Dokumentasi dan implementasi perlu diseragamkan supaya client tidak salah kirim token. |
| Token query parameter | Masih ada indikasi legacy | Perlu diputuskan apakah `?token=` tetap didukung atau dihapus sebagai policy final. |
| SSRF policy untuk `/upload-url` | Sudah ada mitigasi dasar, belum jelas scope final | Perlu dipastikan apakah private/internal URL harus blok total atau ada allowlist internal. |
| Runtime target | Tidak seragam | README menyebut Node 18+, Dockerfile memakai Node 20. Untuk Vercel, asumsi aman adalah Node 20 LTS sampai ada keputusan lain. |
| CORS production | Default masih bisa longgar | Perlu dipastikan origin production untuk Vercel dan apakah wildcard benar-benar dilarang. |
| Beban image processing | Ada risiko CPU/memory pada concurrency | Perlu guardrail agar serverless tidak mudah habis resource saat traffic tinggi. |

### Blueprint struktur folder final

```text
.
├── api/
│   └── index.js
├── .dockerignore
├── .env.example
├── .gitignore
├── AGENTS.md
├── DEPLOYMENT.md
├── Dockerfile
├── docker-compose.local.yml
├── docker-compose.yml
├── docs/
│   ├── TASKS.md
│   ├── report-fase-1.md
│   ├── report-fase-2.md
│   ├── report-fase-3.md
│   └── report-fase-4.md
├── openapi.yaml
├── package-lock.json
├── package.json
├── public/
│   ├── index.html
│   ├── logo.png
│   ├── logo.svg
│   └── openapi.json
├── README.md
├── src/
│   ├── config/
│   │   └── config.js
│   ├── controllers/
│   │   └── imageController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/
│   │   └── index.js
│   ├── server.js
│   ├── services/
│   │   ├── imageService.js
│   │   └── urlFetchService.js
│   └── utils/
│       ├── errors.js
│       ├── network.js
│       └── response.js
└── tests/
    ├── auth.test.js
    ├── config-security.test.js
    ├── docs.test.js
    ├── health.test.js
    ├── server.test.js
    ├── upload-url-security.test.js
    └── upload-validation.test.js
```

Catatan blueprint:
- `api/index.js` adalah adapter Vercel yang menyambungkan runtime Vercel ke Express app existing.
- `src/server.js` tetap menjadi bootstrap lokal agar `npm start` tetap jalan seperti sekarang.
- `src/` tetap jadi sumber tunggal logika bisnis; tidak perlu folder baru lain di luar `api/` kecuali ada kebutuhan yang benar-benar terbukti.
- `tests/` tetap jadi safety net untuk root route, auth, docs, dan SSRF sebelum deployment Vercel.

## Phase 2 - Security & Resource Review

### Security findings

| Temuan | Risiko | Relevansi ke task |
|---|---|---|
| `REQUIRE_AUTH=true` saat `API_TOKEN` kosong | Proteksi bisa bypass diam-diam jika config tidak fail-fast | Harus ditutup sebelum deployment Vercel dianggap aman. |
| Token via query parameter | Token bisa bocor ke log, history browser, proxy, dan error trace | Sebaiknya dihapus atau minimal dinyatakan deprecated secara eksplisit. |
| `/upload-url` | SSRF masih jadi area paling sensitif | Harus tetap dibatasi ke URL publik yang aman dan tidak bisa tembus private/internal target. |
| CORS wildcard di production | Boundary browser menjadi lemah | Perlu origin produksi yang eksplisit untuk Vercel. |
| `/api-docs` yang tidak jelas statusnya | Bisa menimbulkan inkonsistensi dokumentasi dan ekspektasi auth | Harus diputuskan dan ditulis ulang konsisten di README serta route behavior. |
| Logging request/error | URL atau token sensitif bisa ikut tercetak | Perlu redaction atau penghapusan sumber leak sebelum go-live. |
| OpenAPI JWT label padahal auth statik | Client bisa salah implementasi dan salah mengirim kredensial | Dokumentasi harus diseragamkan. |

### Resource findings

| Temuan | Risiko | Relevansi ke task |
|---|---|---|
| Image processing in-memory | CPU dan memory bisa tinggi saat request concurrent | Vercel deployment harus mempertimbangkan guardrail dan ekspektasi traffic. |
| Upload sampai 10MB | Tetap bisa memicu beban besar saat decoding Sharp | Test harus memastikan validasi dan error path aman. |
| `server.js` bootstrap langsung | Berpotensi sulit dipakai ulang di runtime serverless jika tidak dipisah dengan benar | Task Vercel harus menghindari startup listener permanen saat import. |
| URL fetch eksternal | Timeout dan redirect abuse bisa menghabiskan resource | Harus dipertahankan batas timeout/max size/redirect yang ketat. |

## Task List

### TASK-001: Vercel Runtime Adapter dan Routing Root

**File yang dibuat/diubah:**
- `api/index.js`
- `vercel.json`
- `src/server.js`
- `package.json` bila diperlukan untuk script/runtime metadata

**Input/Output yang diharapkan:**
- Input: Express app existing yang sekarang jalan lokal lewat `src/server.js`.
- Output: aplikasi bisa dijalankan di Vercel tanpa Docker build, dan route root tetap melayani endpoint existing seperti `/health`, `/upload`, `/upload-url`, `/api`, dan `/api-docs`.

**Dependencies antar task:**
- Tidak ada.

**Kriteria selesai:**
- [x] Vercel config tidak lagi mengandalkan Docker sebagai satu-satunya jalur deploy.
- [x] Ada adapter Vercel di `api/index.js` yang menghubungkan runtime Vercel ke Express app existing.
- [x] `src/server.js` tetap aman untuk lokal dan tidak memulai listener permanen saat di-import oleh adapter.
- [x] Request ke endpoint utama tetap resolve dari root URL pada environment Vercel.
- [x] `npm start` lokal tetap bekerja seperti sebelumnya.
- [x] Tidak ada file runtime baru di luar `api/` tanpa alasan eksplisit.

**Catatan keamanan:**
- Jangan memindahkan auth, validation, atau SSRF logic ke adapter Vercel; adapter hanya boleh menjadi lapisan runtime.
- Jika adapter yang dipilih tidak mendukung root route tanpa rewrite tambahan, hentikan dan minta keputusan sebelum mengubah scope.
- Perubahan bootstrap harus menghindari race condition startup dan tidak menambah listener ganda.

### TASK-002: Env, Dokumen, dan Regression Tests untuk Vercel

**File yang dibuat/diubah:**
- `.env.example`
- `README.md`
- `DEPLOYMENT.md`
- `tests/server.test.js`
- `tests/config-security.test.js`
- `tests/docs.test.js`
- `tests/upload-url-security.test.js` bila diperlukan untuk menutup regresi deploy/public URL
- `tests/auth.test.js` bila diperlukan untuk memastikan policy auth final tetap konsisten

**Input/Output yang diharapkan:**
- Input: runtime behavior final dari TASK-001 dan keputusan policy deployment.
- Output: dokumentasi dan test suite menjelaskan cara deploy ke Vercel, env yang wajib, policy auth final, dan perilaku route yang tidak berubah saat pindah runtime.

**Dependencies antar task:**
- Wajib setelah `TASK-001`.

**Kriteria selesai:**
- [x] `.env.example` menjelaskan env minimum yang dibutuhkan untuk Vercel production tanpa ambigu.
- [x] `README.md` dan `DEPLOYMENT.md` menyebut jalur deploy Vercel secara eksplisit dan konsisten.
- [x] Dokumentasi auth menyatakan satu policy final yang sama dengan source code.
- [x] Jika `/api-docs` diputuskan public, dokumentasi menyatakannya jelas; jika diproteksi, test juga harus mencerminkan itu.
- [x] Test suite memverifikasi health check, route docs, dan satu jalur upload dasar tetap aman setelah perubahan deploy.
- [x] Test tidak bergantung pada network eksternal nyata.
- [x] Jalankan `npm test` dan pastikan semua test pass.

**Catatan keamanan:**
- Jangan menuliskan token nyata atau contoh secret di dokumen atau test.
- Pastikan dokumentasi tidak mendorong penggunaan query token kalau policy final sudah header-only.
- Test harus menjaga agar perubahan deploy tidak membuka kembali bypass auth, leak URL sensitif, atau config yang terlalu longgar.
