# Warung-SayurCemara-ERP-Sistem

## Profil Mitra

* **Nama Mitra:** Warung Sayur Cemara
* **Lokasi:** Jl. Banjarsari, Tembalang, Kec. Tembalang, Kota Semarang, Jawa Tengah
* **Jenis Usaha:** Ritel sayuran segar dan bahan pangan harian
* **Target Pelanggan:** Masyarakat sekitar, mahasiswa/penghuni kos di kawasan Tembalang, serta pembeli harian
* **Jam Operasional:** *07.00 - 20.00*
* **Kontak:** TikTok `@warungsayurcemara`, WhatsApp: *085291957525*

## Masalah dan Proses Mitra Saat Ini

### Cara Kerja Sebelum Ada Website

Berdasarkan hasil observasi dan wawancara singkat dengan pihak Warung Sayur Cemara, proses operasional yang berjalan saat ini masih dilakukan secara konvensional dengan beberapa kendala utama:

* **Manajemen & Pengecekan Stok Manual:** Pemilik dan staf warung harus memeriksa ketersediaan barang serta kondisi kesegaran sayuran secara fisik satu per satu untuk mengetahui stok yang habis atau mulai layu.
* **Penanganan Sayur Busuk (Waste):** Sayuran yang sudah membusuk langsung dibuang tanpa sistem diskon bertahap untuk mencegah pembusukan menyebar ke stok sayur lainnya yang masih segar, sehingga memicu kerugian langsung.
* **Transaksi Kasir (POS) Konvensional:** Warung belum memiliki sistem Point of Sale (POS) terintegrasi; seluruh pencatatan transaksi dan perhitungan belanja masih dilakukan secara manual.
* **Penetapan Harga & Informasi Tidak Terpusat:** Penentuan harga jual dilakukan secara manual tanpa label harga fisik di area warung. Pembaruan informasi harga dan promosi hanya diunggah melalui akun TikTok mitra.
* **Alur Pemesanan Terfragmentasi:** Pembelian dilakukan secara langsung di toko. Meskipun mitra sudah memiliki situs web sebelumnya, fungsinya hanya terbatas sebagai katalog produk statis, sementara proses pemesanan tetap dialihkan secara manual melalui pesan WhatsApp.

## Proses Baru dan Ukuran

### Ide Solusi dari Kelompok

#### 1. Spesifikasi Solusi & Pengembangan Fitur

##### A. Modul POS, E-Commerce & Self Pick-up (Operasional & CRM)

* **Sistem Pembayaran Fleksibel (Tanpa Wajib *Payment Gateway*):** Mengakomodasi QRIS statis/dinamis milik warung yang sudah ada (cukup unggah gambar QRIS dan konfirmasi bukti bayar/mutasi) serta pembayaran tunai. Integrasi Midtrans bersifat opsional untuk menekan biaya admin transaksi UMKM.
* **Pemesanan Online & Penjadwalan *Self Pick-up*:** Pelanggan dapat memesan langsung melalui *website* dan mengambil pesanan sendiri di toko (*Self Pick-up*), dilengkapi fitur pemilihan slot waktu pengambilan agar pesanan sudah disiapkan sebelumnya tanpa perlu mengantre lama (tanpa layanan *delivery* maupun kurir pihak ketiga).
* **Pencatatan Keuangan Internal:** Rekapitulasi otomatis antara pendapatan kotor, HPP (Harga Pokok Penjualan), pengeluaran operasional/kulakan, hingga laba bersih harian.

##### B. Modul SCM (Supply Chain Management & Inventaris) 

* **Dynamic Pricing Engine:** Pemilik usaha cukup menginput harga modal pembelian per kilogram atau per dus beserta kuantitasnya. Sistem akan otomatis mengalkulasi harga jual eceran di kasir maupun website berdasarkan persentase margin profit yang telah ditetapkan.
* **Manajemen Stok FIFO (*First-In, First-Out*):** Sistem mencatat tanggal barang pertama kali masuk (batch tracking) untuk memastikan stok lama terjual lebih dulu.
* **Smart Perishable Alert & Flash Sale:** Sistem memberikan notifikasi otomatis berdasarkan umur simpan barang. Khusus produk segar (sayur/buah) yang mulai layu di sore hari (masih layak konsumsi namun tidak tahan hingga besok), sistem memicu notifikasi sekaligus opsi one-click diskon (underprice/flash sale) untuk menekan kerugian barang busuk (waste).
* **Kategorisasi & Manajemen Barcode Dinamis:** Pengelompokan produk terstruktur (Sayur, Bumbu, Sembako/Minyak, dll.) yang dilengkapi fitur Update Product/Barcode untuk mengakomodasi barang grosir yang sering berganti kemasan atau nomor barcode dari pemasok.

---

## Auto-Deploy & Kolaborasi Tim

**Situs produksi:** https://warung-sayurcemara.pages.dev
**Repository:** https://github.com/ZalfaInova/Warung-SayurCemara-ERP-Sistem
**Branch produksi:** `main`

Cloudflare Pages sudah terhubung langsung ke repository GitHub ini. Setiap `git push` ke branch `main` akan otomatis di-build dan di-deploy dalam hitungan detik. **Tidak perlu klik Deploy atau hosting ulang.**

### Untuk kontributor (punya akses Write)

1. Clone repository (sekali saja):
   ```bash
   git clone https://github.com/ZalfaInova/Warung-SayurCemara-ERP-Sistem.git
   cd Warung-SayurCemara-ERP-Sistem
   ```
2. Selalu ambil perubahan terbaru sebelum mulai:
   ```bash
   git checkout main
   git pull --ff-only origin main
   ```
3. Edit `index.html` (ini satu-satunya file halaman yang disajikan di situs produksi).
4. Commit dan push:
   ```bash
   git add index.html
   git commit -m "Deskripsi perubahan"
   git push origin main
   ```
5. Tunggu ±10–60 detik, lalu refresh https://warung-sayurcemara.pages.dev.

### Edit dari laptop lain tanpa install apa pun

- **GitHub Web Editor:** buka repository di GitHub, tekan tombol `.` (titik) untuk membuka `github.dev`, edit `index.html`, lalu commit langsung ke `main`.
- **GitHub Codespaces:** tombol **Code → Codespaces → Create codespace on main**, edit, lalu commit & push dari terminal Codespace.

Keduanya tetap memicu auto-deploy Cloudflare setelah perubahan masuk ke `main`.

### Menambah kontributor baru

1. Buka repository GitHub → **Settings → Collaborators → Add people**.
2. Pilih akun GitHub kontributor dan beri role **Write**.
3. Kontributor langsung bisa push ke `main`; Cloudflare Pages otomatis men-deploy. Tidak ada pengaturan tambahan di Cloudflare.

### Mengubah konten tanpa coding / deploy

Produk, harga, stok, foto, deskripsi, diskon On Sale, dan password bisa diubah dari dashboard **Owner** atau **Staf** di website. Data disimpan di Cloudflare D1 dan tersinkron otomatis ke semua perangkat (autosave ±0,7 detik, polling ±20 detik), jadi tidak perlu mengubah kode atau deploy ulang.

### Cek sintaks sebelum push (opsional)

Jalankan perintah berikut dari root repository untuk memastikan JavaScript di `index.html` tidak error:

```bash
node scripts/check-inline-js.mjs
```

Jika muncul `OK inline script #1` dan `#2`, perubahan aman untuk di-push.

> **Penting:** hanya `index.html` di root yang dipakai situs produksi. Folder `Code`, file `code.html`, `17 nov`, dan `17-nov` tidak memengaruhi situs live.

