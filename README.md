# Catatan Kuliah

Program ini bisa dijalankan langsung dari web atau sebagai aplikasi desktop, termasuk di Arch Linux.

Isinya: catatan, materi dosen, link materi, dan catatan pengeluaran. Data tersimpan otomatis di perangkat sendiri.

## Jalankan di web

Buka: https://USERNAME.github.io/catatan-kuliah/

## Jalankan sebagai aplikasi di Arch Linux

Pasang alat yang dibutuhkan:

```bash
sudo pacman -S nodejs npm git fuse2
```

Unduh dan jalankan:

```bash
git clone https://github.com/USERNAME/catatan-kuliah.git
cd catatan-kuliah
npm install
npm start
```

## Buat jadi software (AppImage)

```bash
npm run build
```

Hasilnya ada di folder `dist/`. Jalankan dengan:

```bash
chmod +x dist/*.AppImage
./dist/*.AppImage
```

## Catatan

- Data tersimpan di browser atau aplikasi masing-masing, tidak ikut ke GitHub.
- Gunakan tombol Ekspor dan Impor untuk cadangan data.
