# 🌐 Panduan Deployment Shared Hosting (Tanpa Node.js) & FTP CI/CD

Panduan ini menjelaskan cara mempublikasikan website **The Ramadhani** ke **Shared Hosting** (cPanel / LiteSpeed / Apache) tanpa Caddy, Docker, maupun SSH di server hosting. Konten artikel tetap dinamis melalui **Decap CMS** dan otomatisasi sinkronisasi menggunakan **FTP / FTPS via GitHub Actions**.

---

## 🏗️ 1. Arsitektur Jamstack: Mengapa Tidak Butuh SSH & Node.js di Hosting?

```
+-----------------------+           +-----------------------+           +-------------------------+
|     Anda / Penulis    |           |   GitHub Repository   |           |     Shared Hosting      |
|  (Browser: /admin)    |           |  (theramadhani-site)  |           |  (cPanel / public_html) |
+-----------------------+           +-----------------------+           +-------------------------+
            |                                   |                                    |
            | 1. Login GitHub OAuth             |                                    |
            |    (Handshake via PHP)            |                                    |
            +----------------------------------------------------------------------->|
            |<-----------------------------------------------------------------------+
            |                                   |                                    |
            | 2. Tulis Artikel & Klik Publish   |                                    |
            +---------------------------------->|                                    |
            |    (Commit .mdx ke branch main)   |                                    |
            |                                   |                                    |
            |                                   | 3. GitHub Actions Otomatis Jalan:  |
            |                                   |    - Node.js 22 LTS                |
            |                                   |    - npm run build (Astro SSG)     |
            |                                   |    - Generate HTML/CSS/JS di dist/ |
            |                                   |                                    |
            |                                   | 4. Upload dist/ via FTP / FTPS     |
            |                                   +----------------------------------->|
            |                                   |                                    |
            | 5. Pengunjung Akses Website       |                                    |
            +----------------------------------------------------------------------->|
                                                                                     | Load time < 50ms!
```

* **Shared Hosting:** Routing, Force HTTPS, Caching, dan Security Headers sepenuhnya ditangani oleh file `.htaccess` di cPanel. Script PHP di `auth/` & `callback/` melayani handshake login Decap CMS.
* **Server GitHub (Gratis):** Melakukan proses build Astro dengan Node.js dan mengunggah hasil statisnya ke `public_html` hosting Anda via **FTP / FTPS standar cPanel**.

---

## 🔑 2. Langkah 1: Buat GitHub OAuth App (Untuk Login Decap CMS)

Decap CMS memerlukan izin OAuth GitHub agar dapat menyimpan artikel langsung ke repositori `ramanur28/theramadhani-website`.

1. Buka browser dan login ke GitHub: **[GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2. Klik tombol **New OAuth App**.
3. Isi kolom pendaftaran:
   * **Application name**: `The Ramadhani CMS`
   * **Homepage URL**: `https://domainanda.com` *(Ganti dengan domain utama Anda)*
   * **Application description**: `Content Manager for The Ramadhani`
   * **Authorization callback URL**: `https://domainanda.com/callback` *(Wajib berakhiran `/callback`)*
4. Klik **Register application**.
5. Salin nilai **Client ID**.
6. Klik tombol **Generate a new client secret**, lalu salin nilai **Client Secret**.

---

## ⚙️ 3. Langkah 2: Konfigurasi Kredensial OAuth di Shared Hosting

Pilih salah satu metode berikut di cPanel:

### Opsi A: Melalui File `.env.oauth` di cPanel (Direkomendasikan)
1. Buka **cPanel File Manager** dan masuk ke direktori `public_html/auth/`.
2. Buat file baru bernama `.env.oauth` (atau copy dari `.env.oauth.example`).
3. Isi dengan kredensial dari Langkah 1:
   ```env
   OAUTH_GITHUB_CLIENT_ID=salin_client_id_di_sini
   OAUTH_GITHUB_CLIENT_SECRET=salin_client_secret_di_sini
   SITE_URL=https://domainanda.com
   ```
4. Simpan file.

### Opsi B: Mengisi Langsung di File `public/auth/config.php`
Buka file `public/auth/config.php` dan masukkan Client ID & Secret Anda:
```php
define('OAUTH_CLIENT_ID', 'masukkan_client_id_anda');
define('OAUTH_CLIENT_SECRET', 'masukkan_client_secret_anda');
```

---

## 🔒 4. Langkah 3: Konfigurasi GitHub Repository Secrets (Untuk FTP CI/CD)

Agar GitHub Actions dapat terhubung ke cPanel via FTP secara aman:

1. Buka repositori Anda di GitHub: **`https://github.com/ramanur28/theramadhani-website`**.
2. Masuk ke **Settings** > **Secrets and variables** > **Actions**.
3. Klik tombol **New repository secret** untuk masing-masing secret berikut:

| Nama Secret | Deskripsi / Nilai Contoh |
| :--- | :--- |
| `FTP_SERVER` | Hostname FTP hosting Anda (contoh: `ftp.domainanda.com` atau IP server cPanel) |
| `FTP_USERNAME` | Username akun FTP / cPanel Anda (contoh: `ramadhani` atau akun FTP khusus) |
| `FTP_PASSWORD` | Password akun FTP Anda |
| `FTP_PORT` | Port FTP server Anda (default: `21`) |
| `FTP_PROTOCOL` | Protokol: gunakan `ftps` (FTP with TLS, sangat aman) atau `ftp` |
| `FTP_DESTINATION` | Folder tujuan di cPanel (default: `public_html/`) |
| `SITE_URL` | Domain utama website (contoh: `https://domainanda.com`) |

> [!TIP]
> **Cara Membuat / Melihat Akun FTP di cPanel:**
> Di cPanel, cari menu **FTP Accounts**. Anda bisa membuat akun FTP khusus (misal `deploy@domainanda.com`) yang dibatasi langsung ke folder `public_html/`, sehingga lebih terisolasi dan aman.

---

## 📝 5. Langkah 4: Cara Mempublikasikan Artikel Secara Dinamis

Setelah konfigurasi di atas selesai:

1. Buka browser ke alamat admin: **`https://domainanda.com/admin`**.
2. Klik tombol **Login with GitHub**.
   * Popup otorisasi GitHub akan muncul.
   * Begitu disetujui, popup tertutup otomatis dan dashboard Decap CMS siap digunakan.
3. Masuk ke menu **Articles & Guides** atau **Case Studies & Work**:
   * Klik **New Article**.
   * Buat konten artikel, masukkan gambar sampul, tag, dan isi artikel (Markdown/MDX).
   * Klik **Publish** di pojok kanan atas.
4. **Alur Otomatisasi GitHub Actions:**
   * Decap CMS langsung melakukan commit file `.mdx` ke repositori `ramanur28/theramadhani-website`.
   * GitHub Actions langsung menyala otomatis menjalankan workflow **`Deploy to Shared Hosting via FTP/FTPS`**.
   * Halaman statis HTML ter-compile dalam hitungan detik, lalu disinkronkan ke `public_html` via FTP.
   * Artikel baru Anda langsung terbit di website!

---

## 🛡️ 6. Fitur Pengganti Caddy di File `.htaccess`

Karena routing sekarang diatur langsung oleh cPanel/Apache melalui `public/.htaccess`:
* **Force HTTPS**: Otomatis mengarahkan seluruh lalu lintas `http://` ke `https://`.
* **Clean URLs**: Membuka rute Astro seperti `/articles/seo-guide` tanpa ekstensi `.html`.
* **Long-Term Browser Caching**: Aset di folder `/_astro/` dan gambar di-cache selama 1 tahun (*immutable*).
* **Fast Revalidation**: File `.html`, `config.yml`, dan `sitemap-index.xml` selalu di-refresh (*no-cache*) agar perubahan artikel langsung terlihat.
* **Security Headers**: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, dan Permissions-Policy sudah terpasang rapi.
* **Gzip & Deflate Compression**: Kompresi otomatis untuk semua aset teks, JSON, dan SVG.
