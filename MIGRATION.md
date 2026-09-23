# 🚀 Panduan Migrasi Server, Backup & Pemulihan Sistem (The Ramadhani Platform)

Dokumen ini menjelaskan prosedur operasional standar untuk **backup otomatis, restore darurat, dan migrasi server 1-klik** untuk website The Ramadhani serta database Umami Analytics.

---

## 📑 Daftar Isi

1. [Daftar Script Otomasi](#1-daftar-script-otomasi)
2. [Checklist Pra-Migrasi (Pre-Flight)](#2-checklist-pra-migrasi-pre-flight)
3. [Metode 1: Migrasi Otomatis 1-Klik Antar Server (Direkomendasikan)](#3-metode-1-migrasi-otomatis-1-klik-antar-server-direkomendasikan)
4. [Metode 2: Backup & Restore Manual](#4-metode-2-backup--restore-manual)
5. [Metode 3: Sinkronisasi Data Produksi ke Komputer Lokal](#5-metode-3-sinkronisasi-data-produksi-ke-komputer-lokal)
6. [Konfigurasi Backup Berkala Otomatis (Cron Job)](#6-konfigurasi-backup-berkala-otomatis-cron-job)
7. [Verifikasi Pasca-Migrasi & Sanity Check](#7-verifikasi-pasca-migrasi--sanity-check)
8. [Troubleshooting & Solusi Masalah Umum](#8-troubleshooting--solusi-masalah-umum)

---

## 1. Daftar Script Otomasi

Seluruh script telah dioptimasi dengan error handling `set -euo pipefail` dan terletak di root repository:

| File Script | Peran & Fungsi | Format Pemanggilan |
| :--- | :--- | :--- |
| **`migrate.sh`** | **One-Click Server-to-Server**: Mengotomasi backup dari VPS lama, transfer data secara aman, dan restore instan di VPS baru. | `./migrate.sh <IP_LAMA> <IP_BARU> [USER] [SSH_KEY]` |
| **`backup-server.sh`** | **Full System Backup**: Membuat arsip `.tar.gz` berisi database PostgreSQL Umami, file konfigurasi `.env`, `Caddyfile`, `docker-compose.prod.yml`, dan direktori media uploads. | `./backup-server.sh` |
| **`restore-server.sh`** | **System Restore & Bootstrap**: Mengekstrak arsip backup, menginisialisasi Docker di VPS baru, mengimpor database, dan menyalakan seluruh service. | `./restore-server.sh <file_backup.tar.gz>` |
| **`sync-from-server.sh`** | **Local Development Sync**: Mengunduh dump database produksi dan media CMS terbaru ke komputer lokal ke folder `./backups/`. | `./sync-from-server.sh <IP_VPS> [USER] [SSH_KEY]` |

---

## 2. Checklist Pra-Migrasi (Pre-Flight)

Sebelum melakukan migrasi ke server baru, pastikan hal-hal berikut:

1. **Akses SSH**: Pastikan komputer lokal Anda memiliki akses SSH root atau sudo ke VPS lama dan VPS baru.
2. **Kapasitas Disk**: Periksa sisa ruang penyimpanan di kedua server (`df -h`). Pastikan tersedia minimal 2 GB free disk space.
3. **Turunkan DNS TTL**: 24 jam sebelum migrasi, turunkan **TTL (Time to Live)** pada DNS domain (`ramadhani.cloud`, `analytics.ramadhani.cloud`) menjadi **300 detik (5 menit)** agar propagasi IP baru berlangsung instan.
4. **Docker di VPS Baru**: Pastikan Docker dan Docker Compose telah terpasang di VPS baru:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   ```

---

## 3. Metode 1: Migrasi Otomatis 1-Klik Antar Server (Direkomendasikan)

Eksekusi perintah berikut dari komputer lokal (WSL atau terminal Linux):

```bash
# Format:
./migrate.sh <IP_VPS_LAMA> <IP_VPS_BARU> [SSH_USER] [PATH_SSH_KEY]

# Contoh:
./migrate.sh 103.175.217.71 103.175.217.99 root ~/.ssh/id_rsa
```

### Tahapan yang Dijalankan Secara Otomatis:
1. Menghubungi VPS lama dan mengekspor database Umami PostgreSQL dari container `ramadhani-umami-db`.
2. Mengemas database, konfigurasi `.env`, `Caddyfile`, `docker-compose.prod.yml`, dan folder media `public/images/uploads/` ke dalam arsip `ramadhani_migration_YYYYMMDD_HHMMSS.tar.gz`.
3. Mengirim arsip langsung ke VPS baru melalui jalur SSH aman.
4. Menjalankan `restore-server.sh` di VPS baru untuk mengekstrak file, menginisialisasi container, dan mengimpor seluruh tabel analitik.
5. Caddy di server baru otomatis memvalidasi domain dan menerbitkan sertifikat SSL Let's Encrypt baru.

---

## 4. Metode 2: Backup & Restore Manual

### Langkah 1: Buat Backup di VPS Lama
Masuk ke VPS lama:
```bash
ssh root@IP_VPS_LAMA
cd /var/www/ramadhani
./backup-server.sh
```
*Arsip backup akan tersimpan di: `~/ramadhani_backups/ramadhani_migration_YYYYMMDD_HHMMSS.tar.gz`.*

### Langkah 2: Transfer Arsip ke VPS Baru
```bash
scp ~/ramadhani_backups/ramadhani_migration_*.tar.gz root@IP_VPS_BARU:~/
```

### Langkah 3: Eksekusi Restore di VPS Baru
Masuk ke VPS baru:
```bash
ssh root@IP_VPS_BARU

# Siapkan direktori kerja
mkdir -p /var/www/ramadhani

# Salin script restore jika belum ada di VPS baru
scp root@IP_VPS_LAMA:/var/www/ramadhani/restore-server.sh /var/www/ramadhani/
chmod +x /var/www/ramadhani/restore-server.sh

# Jalankan proses restore
/var/www/ramadhani/restore-server.sh ~/ramadhani_migration_*.tar.gz
```

---

## 5. Metode 3: Sinkronisasi Data Produksi ke Komputer Lokal

Untuk pengujian lokal dengan data analitik dan media riil dari server produksi:

```bash
# Jalankan dari komputer lokal:
./sync-from-server.sh <IP_VPS> root ~/.ssh/id_rsa
```

Script akan otomatis:
1. Mengunduh dump database PostgreSQL ke `./backups/umami_production_latest.sql`.
2. Menyinkronkan semua gambar unggahan CMS ke `./public/images/uploads/`.

---

## 6. Konfigurasi Backup Berkala Otomatis (Cron Job)

Untuk menjamin keamanan data dan kepatuhan disaster recovery, jadwalkan backup harian otomatis di VPS produksi:

1. Buka konfigurasi crontab di VPS:
   ```bash
   sudo crontab -e
   ```
2. Tambahkan baris jadwal backup setiap hari pukul **03:00 dini hari**:
   ```cron
   # Backup harian The Ramadhani & Umami DB (Setiap hari pukul 03:00)
   0 3 * * * /var/www/ramadhani/backup-server.sh >> /var/log/ramadhani_backup.log 2>&1

   # Otomatis hapus file backup yang lebih tua dari 14 hari
   30 3 * * * find /root/ramadhani_backups -type f -name "ramadhani_migration_*.tar.gz" -mtime +14 -delete
   ```
3. Simpan dan keluar. Log backup harian dapat dipantau melalui `cat /var/log/ramadhani_backup.log`.

---

## 7. Verifikasi Pasca-Migrasi & Sanity Check

Setelah proses restore selesai, jalankan langkah-langkah verifikasi berikut di VPS baru:

### 1. Periksa Status Container:
```bash
docker compose -f /var/www/ramadhani/docker-compose.prod.yml ps
```
Pastikan seluruh service berstatus `healthy`.

### 2. Validasi Integritas Database Umami:
```bash
docker exec -it ramadhani-umami-db psql -U umami_admin -d umami_analytics -c "SELECT count(*) AS total_pageviews FROM website_event;"
```
*Harus mengembalikan jumlah event yang sesuai dengan VPS lama.*

### 3. Update DNS A Record:
Ubah IP address pada DNS Management penyedia domain Anda:
- **`@` (ramadhani.cloud)** &rarr; `IP_VPS_BARU`
- **`www`** &rarr; `IP_VPS_BARU`
- **`analytics`** &rarr; `IP_VPS_BARU`

Dalam hitungan detik, Caddy akan mendeteksi query DNS baru dan mengaktifkan HTTPS secara otomatis.

---

## 8. Troubleshooting & Solusi Masalah Umum

### Q: Database container gagal di-restore ("database relation already exists")
**Solusi**: Script `restore-server.sh` secara otomatis menghapus database lama yang bersih sebelum mengimpor. Jika Anda melakukannya secara manual:
```bash
docker exec -i ramadhani-umami-db psql -U umami_admin -c "DROP DATABASE IF EXISTS umami_analytics;"
docker exec -i ramadhani-umami-db psql -U umami_admin -c "CREATE DATABASE umami_analytics;"
docker exec -i ramadhani-umami-db psql -U umami_admin -d umami_analytics < umami_database.sql
```

### Q: Caddy gagal menerbitkan sertifikat SSL ("challenge failed")
**Solusi**:
1. Pastikan port 80 dan 443 tidak diblokir firewall: `sudo ufw status`.
2. Pastikan DNS Record telah mengarah ke IP VPS baru: `dig +short ramadhani.cloud @8.8.8.8`.
3. Reload Caddy: `./reload-caddy.sh`.

### Q: Path file SSH key di Windows (WSL) tidak terbaca
**Solusi**: Script `deploy.sh`, `migrate.sh`, dan `sync-from-server.sh` secara otomatis mengubah path Windows (`C:\...`) menjadi path WSL (`/mnt/c/...`). Jika menggunakan format manual, gunakan path Linux standar: `~/.ssh/id_rsa`.