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

