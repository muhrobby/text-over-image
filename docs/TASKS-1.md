# TASKS: Text Over Image API Hardening Blueprint

Dokumen ini adalah output Phase 1 dan Phase 2 saja. Tidak ada kode aplikasi yang diubah. Task dibuat cukup eksplisit agar junior programmer atau AI agent murah dapat mengerjakan satu task tanpa menebak konteks.

## Phase 1 - Review PRD dan Blueprint

### Ringkasan PRD yang Terbaca

Project `text-over-image-api` adalah RESTful API Node.js/Express CommonJS untuk menambahkan watermark profesional ke gambar secara in-memory memakai Sharp. API utama menerima gambar dari upload file lokal dan URL eksternal, menambahkan timestamp, alamat, dan brand logo, lalu mengembalikan output binary image atau JSON base64.

Fitur yang sudah confirmed dari report dan source:
- `POST /upload` untuk upload multipart file lokal.
- `POST /upload-url` untuk download gambar dari URL lalu diproses.
- `GET /health` untuk health check.
- `GET /api` untuk dokumentasi JSON ringkas.
- `GET /api-docs` untuk Swagger UI dari `openapi.yaml`.
- Auth static Bearer API token melalui `REQUIRE_AUTH` dan `API_TOKEN`.
- Validasi input memakai Joi dan Multer.
- Image processing in-memory memakai Sharp.
- Security middleware: Helmet, CORS, express-rate-limit.
- Dockerfile dan docker-compose tersedia.

### Ambiguitas / Hal yang Terlewat dari PRD

Hal berikut wajib diputuskan sebelum atau saat task terkait dikerjakan. Jika task membutuhkan keputusan ini dan belum ada jawaban, agent harus berhenti dan bertanya satu pertanyaan spesifik.

- Target deployment utama belum final: Dokploy/reverse proxy external network, Vercel Docker, local Docker Compose, atau kombinasi.
- `docker-compose.yml` memakai `PORT=3001` dan external network tanpa `ports`; belum jelas apakah local compose harus bisa langsung diakses dari host.
- Runtime policy belum konsisten: README menyebut Node `>=18`, Dockerfile memakai Node 20. Final target sebaiknya Node 20 LTS agar sama dengan Docker.
- `/api-docs` saat ini publik, sedangkan README mengklaim semua endpoint selain `/health` dan `/api` butuh auth. Perlu diputuskan publik atau protected.
- Auth saat ini static API token, tetapi OpenAPI menyebut `bearerFormat: JWT`. Perlu dipastikan tidak ada rencana migrasi JWT/OAuth/API key multi-client dalam sprint ini.
- Query token `?token=` masih didukung. Belum jelas apakah ada client existing yang bergantung pada ini.
- `POST /upload-url` memiliki risiko SSRF. Belum jelas apakah URL private/internal memang harus diblokir penuh, atau ada use case internal image URL yang membutuhkan allowlist.
- Dokumentasi lama menyebut `Verified` badge, sedangkan service saat ini tidak merender verified badge. Perlu diputuskan watermark final tanpa verified badge atau fitur verified dikembalikan.
- CORS production default masih `*`. Origin production final belum diketahui.
- `trust proxy` selalu `1`. Belum jelas semua deployment selalu berada di belakang tepat satu trusted reverse proxy.
- Testing strategy belum ada. Jest/Supertest tersedia, tetapi `npm test` belum ada dan belum ada test file.
- Tidak ada database, sehingga temuan Mongoose di error handler kemungkinan legacy/template. Perlu konfirmasi sebelum menghapus karena bisa saja disiapkan untuk rencana masa depan.

### Blueprint Struktur Folder Final

Struktur ini adalah target final setelah task hardening selesai. Tidak semua folder/file harus dibuat sekaligus; buat hanya ketika task terkait dikerjakan.

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── AGENTS.md
├── DEPLOYMENT.md
├── Dockerfile
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
    ├── health.test.js
    ├── auth.test.js
    ├── upload-validation.test.js
    ├── upload-url-security.test.js
    └── docs.test.js
```

Catatan blueprint:
- `src/services/urlFetchService.js` hanya dibuat pada task SSRF hardening jika logic download aman sudah terlalu besar untuk tetap di controller.
- `src/utils/network.js` hanya dibuat jika validasi IP/CIDR/DNS membutuhkan helper terpisah. Jika tetap kecil, boleh tetap di `validation.js` atau `urlFetchService.js`.
- `tests/` dibuat pada task baseline test. Nama file boleh disesuaikan, tetapi cakupan test wajib sesuai kriteria task.
- Jangan buat folder/file tambahan di luar blueprint tanpa alasan eksplisit di implementation report task terkait.

## Phase 2 - Security & Resource Review

### Security Findings

- Critical: dependency runtime memiliki vulnerability high dari hasil `npm audit`, termasuk path yang relevan untuk upload, rate limit, URL fetch, dan routing.
- Critical: SSRF protection `POST /upload-url` belum cukup karena hanya memblokir pola hostname sederhana, belum DNS resolve, private CIDR, link-local, metadata IP, dan redirect.
- Critical: auth bisa nonaktif diam-diam ketika `REQUIRE_AUTH=true` tetapi `API_TOKEN` kosong karena middleware skip auth jika token config falsy.
- Warning: token via query parameter berisiko bocor ke logs, browser history, proxy logs, dan error logs.
- Warning: CORS default `*` tidak aman untuk production bila API token digunakan dari browser/client publik.
- Warning: CSP mengizinkan `unsafe-inline` script/style dan `http:` images. Ini mungkin diperlukan Swagger/static UI, tetapi harus didokumentasikan atau dipersempit.
- Warning: `/api-docs` publik tidak konsisten dengan README.
- Warning: OpenAPI menyebut JWT padahal implementasi static API token.
- Warning: error logging dapat memuat URL lengkap, termasuk token query parameter bila digunakan.
- Good: tidak ditemukan hardcoded secret nyata di source.
- Good: file upload memakai memory storage, MIME allowlist, dan size limit.
- Good: input text disanitasi dan SVG text di-escape sebelum render.
- Good: stack trace tidak diekspos pada non-development.

### Resource Findings

- Critical: URL fetch menerima konten eksternal sehingga harus membatasi timeout, ukuran body, redirect, dan target network untuk mencegah resource abuse dan SSRF.
- Warning: image processing in-memory dengan file sampai 10MB dapat mengonsumsi CPU/memory besar pada concurrent requests. Rate limit global ada, tetapi belum ada concurrency limit khusus image processing.
- Warning: `src/services/imageService.js` besar. Masih dapat diterima untuk domain tunggal, tetapi hindari menambah banyak fitur baru sebelum test baseline ada.
- Warning: `server.js` langsung `app.listen` walaupun mengekspor `app`, sehingga test Supertest dapat memicu server listen jika tidak di-refactor atau di-isolate.
- Good: tidak ditemukan database connection, file handle persistent, atau stream yang harus ditutup.
- Good: tidak terlihat infinite loop atau recursive processing dari report yang ada.
- Good: tidak ada N+1 query karena tidak ada database.

## Task List

### TASK-001: Dependency Security Remediation

**File yang dibuat/diubah:**
- `package.json`
- `package-lock.json`

**Input/Output yang diharapkan:**
- Input: hasil baseline `npm audit --audit-level=moderate` sebelum perubahan.
- Output: dependency lockfile terbarui dengan vulnerability high hilang, atau daftar exception tertulis jika tidak ada patched version yang aman.

**Dependencies antar task:**
- Tidak ada.

**Kriteria selesai:**
 - [x] Jalankan `npm audit --audit-level=moderate` sebelum perubahan dan catat package yang vulnerable.
 - [x] Update dependency dengan cara terkontrol; utamakan patch/minor compatible update terlebih dahulu.
 - [x] Jangan upgrade major version framework/library kecuali audit tidak bisa selesai tanpa major upgrade.
 - [x] Jika major upgrade diperlukan, berhenti dan minta konfirmasi karena berpotensi breaking change.
 - [x] Jalankan ulang `npm audit --audit-level=moderate`.
 - [x] Tidak ada high/critical vulnerabilities tersisa, atau sisa findings didokumentasikan dengan alasan dan mitigasi.
 - [x] Jalankan `npm start` smoke test, lalu hentikan proses setelah server berhasil start.
 - [x] Pastikan tidak ada package baru yang tidak diperlukan.

**Catatan keamanan:**
- Prioritas utama adalah dependency runtime di path upload/fetch/rate-limit/routing: `axios`, `multer`, `express-rate-limit`, `express`/`path-to-regexp`, dan dependency transitifnya.
- Jangan menghapus `package-lock.json`; lockfile harus dipertahankan untuk reproducible install.
- Jangan memakai `npm audit fix --force` tanpa konfirmasi karena dapat melakukan major upgrade breaking.

### TASK-002: Baseline Test Harness dan Smoke Tests

**File yang dibuat/diubah:**
- `package.json`
- `src/server.js`
- `tests/health.test.js`
- `tests/auth.test.js`
- `tests/upload-validation.test.js`
- `tests/docs.test.js`

**Input/Output yang diharapkan:**
- Input: aplikasi Express existing yang saat ini export `app` tetapi langsung menjalankan `app.listen`.
- Output: `npm test` tersedia dan dapat menjalankan Jest/Supertest tanpa membuka server port permanen.

**Dependencies antar task:**
- Sebaiknya setelah `TASK-001`, tetapi boleh dikerjakan sebelum jika dependency remediation diblokir.

**Kriteria selesai:**
 - [x] Tambahkan script `test` di `package.json` untuk menjalankan Jest.
 - [x] Test tidak membutuhkan external network nyata.
 - [x] Test `GET /health` memverifikasi status `200`, `success=true`, dan field `version` ada.
 - [x] Test protected route tanpa token memverifikasi perilaku ketika `REQUIRE_AUTH=true` dan `API_TOKEN` valid.
 - [x] Test invalid file upload memverifikasi response error ketika file tidak ada atau MIME tidak allowed.
 - [x] Test invalid URL upload memverifikasi URL tidak valid ditolak sebelum controller fetch eksternal.
 - [x] Test docs endpoint memverifikasi `GET /api` dan current decision untuk `GET /api-docs` sesuai perilaku saat task dikerjakan.
 - [x] Jika `server.js` diubah, pisahkan app export dari listen dengan pola minimal agar `npm start` tetap berjalan sama.
 - [x] Jalankan `npm test` dan pastikan semua test pass.

**Catatan keamanan:**
- Test auth harus mengatur env secara eksplisit supaya tidak bergantung pada `.env` lokal.
- Jangan mencetak token dummy ke log test selain nilai placeholder yang tidak sensitif.
- Test harus menjadi safety net sebelum hardening auth dan SSRF.

### TASK-003: Auth Fail-Fast dan Header-Only Token Policy

**File yang dibuat/diubah:**
- `src/config/config.js`
- `src/middleware/auth.js`
- `.env.example`
- `README.md`
- `tests/auth.test.js`

**Input/Output yang diharapkan:**
- Input: env `REQUIRE_AUTH`, `API_TOKEN`, dan request header `Authorization: Bearer <token>`.
- Output: protected routes tidak pernah terbuka diam-diam ketika auth diwajibkan tetapi token belum dikonfigurasi.

**Dependencies antar task:**
- Wajib setelah `TASK-002` agar perubahan auth punya test baseline.

**Kriteria selesai:**
 - [x] Jika `REQUIRE_AUTH=true` dan `API_TOKEN` kosong/null/whitespace, aplikasi gagal start atau config validation melempar error jelas.
 - [x] Jika `REQUIRE_AUTH=false`, behavior development tetap bisa berjalan tanpa token.
 - [x] Jika `REQUIRE_AUTH=true` dan token valid, `POST /upload` dan `POST /upload-url` menerima `Authorization: Bearer <token>`.
 - [x] Jika token hilang, response `401` dengan pesan aman dan tidak mengekspos config internal.
 - [x] Jika token salah, response `403` dengan pesan aman.
 - [x] Hapus dukungan `?token=` atau, jika backward compatibility dibutuhkan, hentikan task dan minta konfirmasi deprecation policy.
 - [x] Update `.env.example` agar menegaskan `API_TOKEN` wajib ketika `REQUIRE_AUTH=true`.
 - [x] Update README agar auth didokumentasikan sebagai static API token, bukan JWT.
 - [x] Jalankan `npm test`.

**Catatan keamanan:**
- Query token adalah leak vector. Default final yang direkomendasikan: hanya `Authorization` header.
- Jangan log token lengkap dalam error atau morgan custom format.
- Ini perubahan perilaku untuk client yang memakai `?token=`; perlakukan sebagai breaking change jika client existing belum dikonfirmasi.

### TASK-004: SSRF Hardening untuk POST /upload-url

**File yang dibuat/diubah:**
- `src/middleware/validation.js`
- `src/controllers/imageController.js`
- `src/services/urlFetchService.js`
- `src/utils/network.js`
- `tests/upload-url-security.test.js`

**Input/Output yang diharapkan:**
- Input: JSON body `{ "url": "https://example.com/image.jpg", "format": "binary|json", "address": "optional", "time_created": "optional" }`.
- Output: hanya URL HTTP/HTTPS publik yang aman yang boleh di-fetch; internal/private/metadata/local target ditolak sebelum request eksternal diproses.

**Dependencies antar task:**
- Wajib setelah `TASK-002`.
- Sangat disarankan setelah `TASK-001` karena dependency HTTP client masuk threat model SSRF.

**Kriteria selesai:**
 - [x] Validasi protocol hanya menerima `http:` dan `https:`.
 - [x] Blok `localhost`, loopback IPv4/IPv6, unspecified address, private IPv4 CIDR, private IPv6, link-local, multicast, dan cloud metadata IP `169.254.169.254`.
 - [x] Lakukan DNS resolve hostname sebelum fetch dan validasi semua resolved IP.
 - [x] Tangani DNS rebinding risk dengan memastikan IP yang di-fetch tetap IP yang sudah divalidasi atau dokumentasikan pendekatan aman yang dipakai.
 - [x] Redirect tidak boleh otomatis mengikuti target internal/private. Batasi redirect ke `0` atau lakukan validasi ulang setiap redirect.
 - [x] Tetap gunakan timeout dan max content length dari config.
 - [x] Validasi `content-type` harus menerima MIME yang allowed walau header memiliki parameter seperti `image/jpeg; charset=binary`.
 - [x] Jangan kirim `X-Source-URL` raw jika URL bisa mengandung credential/query sensitive; sanitize atau hilangkan header tersebut.
 - [x] Test menolak `localhost`, `127.0.0.1`, `10.0.0.1`, `172.16.0.1`, `192.168.1.1`, `169.254.169.254`, `::1`, dan hostname yang resolved ke private IP.
 - [x] Test tidak melakukan network eksternal nyata; mock DNS dan HTTP client.
 - [x] Jalankan `npm test`.

**Catatan keamanan:**
- Ini task paling penting untuk endpoint URL upload.
- Jangan mengandalkan string matching hostname saja.
- Jangan memperbolehkan credential dalam URL seperti `https://user:pass@example.com/image.jpg` kecuali ada requirement eksplisit.
- Jika business requirement butuh private URL, hentikan task dan minta keputusan allowlist eksplisit.

### TASK-005: API Documentation Consistency Pass

**File yang dibuat/diubah:**
- `README.md`
- `openapi.yaml`
- `public/openapi.json`
- `src/controllers/imageController.js`
- `tests/docs.test.js`

**Input/Output yang diharapkan:**
- Input: implementasi aktual endpoint, auth, version, watermark behavior.
- Output: README, OpenAPI, public JSON spec, dan `GET /api` konsisten dengan runtime behavior.

**Dependencies antar task:**
- Setelah `TASK-003` untuk final auth behavior.
- Setelah keputusan `/api-docs` publik/protected dibuat.
- Setelah keputusan `Verified` badge dibuat.

**Kriteria selesai:**
- [ ] OpenAPI security scheme tidak menyebut JWT jika implementasi tetap static API token.
- [ ] `GET /api` memakai version dari `package.json` atau sumber config yang sama, bukan hardcoded `1.0.0`.
- [ ] README, `openapi.yaml`, `public/openapi.json`, dan `GET /api` menyebut endpoint auth dengan status yang sama.
- [ ] Dokumentasi watermark tidak menyebut `Verified` jika service tidak merender verified badge.
- [ ] Dokumentasi response binary/JSON sesuai header/body aktual.
- [ ] Dokumentasi `POST /upload-url` menjelaskan URL publik-only dan private network block setelah `TASK-004`.
- [ ] Jika `/api-docs` tetap publik, README harus menyatakan jelas bahwa endpoint ini publik.
- [ ] Jika `/api-docs` diproteksi, route dan test harus sudah disesuaikan di task auth/docs terkait.
- [ ] Jalankan `npm test`.

**Catatan keamanan:**
- Dokumentasi auth yang salah dapat menyebabkan client mengirim token dengan cara tidak aman.
- Jangan menampilkan contoh token nyata; gunakan placeholder seperti `<API_TOKEN>`.
- Dokumentasikan bahwa token harus dikirim via `Authorization: Bearer <API_TOKEN>`.

### TASK-006: Production Configuration Hardening

**File yang dibuat/diubah:**
- `src/config/config.js`
- `src/server.js`
- `.env.example`
- `README.md`
- `docker-compose.yml`
- `tests/config-security.test.js`

**Input/Output yang diharapkan:**
- Input: env `NODE_ENV`, `CORS_ORIGIN`, optional trust proxy setting, dan deployment target.
- Output: production default lebih aman dan development tetap ergonomis.

**Dependencies antar task:**
- Setelah `TASK-002`.
- Perlu jawaban deployment target sebelum mengubah `docker-compose.yml` atau `trust proxy`.

**Kriteria selesai:**
- [ ] Untuk `NODE_ENV=production`, `CORS_ORIGIN=*` ditolak atau menghasilkan warning/fail-fast sesuai keputusan tim.
- [ ] `.env.example` menjelaskan origin production harus eksplisit.
- [ ] `trust proxy` dibuat configurable jika deployment tidak selalu satu reverse proxy.
- [ ] CSP dievaluasi: pertahankan `unsafe-inline` hanya jika Swagger/static UI membutuhkan, dan dokumentasikan alasan.
- [ ] `imgSrc` tidak mengizinkan `http:` pada production kecuali ada alasan eksplisit.
- [ ] Rate limit tetap aktif dan compatible dengan deployment proxy setelah `trust proxy` decision.
- [ ] Jika local docker compose harus didukung, tambahkan atau dokumentasikan port mapping tanpa merusak Dokploy deployment.
- [ ] Jalankan `npm test` dan smoke `npm start`.

**Catatan keamanan:**
- CORS wildcard dan proxy trust yang salah dapat melemahkan boundary API dan rate limiting.
- Jangan menurunkan security headers hanya agar Swagger terlihat bekerja; cari konfigurasi minimal yang masih kompatibel.
- Perubahan compose/network bisa memengaruhi deployment production, jadi minta konfirmasi jika target belum jelas.

### TASK-007: Error Logging dan Sensitive Data Redaction

**File yang dibuat/diubah:**
- `src/middleware/errorHandler.js`
- `src/server.js`
- `src/utils/errors.js`
- `tests/error-redaction.test.js`

**Input/Output yang diharapkan:**
- Input: request yang memicu error dan mungkin mengandung query sensitive seperti `token`, `api_key`, `password`, atau URL sumber.
- Output: log server tidak memuat nilai secret/token, response tetap aman dan informatif.

**Dependencies antar task:**
- Setelah `TASK-002`.
- Sebaiknya setelah `TASK-003` karena query token seharusnya sudah dihapus.

**Kriteria selesai:**
- [ ] Error logger tidak mencetak URL lengkap dengan query sensitive.
- [ ] Redaction minimal mencakup key `token`, `api_token`, `apiKey`, `api_key`, `authorization`, `password`, `secret`.
- [ ] Response error production tetap tidak menyertakan stack trace.
- [ ] Test membuktikan nilai token dummy tidak muncul pada log yang dimock.
- [ ] Jangan menambahkan logging library baru kecuali ada alasan kuat.
- [ ] Jalankan `npm test`.

**Catatan keamanan:**
- Sensitive data leakage lewat log sering lebih berbahaya daripada response error.
- Jika morgan tetap `combined`, pastikan request URL yang mengandung query secret tidak menjadi leak, atau dokumentasikan bahwa query token sudah tidak didukung.

### TASK-008: Cleanup Legacy dan Unused Code

**File yang dibuat/diubah:**
- `src/middleware/auth.js`
- `src/middleware/validation.js`
- `src/middleware/errorHandler.js`
- `src/services/imageService.js`
- `tests/*.test.js`

**Input/Output yang diharapkan:**
- Input: source code yang memiliki helper/legacy path tidak terpakai.
- Output: kode lebih kecil dan jelas tanpa mengubah behavior publik yang masih dibutuhkan.

**Dependencies antar task:**
- Setelah `TASK-002`.
- Setelah `TASK-003` untuk menentukan nasib `optionalAuth` dan query token.
- Setelah konfirmasi tidak ada external consumer untuk legacy method.

**Kriteria selesai:**
- [ ] Identifikasi semua export/function tidak terpakai: `optionalAuth`, generic `validate`, `validateImageBuffer`, `generateWatermarkText`, `calculateFontSize`, dan Mongoose-specific error handler.
- [ ] Jangan hapus function/export jika masih dipakai test, route, atau documented public API.
- [ ] Jika ragu apakah legacy method dipakai external consumer, berhenti dan minta konfirmasi.
- [ ] Hapus Mongoose error handling hanya jika project memang tidak akan memakai Mongoose/database dalam scope ini.
- [ ] Setelah cleanup, jalankan `npm test`.
- [ ] Jalankan smoke endpoint utama jika memungkinkan: `GET /health`, invalid upload, invalid URL.

**Catatan keamanan:**
- Dead code menambah permukaan kesalahan dan asumsi palsu, tetapi menghapus export bisa breaking untuk consumer internal/eksternal.
- Jangan melakukan cleanup bersamaan dengan refactor behavior security agar diff mudah direview.

### TASK-009: Docker dan Local Development Ergonomics

**File yang dibuat/diubah:**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.gitignore`
- `DEPLOYMENT.md`
- `README.md`

**Input/Output yang diharapkan:**
- Input: deployment target final dan kebutuhan local development.
- Output: Docker build reproducible, local compose jelas, dan file temporary/secret tidak mudah ter-commit.

**Dependencies antar task:**
- Setelah target deployment dikonfirmasi.
- Sebaiknya setelah `TASK-001` agar lockfile dependency final.

**Kriteria selesai:**
- [ ] Dockerfile memakai install dependency yang reproducible, idealnya `npm ci --omit=dev` jika compatible dengan lockfile.
- [ ] `docker compose up` behavior terdokumentasi: apakah expose port lokal atau hanya external reverse proxy network.
- [ ] Jika local compose didukung, service memiliki `ports` yang jelas dan tidak bentrok dengan README.
- [ ] `.gitignore` mencakup `.env.local`, `.env.*.local`, logs, coverage, build/cache artifacts, OS/editor files yang umum.
- [ ] `.dockerignore` memastikan secret/local/dev artifact tidak masuk build context.
- [ ] Healthcheck port konsisten dengan container `PORT`.
- [ ] Jalankan minimal `docker build` jika environment mendukung; jika tidak, dokumentasikan alasan tidak dijalankan.

**Catatan keamanan:**
- Jangan commit secret, `.env`, credential, private key, atau token deployment.
- Port exposure harus mengikuti target deployment, bukan asumsi.
- Build image harus tetap menjalankan app sebagai non-root user seperti kondisi saat ini.

### TASK-010: Image Processing Resource Guardrails

**File yang dibuat/diubah:**
- `src/config/config.js`
- `src/routes/index.js`
- `src/controllers/imageController.js`
- `src/services/imageService.js`
- `tests/upload-validation.test.js`

**Input/Output yang diharapkan:**
- Input: uploaded image buffer atau downloaded URL image buffer.
- Output: image yang terlalu besar secara dimensi/pixel/page count atau tidak valid ditolak sebelum processing berat.

**Dependencies antar task:**
- Setelah `TASK-002`.
- Sebaiknya setelah `TASK-004` untuk URL image path.

**Kriteria selesai:**
- [x] Tentukan batas dimensi/pixel maksimum yang eksplisit, misalnya `MAX_IMAGE_PIXELS`, sebelum implementasi. Jika belum ada requirement, tanya user.
- [x] Validasi metadata Sharp dilakukan sebelum compositing watermark.
- [x] Tolak image dengan width/height kosong, format unsupported, atau pixel count melebihi limit.
- [x] Batas file size 10MB tetap berlaku untuk upload file dan URL download.
- [x] Error message user-friendly dan tidak mengekspos stack/internal Sharp detail.
- [x] Test mencakup file invalid dan metadata limit jika mocking memungkinkan.
- [x] Jalankan `npm test`.

**Catatan keamanan:**
- File 10MB bisa tetap menghasilkan pixel count sangat besar. Guardrail dimensi mencegah decompression/resource bombs.
- Jangan menaikkan limit ukuran tanpa analisis memory/CPU.
- Hindari menyimpan file ke disk kecuali ada requirement eksplisit.

## Checkpoints

### Checkpoint A: Security Foundation

- [ ] `TASK-001` selesai.
- [ ] `TASK-002` selesai.
- [ ] `npm audit --audit-level=moderate` tidak memiliki high/critical vulnerability tanpa exception tertulis.
- [ ] `npm test` tersedia dan pass.

### Checkpoint B: Auth dan SSRF Hardened

- [ ] `TASK-003` selesai.
- [ ] `TASK-004` selesai.
- [ ] Protected routes tidak bisa terbuka karena missing `API_TOKEN`.
- [ ] URL upload tidak dapat fetch private/internal/metadata target dalam test.

### Checkpoint C: Docs dan Production Readiness

- [ ] `TASK-005` selesai.
- [ ] `TASK-006` selesai.
- [ ] README/OpenAPI/runtime docs konsisten.
- [ ] Production env default aman atau fail-fast.

### Checkpoint D: Cleanup dan Operational Polish

- [x] `TASK-007` selesai.
- [x] `TASK-008` selesai.
- [x] `TASK-009` selesai jika deployment target sudah dikonfirmasi.
- [x] `TASK-010` selesai jika API akan menerima traffic production/concurrent.

## Urutan Eksekusi yang Direkomendasikan

1. `TASK-001` Dependency Security Remediation.
2. `TASK-002` Baseline Test Harness dan Smoke Tests.
3. `TASK-003` Auth Fail-Fast dan Header-Only Token Policy.
4. `TASK-004` SSRF Hardening untuk POST /upload-url.
5. `TASK-005` API Documentation Consistency Pass.
6. `TASK-006` Production Configuration Hardening.
7. `TASK-007` Error Logging dan Sensitive Data Redaction.
8. `TASK-010` Image Processing Resource Guardrails.
9. `TASK-008` Cleanup Legacy dan Unused Code.
10. `TASK-009` Docker dan Local Development Ergonomics.

## Instruksi untuk Agent yang Mengerjakan TASK-XXX

- Baca `AGENTS.md` dan `docs/TASKS.md` sebelum mulai.
- Kerjakan hanya task yang disebut user.
- Jalankan Phase 3, Phase 4, Phase 5, dan Phase 6 untuk task tersebut.
- Jangan mengubah file di luar daftar task kecuali benar-benar diperlukan; jika perlu, jelaskan di report.
- Jangan menambahkan dependency baru tanpa menyebutkan alasan eksplisit.
- Jika menemukan breaking change, berhenti dan minta konfirmasi.
- Setelah selesai, update checklist task terkait di `docs/TASKS.md`.
