# CONTINUATION PLAN

Rencana ini disusun dari hasil Fase 1-3: `docs/report-fase-1.md`, `docs/report-fase-2.md`, dan `docs/report-fase-3.md`. Tidak ada perubahan kode aplikasi pada fase ini.

## Pemahaman saya tentang project ini

Project ini adalah RESTful API Node.js/Express untuk memproses gambar secara in-memory dan menambahkan watermark berupa timestamp, alamat, serta brand logo. Fondasi fitur utama sudah berjalan secara konseptual: upload file lokal, upload dari URL, validasi input, API token auth, image processing dengan Sharp, output binary/JSON, health check, dan dokumentasi Swagger. Progress project terlihat sudah melewati tahap prototype, tetapi sebelum fitur baru ditambahkan perlu hardening karena ada dependency vulnerabilities high, SSRF protection masih lemah, dan auth bisa tidak aktif karena konfigurasi environment yang salah.

## Sebelum tambah fitur baru — yang harus diselesaikan dulu

| Priority | Task | Alasan |
|----------|------|--------|
| P0 | Update dependency runtime yang vulnerable lalu verifikasi `npm audit` | `npm audit` menemukan 12 vulnerabilities, termasuk 7 high pada `axios`, `express-rate-limit`, `multer`, `path-to-regexp`, dan dependency terkait. Ini berdampak langsung ke endpoint upload/file fetch. |
| P0 | Hardening SSRF protection untuk `POST /upload-url` | Validasi saat ini hanya memblokir beberapa hostname lokal. Perlu block private/link-local/metadata IP, validasi DNS resolve, dan kontrol redirect sebelum fetch URL eksternal. |
| P0 | Fail-fast auth config di production jika `REQUIRE_AUTH=true` tetapi `API_TOKEN` kosong | Saat ini middleware auth skip jika token tidak tersedia. Ini bisa membuat endpoint upload terbuka karena misconfiguration. |
| P1 | Hapus atau disable token via query parameter | `?token=` rentan bocor ke log/history/proxy. Header `Authorization: Bearer` sebaiknya menjadi satu-satunya mekanisme auth untuk production. |
| P1 | Tambah baseline test script dan test critical paths | Jest/Supertest ada, tetapi tidak ada `npm test` dan tidak ditemukan test file. Minimal perlu test health, auth required, upload validation, URL validation, dan error response. |
| P1 | Sinkronkan dokumentasi API dengan implementasi aktual | OpenAPI menyebut JWT, `/api-docs` publik tidak sesuai README, JSON docs version masih `1.0.0`, dan docs masih menyebut verified badge yang tidak dirender. |
| P1 | Perketat production configuration defaults | CORS default `*`, CSP memakai `'unsafe-inline'`, dan `trust proxy` selalu aktif. Perlu keputusan deployment agar konfigurasi tepat. |
| P2 | Rapikan dead/legacy code yang tidak terpakai | `optionalAuth`, generic `validate`, `validateImageBuffer`, legacy watermark methods, dan Mongoose error handler menambah noise. Jangan hapus sebelum konfirmasi tidak ada external consumer. |
| P2 | Perbaiki deployment/dev ergonomics | `docker-compose.yml` tidak expose ports untuk local use, Dockerfile sebaiknya pakai `npm ci --omit=dev`, `.gitignore` masih minimal. |
| P2 | Evaluasi pemecahan `imageService.js` jika fitur watermark bertambah | File service 576 lines masih bisa diterima, tetapi akan sulit dirawat jika opsi watermark/layout baru ditambahkan tanpa struktur tambahan. |

## Fitur yang siap untuk dilanjutkan

- Upload file lokal: Fondasinya ada. Bisa di-extend dengan opsi watermark tambahan, tetapi setelah dependency upload dan auth hardened.
- Upload dari URL: Fondasinya ada. Bisa dilanjutkan setelah SSRF protection diperkuat dan dependency `axios`/redirect behavior ditangani.
- Watermark customization: Timestamp, address, responsive font, logo overlay, max address lines, dan theme overrides sudah ada di service. Bisa dikembangkan menjadi API options yang eksplisit setelah validasi kontrak request ditentukan.
- API documentation: `openapi.yaml`, `public/openapi.json`, Swagger UI, dan JSON docs sudah ada. Siap dibenahi agar sesuai implementasi aktual.
- Testing API: Jest/Supertest sudah tersedia sebagai dev dependencies. Bisa langsung dibuat baseline integration tests setelah script `test` ditambahkan.
- Docker deployment: Dockerfile dan docker-compose sudah ada. Siap dirapikan untuk local/prod profile setelah target deployment dikonfirmasi.

## Yang perlu dikonfirmasi dengan Anda sebelum lanjut

1. Untuk production, apakah `POST /upload-url` memang wajib dipertahankan, atau boleh dinonaktifkan sementara sampai SSRF hardening selesai?
2. Apakah deployment utama project ini Dokploy/reverse proxy external network, Vercel Docker, atau local Docker Compose juga harus didukung?
3. Apakah `/api-docs` harus publik seperti saat ini, atau harus ikut protected auth seperti klaim README?
4. Apakah auth tetap static API token, atau ada rencana pindah ke JWT/OAuth/API key multi-client?
5. Apakah token via query parameter masih dibutuhkan untuk backward compatibility dengan client existing?
6. Watermark final yang diinginkan apakah memang tanpa `Verified` badge, atau dokumentasi lama yang menyebut `Verified` masih harus dipertahankan?
7. Apakah fitur watermark customization akan dibuka ke request API, atau tetap internal/config-only?

## Saran urutan pengerjaan

1. Jalankan dependency remediation dengan `npm audit fix` terkontrol, review perubahan `package-lock.json`, lalu ulang `npm audit --audit-level=moderate` - ini mengurangi risiko known vulnerabilities paling cepat.
2. Tambah baseline test script dan minimal integration tests sebelum refactor/hardening - agar perubahan security bisa diverifikasi dan tidak merusak endpoint utama.
3. Hardening auth config - fail-fast jika production/auth required tanpa `API_TOKEN`, dan tentukan apakah query token masih diizinkan.
4. Hardening `/upload-url` SSRF - validasi hostname/IP, block private ranges/metadata endpoint, handle DNS resolve, dan batasi redirect behavior.
5. Sinkronkan OpenAPI/README/JSON docs dengan implementasi - hilangkan misleading JWT/version/Verified badge/public docs mismatch.
6. Perketat production config - CORS, CSP, trust proxy, dan deployment defaults berdasarkan target environment yang dikonfirmasi.
7. Rapikan legacy/dead code - hanya setelah test baseline ada dan tidak ada kebutuhan backward compatibility.
8. Lanjutkan fitur baru - watermark options, API customization, atau deployment polish setelah P0/P1 selesai.

## Suggested Task Breakdown

### Task 1: Dependency Security Remediation

**Description:** Update vulnerable dependencies using a controlled `npm audit fix`, then inspect runtime package changes.

**Acceptance criteria:**
- [ ] `npm audit --audit-level=moderate` no longer reports high vulnerabilities, or remaining findings are documented with rationale.
- [ ] `package.json` and `package-lock.json` changes are reviewed.
- [ ] App still starts with `npm start`.

**Verification:**
- [ ] `npm audit --audit-level=moderate`
- [ ] `npm start` or equivalent smoke run

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `package-lock.json`

**Estimated scope:** Small

### Task 2: Baseline API Tests

**Description:** Add minimal Jest/Supertest setup covering current behavior before security changes.

**Acceptance criteria:**
- [ ] `npm test` script exists.
- [ ] Tests cover `GET /health`, missing auth on protected endpoint, invalid file upload, invalid URL upload, and docs endpoint behavior.
- [ ] Tests do not require real external network calls.

**Verification:**
- [ ] `npm test`

**Dependencies:** Task 1 recommended

**Files likely touched:**
- `package.json`
- `src/server.js` if listener export needs test-safe adjustment
- `tests/*.test.js`

**Estimated scope:** Medium

### Task 3: Auth Fail-Fast Hardening

**Description:** Prevent production/protected configuration from silently disabling auth when token is missing.

**Acceptance criteria:**
- [ ] If `REQUIRE_AUTH=true` and `API_TOKEN` is empty, startup or config validation fails clearly.
- [ ] Protected routes remain protected when token is configured.
- [ ] Behavior is documented in `.env.example`/README if changed.

**Verification:**
- [ ] `npm test`
- [ ] Manual env smoke check for missing `API_TOKEN`

**Dependencies:** Task 2 recommended

**Files likely touched:**
- `src/config/config.js`
- `src/middleware/auth.js`
- `.env.example`
- `README.md`

**Estimated scope:** Medium

### Task 4: SSRF Hardening for URL Upload

**Description:** Strengthen `POST /upload-url` validation so server-side fetch cannot access local/private/metadata/internal resources.

**Acceptance criteria:**
- [ ] Blocks localhost, loopback, private IPv4, private IPv6, link-local, and cloud metadata IPs.
- [ ] Handles DNS resolution and redirect behavior safely.
- [ ] Tests cover allowed public URL shape and blocked internal URL cases without requiring external network.

**Verification:**
- [ ] `npm test`
- [ ] Targeted URL validation tests

**Dependencies:** Task 2 recommended, Task 1 strongly recommended

**Files likely touched:**
- `src/middleware/validation.js`
- `src/controllers/imageController.js`
- `tests/*.test.js`

**Estimated scope:** Medium

### Task 5: Documentation Consistency Pass

**Description:** Align README, OpenAPI, JSON docs, and public docs with actual auth/version/watermark behavior.

**Acceptance criteria:**
- [ ] Static API token is documented accurately, not described as JWT.
- [ ] Version is consistent with `package.json` or dynamically sourced.
- [ ] `/api-docs` public/protected status is accurately documented.
- [ ] Verified badge docs match actual watermark output.

**Verification:**
- [ ] Manual doc review
- [ ] `npm test` if docs endpoint tested

**Dependencies:** Clarify `/api-docs` auth decision first

**Files likely touched:**
- `README.md`
- `openapi.yaml`
- `public/openapi.json`
- `src/controllers/imageController.js`

**Estimated scope:** Medium

## Checkpoints

### Checkpoint 1: Security Foundation

- [ ] Task 1 complete
- [ ] Task 2 complete
- [ ] No known high vulnerabilities in reachable runtime dependencies, or exceptions documented
- [ ] Baseline tests pass

### Checkpoint 2: Auth and SSRF Hardening

- [ ] Task 3 complete
- [ ] Task 4 complete
- [ ] Protected endpoint behavior verified
- [ ] URL upload cannot fetch internal/private targets in tests

### Checkpoint 3: Documentation and Readiness

- [ ] Task 5 complete
- [ ] README/OpenAPI/runtime docs consistent
- [ ] Project ready for new feature work or production hardening sprint

## Risiko dan mitigasi

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dependency updates introduce breaking behavior | High | Update in small step, run smoke tests, inspect lockfile diff. |
| SSRF hardening breaks legitimate private image URLs used by current clients | Medium/High | Confirm business requirement before blocking private networks; if needed, implement explicit allowlist. |
| Removing query token breaks existing integrations | Medium | Confirm client usage first; if needed, deprecate with warning before removal. |
| Protecting `/api-docs` breaks public developer docs | Medium | Decide intended docs exposure before changing route auth. |
| Test setup may require refactor of server listener | Medium | Keep change minimal: export app separately or guard listener only if necessary. |

## Status Fase

Fase 4 selesai. Onboarding 4 fase sudah lengkap dan semua report tersedia:
- `docs/report-fase-1.md`
- `docs/report-fase-2.md`
- `docs/report-fase-3.md`
- `docs/report-fase-4.md`
