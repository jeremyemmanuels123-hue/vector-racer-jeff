# Vector Racer

Game Fisika SMA kelas XI untuk menjumlahkan vektor perpindahan. Pilih Δx dan Δy, lihat titik tujuan dan panjang panah, lalu tekan **Jalankan**. Mobil bergerak lurus dari posisi awal langkah ke ujung panah. Satu petak mewakili 1 m, +x ke kanan, dan +y ke atas.

## Jalankan game

Ekstrak ZIP, buka terminal di folder yang berisi `index.html`, lalu jalankan dengan Node.js 20+.

```sh
npm start
```

Buka [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Game tidak memerlukan instalasi paket. Gunakan `npm test` untuk mengulang pemeriksaan logika.

## Cara main

- Setiap komponen bisa diatur dari −4 sampai +4. Panah hijau menunjukkan rute yang dapat dijalankan. Panah merah putus-putus menandai langkah yang ditolak.
- Mobil tidak berpindah jika ruasnya mengenai sisi atau sudut tembok, jika tujuan berada di luar grid, atau jika urutan checkpoint dilanggar.
- Pada Level 3, panah harus melintasi pusat checkpoint 1, 2, lalu 3. Mobil boleh melewati pusat checkpoint tanpa berhenti. Untuk finis, hentikan mobil tepat di petak finis setelah semua checkpoint tercatat.
- Setelah finis pada Level 1–3, masukkan nama panggilan dan tekan **Simpan skor online**. Peringkat menampilkan 10 skor dengan langkah paling sedikit untuk tiap level.

## Sambungkan Cloud Firestore

1. Masuk ke [Firebase Console](https://console.firebase.google.com/) dan buat proyek untuk Vector Racer. Tambahkan **Web App** dan salin objek konfigurasi klien Web App.
2. Buka `firebase-config.js`. Ganti `null` dengan objek yang disalin dari Firebase, sehingga barisnya berbentuk `export const firebaseConfig = { … };`. Konfigurasi klien boleh disertakan di repo publik. Gunakan hanya konfigurasi Web App. Simpan kredensial admin dan file service account di luar repo.
3. Buka **Authentication → Sign-in method** dan aktifkan **Anonymous**. Game memakai sesi anonim ketika pemain mengirim skor sehingga pemain tidak perlu mengisi akun.
4. Buka **Firestore Database → Create database**, pilih database **(default)** dan mode **Production**. Pada tab **Rules**, tempel isi `firestore.rules` dan tekan **Publish**. Alternatif dengan Firebase CLI dari folder proyek adalah `npx firebase-tools deploy --only firestore:rules --project ID_PROYEK` setelah login di CLI. Pengurutan menggunakan indeks tunggal `steps` bawaan Firestore.

Firestore menyimpan skor di `tracks/{level}/scores/{id}`, dengan kolom `nickname`, `level`, `steps`, dan `createdAt` dari server. Pembacaan peringkat dibatasi maksimal 10 dokumen per kueri. Sesi anonim hanya bisa membuat skor dengan kolom dan nilai yang lolos aturan. Aplikasi tidak memberi akses untuk mengedit atau menghapus skor. Validasi lintasan berlangsung di browser dan aturan Firestore memeriksa bentuk data serta batas skor.

Panduan resmi [Firebase Web](https://firebase.google.com/docs/web/setup), [Anonymous Auth](https://firebase.google.com/docs/auth/web/anonymous-auth), [Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart), dan [API key Firebase](https://firebase.google.com/docs/projects/api-keys).

## Terbitkan di GitHub Pages

1. Masuk ke [GitHub](https://github.com/new), lalu buat repo publik kosong bernama `vector-racer`. Unggah isi proyek langsung ke root repo. Pastikan `index.html` berada di root dan `firebase-config.js` sudah diisi.
2. Buka repo **Settings → Pages → Build and deployment**. Pilih **Deploy from a branch**, branch **main**, folder **/(root)**, lalu **Save**. Salin URL yang muncul di Pages setelah deploy selesai. [Panduan GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
3. Buka URL Pages di jendela privat. Tamatkan Level 1, simpan nama uji unik, dan tunggu konfirmasi **Skor tersimpan di Firebase**. Buka URL di profil browser kedua atau browser lain. Tanpa memasukkan akun GitHub atau Google, pilih Level 1 di bagian **Peringkat online**, tekan muat ulang, dan periksa nama, jumlah langkah, dan waktu yang sama. Periksa juga bahwa repo bisa dibuka tanpa login.

## Pengujian yang sudah dilakukan

| Pemeriksaan | Hasil |
| --- | --- |
| `npm test` | 5 lulus. Mencakup hitungan vektor, gerak di luar grid, tabrakan di tengah ruas dan di sudut, urutan checkpoint, serta pencarian rute untuk keempat lintasan. |
| Tutorial di browser | Panah dari (0, 0) menuju (3, 2) menampilkan 3,61 m. Mobil tiba di (3, 2) seusai animasi. Langkah berikutnya (−1, 4) menghasilkan posisi akhir (2, 6), besar resultan √40 ≈ 6,32 m, dan panjang lintasan 7,73 m. |
| Level 1 di browser | Langkah yang melompati tembok dan yang menyentuh sudut ditolak tanpa memindahkan mobil. Level selesai dalam 4 langkah. |
| Level 2 dan 3 di browser | Level 2 selesai dalam 3 langkah. Level 3 selesai dalam 5 langkah setelah checkpoint 1–2–3. |
| Tata letak di browser desktop | Uji viewport 320×640 dan 390×844 memakai satu kolom, tanpa gulir horizontal. Tombol komponen 44×44 px. Uji 1440×900 menampilkan grid dan kontrol berdampingan, tanpa gulir horizontal. Langkah tutorial juga dimainkan pada ukuran HP. |
| Mode tanpa Firebase | Game tetap dapat ditamatkan dan menampilkan pesan bahwa skor belum tersimpan online. |
| GitHub Pages dan Firestore antar-sesi | Menunggu repo publik dan proyek Firebase aktif. URL publik, penerapan aturan, dan simpan/baca skor Cloud Firestore belum terverifikasi. |

## Demo 1 menit

- **0–12 detik.** Tunjukkan grid dan kontrol. “Satu petak satu meter. Δx mengatur kiri atau kanan dan Δy mengatur bawah atau atas.”
- **12–35 detik.** Dari (0,0), masukkan (+3,+2), tunjukkan panah, lalu jalankan. Lanjutkan dengan (−1,+4). “Resultannya (2,6) meter, karena 3 − 1 = 2 dan 2 + 4 = 6. Besarnya √40 meter, sedangkan panjang rutenya sekitar 7,73 meter.”
- **35–60 detik.** Siapkan Level 1 yang sudah finis di tab lain. Isi nama panggilan, tekan **Simpan skor online**, lalu tunjukkan baris yang sama di browser kedua setelah memuat ulang peringkat. Jalankan bagian ini setelah Firebase terhubung.

## Teks pengumpulan

Isi kedua bagian tautan setelah langkah verifikasi publik dan uji lintas sesi selesai.

> Saya mengumpulkan Vector Racer, game Fisika kelas XI tentang komponen dan resultan perpindahan vektor. Game ini memiliki satu tutorial, tiga level, dan peringkat online yang tersimpan di Firebase Firestore.
>
> Game: [URL GitHub Pages yang sudah diuji]
>
> Kode sumber: [URL repo GitHub yang sudah diuji]
