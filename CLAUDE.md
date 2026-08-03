@AGENTS.md

# CLAUDE.md — Menu Digital Pintar Laten Coffee Shop

Dokumen ini adalah konteks utama proyek. Baca ini dulu sebelum mengerjakan apa pun.
Fokusnya bukan "bagaimana kodenya", tapi **untuk siapa produk ini dibuat dan masalah bisnis apa yang harus selesai.**

---

## 1. Ringkasan Proyek

Aplikasi **menu digital self-service ordering berbasis web mobile** untuk Laten Coffee Shop
(Pakowa, Wanea, Manado). Pelanggan scan QR di meja → lihat menu → kustomisasi pesanan →
bayar → pesanan langsung masuk ke kasir/dapur. Owner memantau penjualan lewat dashboard.

Ini adalah bagian dari skripsi S1 Teknik Informatika UNSRAT, tapi **bukan proyek pajangan**:
sistem ini harus benar-benar dipakai di operasional kafe sehari-hari.

---

## 2. Masalah Bisnis yang Diselesaikan

Kondisi kafe saat ini masih manual sepenuhnya:

| Masalah nyata | Dampak ke bisnis |
|---|---|
| Antre di kasir 10–15 menit saat jam ramai | Pelanggan kabur, perputaran meja lambat |
| Barista mencatat pesanan manual di nota kertas | Salah catat, salah pesanan, komplain |
| Tidak ada rekap penjualan yang rapi | Owner tidak bisa ambil keputusan berbasis data |
| Layanan tidak sesuai ekspektasi Gen Z / milenial | Kepuasan turun, pelanggan tidak balik |

**Target perbaikan:** kurangi waktu tunggu, hilangkan kesalahan pencatatan,
dan beri owner data penjualan yang bisa dipakai.

---

## 3. Siapa Penggunanya

Tiga aktor. Setiap keputusan produk harus jelas ini untuk siapa.

**Pelanggan** — mayoritas milenial & Gen Z, datang sambil ngobrol/kerja.
Mau cepat, mandiri, tanpa ribet. Ekspektasinya: buka QR, langsung bisa pesan.

**Admin (kasir / staf dapur)** — kerja sambil sibuk dan berdiri.
Butuh tahu *pesanan apa, dari meja berapa, sudah bayar belum*, secepat mungkin.

**Owner** — tidak selalu ada di tempat.
Butuh gambaran penjualan sekilas dan data yang bisa diekspor untuk evaluasi & akuntansi.

---

## 4. Prinsip Produk (pegangan saat ragu)

1. **Tanpa hambatan masuk.** Tidak ada install aplikasi, tidak ada login untuk pelanggan.
   Scan QR langsung masuk menu meja tersebut. Setiap langkah tambahan = pelanggan hilang.
2. **Cepat lebih penting dari lengkap.** Kalau sebuah fitur membuat alur pesan jadi
   lebih panjang, fitur itu kalah.
3. **Nomor meja tidak boleh salah.** Pesanan nyasar ke meja lain merusak seluruh
   kepercayaan pada sistem. Ini titik paling kritis.
4. **Admin tidak boleh melewatkan pesanan.** Notifikasi harus muncul instan tanpa
   perlu refresh. Pesanan tenggelam = kafe rugi langsung.
5. **Mobile-first, lintas HP.** Dipakai di Android dan iPhone, layar bermacam ukuran,
   sinyal kafe kadang biasa saja. Halaman menu idealnya terbuka di bawah 2 detik.
6. **Sederhana dan mudah dirawat.** Ini UMKM, bukan startup. Owner harus bisa
   ubah menu dan harga sendiri tanpa memanggil developer.

---

## 5. Ruang Lingkup

**Sisi pelanggan**
- Akses menu via scan QR per meja, tanpa login
- Katalog menu: nama, harga, kategori, gambar
- Kustomisasi item (ukuran, topping, catatan)
- Keranjang + total harga otomatis
- Pilih pembayaran: QRIS atau Virtual Account
- Konfirmasi pesanan + nomor antrian

**Sisi admin**
- Notifikasi pesanan baru secara real-time beserta nomor meja
- Ubah status pesanan (Diterima → Diproses → Selesai)
- Lihat status pembayaran sebelum pesanan diproses

**Sisi owner**
- Kelola menu sendiri (tambah/ubah/hapus, atur ketersediaan)
- Dashboard grafik penjualan
- Ekspor laporan transaksi ke Excel

### Yang TIDAK dikerjakan sekarang
- Pembayaran masih **simulasi** (QR statis / nomor VA), bukan settlement uang sungguhan
- Reservasi meja, manajemen stok real-time, program loyalitas
- Semua fitur AI (deteksi wajah, ekspresi, personalisasi) — itu Tahap 2–4
- Aplikasi native Android/iOS

---
