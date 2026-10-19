# The Ramadhani - Custom WordPress Theme

Theme kustom WordPress profesional berbasis arsitektur **The Ramadhani**, dirancang khusus untuk kecepatan tinggi (*sub-second Core Web Vitals*), otoritas pencarian organik, Generative Engine Optimization (GEO), dan konversi artikel menjadi leads komersial.

---

## 📁 Struktur File Tema

```
theramadhani-theme/
├── assets/
│   ├── css/
│   │   └── theme.css              # Bundle CSS lengkap (Tailwind, utilities, animations, layout)
│   ├── js/
│   │   └── theme.js               # JavaScript (mobile drawer, animations, FAQ, audit calculator, AJAX form)
│   └── images/                    # Seluruh logo, diagram, monogram, poster visual
├── 404.php                        # Template Halaman 404 (Not Found)
├── footer.php                     # Global Footer
├── front-page.php                 # Template Homepage utama
├── functions.php                  # Konfigurasi tema, enqueue scripts, AJAX handlers, trailing slash hook
├── header.php                     # Global Header & Navigation
├── index.php                      # Fallback template
├── page.php                       # Default page template
├── screenshot.png                 # Thumbnail preview tema di WP Dashboard
├── style.css                      # Metadata header tema WordPress
├── template-about.php             # Template Halaman About Ramadhani (E-E-A-T & Filosofi)
├── template-contact.php           # Template Halaman Kontak & Permintaan Audit 48 Jam (AJAX Form)
├── template-service-geo.php       # Template Layanan GEO (Generative Engine Optimization)
├── template-service-google-ads.php# Template Layanan Google Ads High-ROAS
├── template-service-seo.php       # Template Layanan Technical & Organic SEO
├── template-service-workflow.php  # Template Layanan SEO Workflow (30-Day Sprint & 90-Day Engine)
└── template-work.php              # Template Case Studies / Portofolio (Panorama Lens Trip 640% Growth)
```

---

## 🚀 Panduan Instalasi di WordPress

1. **Upload Folder Tema:**
   * Salin seluruh folder `theramadhani-theme/` ke direktori WordPress Anda di:
     `wp-content/themes/theramadhani-theme/`
   * Atau compress folder menjadi `theramadhani-theme.zip` lalu upload via **Appearance > Themes > Add New > Upload Theme** di WP Admin.

2. **Aktifkan Tema:**
   * Buka **Appearance > Themes** di WordPress Dashboard.
   * Temukan **The Ramadhani** lalu klik **Activate**.

3. **Pengaturan Halaman Depan (Homepage):**
   * Masuk ke **Pages > Add New**.
   * Beri judul "Home" dan biarkan kontennya kosong (atau isi deskripsi meta).
   * Masuk ke **Settings > Reading**.
   * Pada opsi **Your homepage displays**, pilih **A static page**, lalu pilih halaman "Home" yang baru dibuat sebagai **Homepage**. File `front-page.php` akan otomatis merender tampilan homepage.

4. **Menetapkan Template Halaman (Page Templates):**
   Buat halaman-halaman berikut di menu **Pages > Add New**, lalu pada panel kanan **Page Attributes > Template**, pilih template yang sesuai:
   * **About** (Slug: `about`) &rarr; Template: `About Page` (`template-about.php`)
   * **Contact** (Slug: `contact`) &rarr; Template: `Contact Page` (`template-contact.php`)
   * **Services: Technical & Organic SEO** (Slug: `services/seo` atau `seo`) &rarr; Template: `Service - SEO` (`template-service-seo.php`)
   * **Services: GEO** (Slug: `services/geo` atau `geo`) &rarr; Template: `Service - GEO` (`template-service-geo.php`)
   * **Services: Google Ads** (Slug: `services/google-ads` atau `google-ads`) &rarr; Template: `Service - Google Ads` (`template-service-google-ads.php`)
   * **Services: SEO Workflow** (Slug: `services/seo/workflow` atau `workflow`) &rarr; Template: `Service - SEO Workflow` (`template-service-workflow.php`)
   * **Work / Case Studies** (Slug: `work`) &rarr; Template: `Work / Case Studies` (`template-work.php`)

5. **Pengaturan Permalinks (Wajib untuk SEO):**
   * Buka **Settings > Permalinks**.
   * Pilih struktur **Post name** (`/%postname%/`).
   * Tema ini telah dilengkapi filter `user_trailingslashit` di `functions.php` yang secara otomatis memastikan semua URL menggunakan trailing slash `/` yang konsisten untuk mencegah masalah indeksasi duplikat/redirect.

---

## ⚡ Fitur Utama Tema

* **AJAX Contact Form Terintegrasi:**
  Formulir audit pada halaman kontak mengirimkan data langsung melalui WordPress REST/AJAX (`admin-ajax.php`) tanpa reload halaman, dilengkapi validasi honeypot anti-spam dan pengiriman notifikasi email ke administrator situs.
* **Kalkulator Interaktif Audit & Kebocoran Leads:**
  Pengunjung dapat mensimulasikan estimasi kebocoran omset berdasarkan traffic bulanan, conversion rate saat ini, dan average deal size secara real-time.
* **Accordion FAQ Interaktif:**
  Komponen tanya jawab dengan transisi mulus dan aksesibilitas ramah pembaca layar (ARIA).
* **Navigasi Mobile Responsif:**
  Tombol hamburger dengan animasi morphing SVG halus menuju ikon close (X) dan dropdown menu yang terisolasi.
* **Scroll Progress Bar:**
  Indikator progres membaca di bagian atas layar secara presisi.
