# 🚀 Deployment Guide

Panduan lengkap untuk deploy **Text Over Image API** ke production menggunakan Docker.

---

## 📋 Prerequisites

- Docker & Docker Compose installed
- Git installed
- API Token (generate dengan `openssl rand -hex 32`)
- Domain/subdomain (optional untuk HTTPS)

---

## 🐳 Deploy dengan Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/muhrobby/text-over-image.git
cd text-over-image
```

### 2. Setup Environment Variables

Buat file `.env` di root project:

```bash
# Generate secure API token
openssl rand -hex 32

# Create .env file
cat > .env << 'EOF'
# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=production
PORT=3000

# ==========================================
# API AUTHENTICATION (REQUIRED)
# ==========================================
REQUIRE_AUTH=true
API_TOKEN=paste-your-generated-token-here

# ==========================================
# CORS CONFIGURATION
# ==========================================
# For single domain
CORS_ORIGIN=https://yourdomain.com

# For multiple domains (uncomment and modify)
# CORS_ORIGIN=https://domain1.com,https://domain2.com

# For all origins (not recommended for production)
# CORS_ORIGIN=*

# ==========================================
# WATERMARK CONFIGURATION
# ==========================================
WATERMARK_ADDRESS=Your Company Name, Your City
EOF
```

### 3. Build dan Start Container

```bash
# Build image dan start container
docker compose up -d --build

# Check logs
docker compose logs -f

# Check container status
docker compose ps
```

### 4. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Test API (replace YOUR_TOKEN)
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  --output result.jpg
```

---

## 🔧 Docker Compose Configuration

File `docker-compose.yml` sudah dikonfigurasi dengan:

- ✅ **Environment variables** dari `.env`
- ✅ **Health check** setiap 30 detik
- ✅ **Auto restart** jika container crash
- ✅ **Resource limits** (2 CPU, 1GB RAM max)
- ✅ **Port mapping** 3000:3000

### Customize Port

Edit `docker-compose.yml` bagian ports:

```yaml
ports:
  - "8080:3000"  # Akses via port 8080 di host
```

### Customize Resource Limits

Edit `docker-compose.yml` bagian deploy:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'        # Max 4 CPU cores
      memory: 2G       # Max 2GB RAM
    reservations:
      cpus: '1'        # Min 1 CPU core
      memory: 512M     # Min 512MB RAM
```

---

## 🌐 Setup Reverse Proxy (Nginx/Traefik/Caddy)

### Option 1: Nginx

```nginx
server {
    listen 80;
    server_name stamps.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stamps.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for large image uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 10M;
    }
}
```

### Option 2: Caddy

```caddy
stamps.yourdomain.com {
    reverse_proxy localhost:3000
    
    # Auto HTTPS with Let's Encrypt
    tls your-email@example.com
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### Option 3: Traefik (via Labels)

Uncomment Traefik labels di `docker-compose.yml`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.stamps.rule=Host(`stamps.yourdomain.com`)"
  - "traefik.http.routers.stamps.entrypoints=websecure"
  - "traefik.http.routers.stamps.tls.certresolver=letsencrypt"
  - "traefik.http.services.stamps.loadbalancer.server.port=3000"
  
  # Rate limiting
  - "traefik.http.middlewares.stamps-ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.stamps-ratelimit.ratelimit.burst=150"
  - "traefik.http.routers.stamps.middlewares=stamps-ratelimit"

networks:
  - traefik-network

# Add external network
networks:
  traefik-network:
    external: true
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Filter by service
docker compose logs -f textoverimage
```

### Container Stats

```bash
# CPU, Memory, Network usage
docker stats text-over-image-api
```

### Health Check

```bash
# Check container health
docker inspect text-over-image-api | jq '.[0].State.Health'

# Test endpoint
curl http://localhost:3000/health | jq '.'
```

---

## 🔄 Update & Maintenance

### Update to Latest Version

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Remove old images (optional)
docker image prune -f
```

### Backup Configuration

```bash
# Backup .env file
cp .env .env.backup

# Backup logo (if custom)
cp public/logo.png public/logo.png.backup
```

### Reset Everything

```bash
# Stop and remove containers
docker compose down

# Remove all data
docker compose down -v

# Clean build cache
docker builder prune -a -f

# Start fresh
docker compose up -d --build
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker compose logs

# Check if port already in use
sudo lsof -i :3000

# Restart container
docker compose restart
```

### Build Errors

```bash
# Clear Docker cache
docker builder prune -a -f

# Rebuild without cache
docker compose build --no-cache

# Check Dockerfile syntax
docker compose config
```

### Memory Issues

```bash
# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G  # Increase to 2GB
```

### Image Upload Fails

- Check API token is correct
- Verify file size < 10MB
- Check CORS_ORIGIN setting
- Review logs: `docker compose logs -f`

---

## 🔐 Security Checklist

- ✅ **API Token**: Strong, random, 32+ characters
- ✅ **REQUIRE_AUTH**: Set to `true` in production
- ✅ **CORS_ORIGIN**: Set specific domain, not `*`
- ✅ **HTTPS**: Use reverse proxy with SSL certificate
- ✅ **Firewall**: Only expose necessary ports
- ✅ **Updates**: Keep Docker images updated
- ✅ **Logs**: Monitor for suspicious activity
- ✅ **Backups**: Regular backup of .env and custom logos

---

## 📈 Performance Tuning

### For High Traffic

```yaml
# In docker-compose.yml
deploy:
  replicas: 3  # Run 3 instances
  resources:
    limits:
      cpus: '4'
      memory: 2G
```

### Add Load Balancer

```bash
# Use Nginx/HAProxy/Traefik for load balancing
# across multiple container instances
```

### Optimize Sharp (Image Processing)

Sharp sudah dikonfigurasi optimal. Jika perlu tuning lebih lanjut, edit `src/services/imageService.js`:

```javascript
// Adjust compression quality
pipeline = pipeline.jpeg({
  quality: 90,  // Lower = faster, smaller file
  progressive: true
});
```

---

## 🆘 Support

- **Documentation**: [README.md](README.md)
- **API Docs**: http://localhost:3000/api-docs
- **GitHub Issues**: https://github.com/muhrobby/text-over-image/issues

---

**Selamat deploy! 🎉**
