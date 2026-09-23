# 🚀 Deployment & Operations Guide: Ramadhani Platform (Shared Hosting)

Panduan ini menjelaskan cara menjalankan aplikasi secara lokal dan mempublikasikannya ke **Shared Hosting** (cPanel / LiteSpeed / Apache) menggunakan **GitHub Actions CI/CD**.

---

## 📑 Table of Contents

1. [Local Development](#1-local-development)
2. [Production Architecture (Shared Hosting)](#2-production-architecture-shared-hosting)
3. [Automated Deployment via GitHub CI/CD](#3-automated-deployment-via-github-cicd)
4. [Decap CMS & GitHub OAuth Configuration](#4-decap-cms--github-oauth-configuration)
5. [Server Routing & Caching (.htaccess)](#5-server-routing--caching-htaccess)

---

## 1. Local Development

### Menjalankan Astro di Komputer Lokal
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server lokal Astro
npm run dev

# 3. Menjalankan Astro + Local Decap CMS bersamaan
npm run dev:all
```

- **Website Lokal**: [http://localhost:4321](http://localhost:4321)
- **CMS Admin Lokal**: [http://localhost:4321/admin](http://localhost:4321/admin) (membutuhkan `npm run dev:all`)

---

## 2. Production Architecture (Shared Hosting)

Website ini menggunakan arsitektur **Jamstack (Static Site Generation)**:
- **Build Engine**: Dijalankan secara otomatis di cloud oleh **GitHub Actions** (Node.js 22 LTS).
- **Target Hosting**: Shared Hosting cPanel konvensional (Apache / LiteSpeed).
- **Kebutuhan Server Hosting**:
  - **TIDAK butuh Node.js**
  - **TIDAK butuh Docker**
  - **TIDAK butuh SSH**
  - Hanya membutuhkan dukungan **PHP** (untuk autentikasi OAuth Decap CMS) dan penyajian file statis di `public_html`.

---

## 3. Automated Deployment via GitHub CI/CD

Setiap kali Anda menekan **Publish** di Decap CMS atau melakukan push kode ke branch `main`, GitHub Actions (`.github/workflows/deploy-shared-hosting.yml`) akan otomatis:
1. Membangun website dengan `npm run build`.
2. Menghasilkan file statis berkecepatan tinggi di folder `dist/`.
3. Mengunggah folder `dist/` ke direktori `public_html/` hosting Anda via **FTP / FTPS**.

### GitHub Repository Secrets yang Wajib Diisi:
Masuk ke GitHub Repositori (`ramanur28/theramadhani-website`) > **Settings** > **Secrets and variables** > **Actions**:
* `FTP_SERVER`: Hostname FTP hosting (misal: `ftp.domainanda.com` atau IP cPanel).
* `FTP_USERNAME`: Username cPanel / akun FTP Anda.
* `FTP_PASSWORD`: Password akun FTP Anda.
* `SITE_URL`: Domain website Anda (`https://domainanda.com`).

---

## 4. Decap CMS & GitHub OAuth Configuration

1. Buat GitHub OAuth App di [GitHub Developer Settings](https://github.com/settings/developers).
   - **Homepage URL**: `https://domainanda.com`
   - **Authorization callback URL**: `https://domainanda.com/callback`
2. Pasang Client ID & Client Secret di file `public_html/auth/.env.oauth` pada hosting Anda (lihat template `public/auth/.env.oauth.example`).

---

## 5. Server Routing & Caching (.htaccess)

File [`public/.htaccess`](public/.htaccess) telah dikonfigurasi lengkap untuk cPanel:
* Force HTTPS & Canonical URL redirection.
* Clean URLs untuk rute Astro tanpa ekstensi `.html`.
* Immutable asset caching (1 tahun) untuk folder `/_astro/`, gambar, dan font.
* Revalidasi instan (`no-cache`) untuk file HTML dan konfigurasi CMS.
* Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy).
* Kompresi Gzip/Deflate untuk performa PageSpeed 100.
