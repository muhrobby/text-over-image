# PROJECT SNAPSHOT

**Nama Project:** `text-over-image-api`

**Versi:** `2.1.0`

**Tujuan:**
RESTful API untuk menambahkan watermark profesional ke gambar dengan timestamp, alamat, dan brand logo. Berdasarkan `README.md` dan `openapi.yaml`, project ini fokus pada image processing in-memory menggunakan Sharp, dengan endpoint upload file dan upload dari URL.

**Tech Stack:**
- Runtime: Node.js `>=18.0.0` menurut `README.md`; Dockerfile memakai `node:20-bookworm-slim`
- Module system: CommonJS
- Framework: Express `^5.1.0`
- Image processing: Sharp `^0.34.3`
- File upload: Multer `^2.0.2`
- HTTP client: Axios `^1.11.0`
- Validation: Joi `^18.0.1`
- Security middleware: Helmet, CORS, express-rate-limit
- Logging: Morgan
- Time handling: Moment, moment-timezone
- API docs: OpenAPI YAML + Swagger UI
- Database: Tidak ditemukan pada Fase 1
- Auth: Bearer API token via `API_TOKEN` dan `REQUIRE_AUTH`
- Testing dependencies: Jest dan Supertest ada di `devDependencies`, tetapi `package.json` belum memiliki script `test`
- Deployment: Dockerfile, `docker-compose.yml`, `vercel.json` berbasis Docker

**Cara menjalankan:**
- Install: `npm install`
- Development: `npm run dev`
- Production local: `npm start`
- Docker build: `docker build -t text-over-image-api .`
- Docker run: `docker run -d -p 3000:3000 -e REQUIRE_AUTH=true -e API_TOKEN=your-secure-token -e NODE_ENV=production --name watermark-api text-over-image-api`
- Docker Compose: `docker compose up -d` kemungkinan digunakan, tetapi perlu dicatat compose file tidak mem-publish `ports`, hanya join ke external network `dokploy-network`

**Environment variables yang dibutuhkan:**
- `PORT`: Port HTTP server. Default dari config `3000`; docker-compose mengisi `3001`
- `NODE_ENV`: Environment aplikasi. Default config `development`; `.env.example` memakai `production`
- `REQUIRE_AUTH`: Jika `true`, endpoint protected wajib Bearer token
- `API_TOKEN`: Token autentikasi API
- `CORS_ORIGIN`: Origin CORS yang diizinkan. Default `*`
- `WATERMARK_ADDRESS`: Default address pada watermark jika request tidak mengirim address

**Struktur folder root:**

```text
.
├── .dockerignore
├── .env.example
├── .github/
│   └── instructions/
├── .gitignore
├── AGENTS-ONBOARDING.md
├── AGENTS.md
├── DEPLOYMENT.md
├── Dockerfile
├── docker-compose.yml
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
│   │   └── imageService.js
│   └── utils/
│       ├── errors.js
│       └── response.js
└── vercel.json
```

**Entry point yang ditemukan:**
- `package.json` menetapkan `"main": "src/server.js"`
- Script `start`: `node src/server.js`
- Script `dev`: `nodemon src/server.js`
- `src/server.js` membuat Express app, memasang middleware security/CORS/rate limit/body parser/static files, lalu mount routes dari `src/routes/index.js`
- `src/routes/index.js` memuat endpoint awal:
- `GET /health`
- `POST /upload`
- `POST /upload-url`
- `GET /api`
- `GET /api-docs`

**Konfigurasi yang ditemukan:**
- `.env.example` tersedia
- Tidak ada folder root `config/`
- Konfigurasi aplikasi ada di `src/config/config.js`
- Tidak ditemukan `next.config.*`, `requirements.txt`, atau `go.mod`

**Hal yang belum jelas / perlu ditanyakan:**
- `docker-compose.yml` memakai `PORT: 3001` dan healthcheck `localhost:3001`, tetapi tidak mendefinisikan `ports`; ini mungkin memang untuk Dokploy reverse proxy, tapi belum bisa dipastikan dari Fase 1 saja.
- README menyebut server start di `http://localhost:3000`, sedangkan docker-compose memakai port internal `3001`.
- Jest dan Supertest ada sebagai dependency development, tetapi tidak ada script `test` di `package.json`.
- OpenAPI security scheme memakai `bearerFormat: JWT`, tetapi berdasarkan config auth yang terbaca, autentikasinya adalah static API token, bukan JWT. Ini perlu diverifikasi di Fase 2 saat membaca middleware auth.
- README mengklaim fitur SSRF protection, input sanitization, dan logging komprehensif; klaim ini belum divalidasi sepenuhnya karena Fase 1 belum membaca detail middleware/service.

**Status Fase:** Fase 1 selesai. Belum ada perubahan kode aplikasi.
