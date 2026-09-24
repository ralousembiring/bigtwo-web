# RGAMEHUB (Ralou Game Hub) — Versi Website Multiplayer

Versi ini pakai **Firebase Realtime Database** untuk sinkronisasi antar pemain secara real-time
(pakai listener langsung, bukan polling seperti versi artifact sebelumnya — jadi lebih cepat dan
lebih tahan dari masalah "dua orang klik bersamaan", karena tiap aksi (duduk di kursi, main,
pass) dibungkus `runTransaction` yang atomik.

Fitur tambahan dibanding versi artifact:
- **Kode room**: banyak grup teman bisa pakai website yang sama tanpa nabrak, tinggal beda kode room.
- **Auto-deteksi disconnect**: kalau ada pemain yang menutup tab / koneksinya putus, kursinya otomatis
  jadi kosong lagi (dimainkan bot) tanpa perlu host klik "Jadikan Bot" manual.

## 1. Bikin project Firebase

1. Buka https://console.firebase.google.com, klik **Add project**, ikuti wizard-nya (nama bebas).
2. Di sidebar kiri, buka **Build > Realtime Database** → **Create Database** → pilih lokasi server
   (pilih yang paling dekat, misal Singapore/asia-southeast1) → mulai dalam **test mode** dulu.
3. Setelah database dibuat, buka tab **Rules**, ganti isinya jadi:

   ```json
   {
     "rules": {
       "rooms": {
         "$roomId": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

   Catatan: rules ini terbuka (siapa pun yang tahu kode room bisa baca/tulis data room itu). Ini cukup
   untuk main santai bareng teman. Kalau mau lebih aman, tambahkan Firebase Authentication dan batasi
   rules berdasarkan user yang login.

4. Klik **Publish**.
5. Buka **Project settings** (ikon gerigi) → tab **General** → scroll ke bagian **Your apps** →
   klik ikon web `</>` → daftarkan app (nama bebas, tidak perlu centang Hosting) → copy objek
   `firebaseConfig` yang muncul.

## 2. Pasang config ke project

Buka file `src/firebase.js`, ganti seluruh isi `firebaseConfig` dengan hasil copy dari langkah di atas.

## 3. Install & coba lokal

Butuh Node.js terpasang di komputermu (unduh di https://nodejs.org kalau belum ada).

```bash
npm install
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`). Coba buka di dua tab browser
berbeda untuk simulasikan dua pemain.

## 4. Deploy supaya bisa diakses dari mana saja

Pilih salah satu (Vercel biasanya paling gampang):

### Opsi A — Vercel
1. Push folder project ini ke repository GitHub.
2. Buka https://vercel.com, daftar/login, klik **Add New Project**, pilih repo GitHub-mu.
3. Vercel otomatis mendeteksi ini project Vite — biarkan default, klik **Deploy**.
4. Setelah selesai, kamu dapat URL seperti `nama-project.vercel.app` yang sudah bisa dipakai.
5. Untuk pakai domain sendiri: di dashboard project Vercel → **Settings > Domains** → masukkan
   domainmu → ikuti instruksi untuk mengubah DNS (biasanya tambah record CNAME/A) di tempat kamu
   beli domain.

### Opsi B — Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
npm run build
firebase init hosting   # pilih folder "dist" sebagai public directory, pilih "single-page app: Yes"
firebase deploy
```
Setelah deploy, kamu dapat URL `*.web.app`. Untuk domain sendiri: buka Firebase Console →
**Hosting** → **Add custom domain**, ikuti instruksi verifikasi dan DNS-nya.

## 5. Main bareng teman

Bagikan link websitenya beserta kode room, misalnya:
`https://domainkamu.com/?room=AB12C`

Teman yang membuka link itu otomatis masuk ke room yang sama, tinggal isi nama dan pilih kursi kosong.

## Batasan yang perlu diketahui

- Rules Firebase di atas terbuka untuk siapa pun yang tahu kode room — cukup aman untuk main santai,
  tapi jangan dipakai untuk taruhan uang beneran atau data sensitif.
- Kartu di tangan tiap pemain tersimpan di database yang sama (supaya bot & host bisa jalan), jadi
  secara teknis bisa dilihat lewat DevTools kalau seseorang sengaja mau curang — sama seperti versi
  artifact sebelumnya, ini bukan proteksi penuh, cukup untuk main jujur sama teman.
- Kalau kursi tuan rumah (host) kosong karena disconnect, host otomatis pindah ke pemain dengan nomor
  kursi terkecil yang masih terhubung.
