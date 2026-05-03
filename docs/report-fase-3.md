# HEALTH REPORT

Fase ini mengevaluasi kondisi kode berdasarkan pembacaan source aktual dan hasil `npm audit --audit-level=moderate`. Tidak ada perubahan kode aplikasi pada fase ini.

## Critical (harus diperbaiki sebelum lanjut coding)

- Dependency vulnerabilities high pada runtime dependencies: `package-lock.json` / hasil `npm audit` - ditemukan 12 vulnerabilities total, 7 high dan 5 moderate. Yang paling relevan untuk production path aplikasi ini: `axios` high termasuk SSRF/header injection related advisories, `express-rate-limit` high terkait bypass rate limit IPv4-mapped IPv6, `multer` high terkait DoS/resource exhaustion, dan `path-to-regexp` high terkait ReDoS via dependency Express. Karena aplikasi menerima upload file dan fetch URL eksternal, ini blocking untuk hardening sebelum development fitur baru.
- SSRF protection pada upload URL masih belum lengkap: `src/middleware/validation.js:80-98`, `src/controllers/imageController.js:73-81` - validasi hanya memblokir hostname yang mengandung `localhost`, `127.0.0.1`, `0.0.0.0`, dan `::1`. Belum terlihat blocking untuk private CIDR seperti `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, link-local, metadata service `169.254.169.254`, DNS rebinding, redirect ke internal host, atau validasi IP hasil DNS resolve. Endpoint `POST /upload-url` memanggil `axios.get(url)` langsung setelah validasi ini.
- Autentikasi bisa nonaktif secara diam-diam jika `API_TOKEN` kosong: `src/middleware/auth.js:11-14`, `src/config/config.js:9-12` - `authenticateToken` melakukan skip auth ketika `REQUIRE_AUTH` false atau `API_TOKEN` tidak tersedia. Pada production, misconfiguration `REQUIRE_AUTH=true` tetapi `API_TOKEN` kosong akan membuat protected routes tidak terlindungi. Risiko tinggi karena endpoint upload melakukan pemrosesan resource-intensive.

## Warning (perlu diperbaiki tapi tidak blocking)

- Token lewat query parameter didukung: `src/middleware/auth.js:25-28` - fallback `?token=` berisiko terekam di access log, browser history, reverse proxy log, dan analytics. Header Authorization lebih aman.
- CORS default wildcard: `src/config/config.js:47-50`, `.env.example:20`, `docker-compose.yml:19` - default `CORS_ORIGIN=*` memudahkan development, tetapi untuk production sebaiknya origin eksplisit. README memang menyarankan domain spesifik, namun config default tetap terbuka.
- Content Security Policy masih mengizinkan inline script/style dan HTTP images: `src/server.js:17-40` - `scriptSrc` dan `styleSrc` memakai `'unsafe-inline'`, `imgSrc` mengizinkan `http:`. Ini mungkin dibutuhkan Swagger/static UI, tetapi tetap melemahkan CSP.
- Swagger docs publik tidak sesuai klaim README: `src/routes/index.js:41-46`, README line 98 - README menyatakan semua endpoint kecuali `/health` dan `/api` butuh auth, tetapi `/api-docs` publik dari route aktual.
- OpenAPI menyebut `bearerFormat: JWT`, implementasi memakai static API token: `openapi.yaml:48-54`, `src/middleware/auth.js` - ini bukan bug runtime, tetapi misleading bagi client dan maintainer.
- `imageController.getDocumentation` mengembalikan version lama: `src/controllers/imageController.js:164-168` - hardcoded `version: "1.0.0"`, sementara `package.json` dan OpenAPI memakai `2.1.0`.
- Dokumentasi JSON masih menyebut verified badge yang tidak dirender oleh service saat ini: `src/controllers/imageController.js:203-215`, `src/services/imageService.js:216-220` - inkonsistensi user-facing docs.
- Error handler memiliki sisa kode Mongoose tanpa dependency/database terkait: `src/middleware/errorHandler.js:30-46` - kemungkinan template/legacy code. Tidak blocking, tetapi menambah noise dan asumsi yang tidak berlaku.
- Helper/middleware tidak terpakai: `src/middleware/auth.js:49-79`, `src/middleware/validation.js:113-123`, `src/services/imageService.js:532-573` - `optionalAuth`, generic `validate`, `validateImageBuffer`, `generateWatermarkText`, dan `calculateFontSize` tidak terlihat dipakai. Ini indikasi dead/legacy code yang perlu dirapikan setelah konteks bisnis jelas.
- Tidak ada test script meskipun Jest/Supertest tersedia: `package.json:7-10`, `package.json:30-33` - dependency test ada, tetapi `npm test` belum tersedia dan tidak ditemukan `*.test.js` / `*.spec.js`.
- `.gitignore` sangat minimal: `.gitignore:1-2` - hanya mengabaikan `node_modules` dan `.env`; belum mencakup `.env.local`, `.env.*.local`, coverage, logs, build artifacts, atau OS/editor files.
- Logging error ke `console.error` dapat memuat URL request lengkap: `src/middleware/errorHandler.js:13-28` - saat token dikirim via query parameter, `req.url` berpotensi memasukkan token ke log error.
- `app.set('trust proxy', 1)` selalu aktif: `src/server.js:13-15` - tepat jika selalu di belakang satu trusted reverse proxy, tetapi bisa memengaruhi akurasi IP/rate limit bila deployment berbeda.
- `Dockerfile` build stage memakai `npm install --omit=dev`: `Dockerfile:11-13` - production install bekerja, tetapi `npm ci --omit=dev` biasanya lebih reproducible untuk lockfile. Ini improvement, bukan critical.
- `docker-compose.yml` tidak expose ports: `docker-compose.yml:41-45` - kemungkinan sengaja untuk Dokploy external network, tetapi tidak cocok untuk local compose tanpa reverse proxy.

## Good (yang sudah dilakukan dengan benar)

- Struktur folder cukup jelas: `src/config`, `src/controllers`, `src/middleware`, `src/routes`, `src/services`, `src/utils` memisahkan concern utama.
- Entry point sederhana dan terpusat: `src/server.js` memasang middleware global, route, dan error handling dengan urutan yang mudah dibaca.
- Upload file tidak disimpan ke disk: `src/routes/index.js:20-24` memakai `multer.memoryStorage`, sesuai klaim in-memory processing.
- File upload memiliki batas ukuran dan MIME allowlist: `src/routes/index.js:21-38`, `src/middleware/validation.js:46-62`.
- URL upload divalidasi dengan Joi dan protocol HTTP/HTTPS dibatasi: `src/middleware/validation.js:15-25`, `src/middleware/validation.js:80-87`.
- Input text disanitasi sebelum diproses ke SVG: `src/controllers/imageController.js:19-21`, `src/utils/errors.js:40-57`, `src/services/imageService.js:107-117`.
- SVG text di-escape sebelum dirender: `src/services/imageService.js:110-117`, digunakan di builder timestamp/address/logo.
- Sharp metadata divalidasi sebelum watermark: `src/services/imageService.js:380-396`.
- Custom timestamp punya format whitelist dan year range: `src/services/imageService.js:398-445`.
- Error response tidak mengekspos stack trace di non-development: `src/middleware/errorHandler.js:84-91`.
- Security middleware aktif: `src/server.js:17-40` menggunakan Helmet dengan CSP, HSTS, noSniff, dan referrer policy.
- Rate limiting global aktif: `src/server.js:43-45`, `src/config/config.js:36-45`.
- Docker runtime menjalankan app sebagai non-root user dan memakai `tini`: `Dockerfile:57-74`.
- Healthcheck tersedia di Dockerfile dan docker-compose: `Dockerfile:66-68`, `docker-compose.yml:24-30`.
- `.env` sudah diabaikan oleh git: `.gitignore:1-2`.

## Security Quick Scan Checklist

- Input validation: Ada untuk upload file dan URL via Joi/Multer, tetapi SSRF/private network validation masih partial.
- SQL query: Tidak ditemukan database atau SQL query pada Fase 3.
- Auth: Protected route memasang middleware auth, tetapi enforcement bisa skip jika env salah/kurang. `/api-docs` publik meski README tidak mengecualikannya.
- Secrets: Tidak ditemukan hardcoded secret nyata di source; `.env.example` hanya placeholder. `.gitignore` sudah mengabaikan `.env`.
- Dependencies: `npm audit --audit-level=moderate` menemukan 12 vulnerabilities, termasuk high di dependency runtime.

## Architecture Scan

- Struktur folder konsisten untuk aplikasi Express kecil-menengah.
- Separation of concerns cukup baik: route wiring di `routes`, request handling di `controllers`, image logic di `services`, validation/auth/error di `middleware`.
- Business logic image processing cukup besar dan terkonsentrasi di `src/services/imageService.js` sebanyak 576 lines. Ini masih bisa diterima untuk satu domain utama, tetapi perlu dijaga jika fitur watermark bertambah.
- Tidak terlihat circular dependency obvious dari pola require yang dibaca.
- Ada beberapa template/legacy artifacts yang tidak sesuai domain saat ini: handler Mongoose, method deprecated, dan helper unused.

## Overall Health Score: 6/10

Justifikasi: Arsitektur dasar dan alur fitur utama sudah rapi untuk API kecil, dengan validasi input, error handling, Docker hardening, dan separation of concerns yang cukup baik. Skor turun signifikan karena dependency audit menemukan high vulnerabilities pada runtime path, SSRF protection upload URL masih lemah, dan auth bisa nonaktif karena misconfiguration `API_TOKEN` kosong.

**Status Fase:** Fase 3 selesai. Belum ada perubahan kode aplikasi.
