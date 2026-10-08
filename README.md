# Luxury Digital Wedding Invitation (Undangan Online Modern)

Website undangan pernikahan digital modern, **mobile-first**, ringan, dan berestetika luxury wedding minimalis editorial. Setiap tamu memiliki nama dan kode unik tersendiri sehingga URL tidak mengekspos nama tamu secara langsung.

Contoh URL Tamu:
- `/inv/7KX92P` &rarr; **Pak Yanto**
- `/inv/M4Q81Z` &rarr; **Ibu Siti**
- `/inv/X9A72B` &rarr; **Budi**
- `/inv/K3N72Y` &rarr; **Andi**
- `/inv/P8R43W` &rarr; **Rina**
- `/admin` &rarr; **Admin Guest Management Dashboard**

---

## 🌟 Fitur Utama

### 1. Pengalaman Tamu (Mobile-First Luxury Invitation)
- **Cover Opening Minimalis**: Menampilkan nama pasangan, personalized greeting (*"Kepada Yth. Bapak/Ibu/Saudara/i: [Nama Tamu]"*), dan tombol *Buka Undangan*.
- **Transisi Sangat Halus**: Cover melakukan fade out dengan lembut, disusul reveal halaman utama secara elegan.
- **Musik Latar Otomatis**: Audio ambient piano/strings mulai dimainkan saat undangan dibuka, dilengkapi tombol mengambang untuk mute/unmute.
- **Main Hero**: Foto editorial pasangan, tipografi serif *Cormorant Garamond*, tanggal dan lokasi pernikahan.
- **Live Countdown Timer**: Penghitungan mundur hari, jam, menit, dan detik menuju akad & resepsi.
- **Rangkaian Acara**: Akad Nikah & Resepsi dengan rincian waktu, alamat, dan tombol langsung ke Google Maps & Kalender.
- **Kisah Cinta (Love Story)**: Garis waktu perjalanan cinta pasangan.
- **Galeri Foto Editorial**: Tata letak asimetris majalah fashion responsif dengan fitur Lightbox interaktif.
- **Form RSVP Interaktif**: Konfirmasi kehadiran (Hadir/Tidak Hadir), jumlah orang, dan ucapan doa.
- **Buku Doa & Restu (Wishes Wall)**: Daftar ucapan doa restu tamu secara real-time.
- **Tanda Kasih (Wedding Gift)**: No. rekening digital bank dengan tombol 1-klik salin no. rekening.
- **Ungkapan Terima Kasih**: Pesan penutup hangat dan nama keluarga besar.
- **Navigasi Mengambang & Bagikan Link**: Navigasi cepat mobile dan tombol salin link undangan.

### 2. Generator Kode Unik Tamu
- Panjang kode 6–8 karakter acak dengan entropi tinggi.
- Menggunakan 32 karakter bersih: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`.
- Menghindari karakter ambigu yang membingungkan: `0`/`O`, `1`/`I`/`L`.
- Pengecekan otomatis di database untuk mencegah duplikasi kode.
- Tidak dapat ditebak secara berurutan (*non-sequential*).

### 3. Dashboard Admin Pengelola Tamu (`/admin`)
- **PIN Akses Admin**: Default `wedding2026` atau `admin123`.
- **Statistik Ringkas**: Total Tamu, Jumlah Sudah Dibuka, Belum Dibuka, dan Konfirmasi Hadir.
- **Manajemen Tamu (CRUD)**: Tambah, edit, dan hapus tamu dengan generate kode otomatis.
- **Pencarian & Filter**: Cari berdasarkan nama, kode unik, nomor telepon, serta filter kategori (*Keluarga*, *Sahabat*, *Rekan*, *VIP*) dan status buka.
- **Kirim via WhatsApp**: 1-klik tombol berbagi pesan WhatsApp dengan teks undangan resmi berbahasa Indonesia yang ramah dan sopan.
- **Ekspor CSV**: Unduh seluruh daftar tamu dan statusnya ke file format CSV.
- **Reset Sample**: Tombol 1-klik untuk mereset data ke 5 tamu contoh.

---

## 📁 Struktur Folder Project

```
├── .env.example              # Contoh konfigurasi variabel lingkungan
├── firebase-blueprint.json   # Skema Blueprint Firestore
├── firestore.rules           # Aturan keamanan (Security Rules) Firestore
├── index.html                # HTML entry point dengan font Google (Cormorant & Plus Jakarta Sans)
├── package.json              # Daftar dependensi dan script npm
├── README.md                 # Panduan instalasi dan deployment
├── src/
│   ├── main.tsx              # Entry point React
│   ├── App.tsx               # Routing berbasis kode unik & admin switcher
│   ├── index.css             # Tailwind CSS v4 & styling luxury tokens
│   ├── types/
│   │   └── index.ts          # Definisi tipe data TypeScript
│   ├── config/
│   │   └── firebase.ts       # Inisialisasi Firebase SDK & deteksi environment
│   ├── utils/
│   │   └── codeGenerator.ts  # Generator kode unik 6-8 karakter anti-ambigu
│   ├── services/
│   │   ├── seedData.ts       # Data awal pasangan & 5 tamu contoh
│   │   └── dbService.ts      # Layanan Firestore dengan fallback penyimpanan persisten
│   ├── components/
│   │   └── invitation/
│   │       ├── CoverOpening.tsx        # Layar pembuka / amplop digital
│   │       ├── HeroSection.tsx         # Hero foto editorial pasangan
│   │       ├── CountdownSection.tsx    # Hitung mundur waktu acara
│   │       ├── EventDetailsSection.tsx # Detail Akad & Resepsi + Maps
│   │       ├── LoveStorySection.tsx    # Linimasa kisah cinta
│   │       ├── GallerySection.tsx      # Galeri foto asimetris & lightbox
│   │       ├── RsvpSection.tsx         # Form konfirmasi kehadiran
│   │       ├── WishesSection.tsx       # Dinding doa & ucapan selamat
│   │       ├── GiftSection.tsx         # Amplop digital & no rekening
│   │       ├── ClosingSection.tsx      # Ucapan penutup & tanda tangan
│   │       ├── MusicPlayer.tsx         # Kontrol musik latar
│   │       ├── FloatingNav.tsx         # Navigasi melayang di smartphone
│   │       └── NotFoundView.tsx        # Tampilan 404 jika kode tidak valid
│   └── pages/
│       ├── GuestInvitationPage.tsx     # Halaman utama undangan tamu
│       └── AdminDashboard.tsx          # Halaman admin pengelolaan tamu
```

---

## 🚀 Cara Menjalankan Project Secara Lokal

### 1. Clone atau Buka Direktori Project
```bash
cd <nama-folder-project>
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables (Opsional untuk Firebase)
Buat file `.env` di root project dengan menyalin template dari `.env.example`:
```bash
cp .env.example .env
```
Isi konfigurasi Firebase Anda jika ingin langsung menghubungkan ke Firestore Cloud:
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="wedding-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="wedding-app"
VITE_FIREBASE_STORAGE_BUCKET="wedding-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```
> **Catatan**: Jika variabel lingkungan tidak diisi, aplikasi **tetap berjalan 100% secara sempurna** menggunakan penyimpanan lokal persisten dengan data 5 tamu contoh yang siap diuji coba!

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🛡️ Struktur Data Firestore & Security Rules

### Skema Dokumen:
1. `invitations/{invitationId}`: Data acara pernikahan, mempelai, jadwal, dan galeri.
2. `invitations/{invitationId}/guests/{guestId}`:
   - `name`: String
   - `uniqueCode`: String (6–8 char, unik)
   - `category`: 'keluarga' | 'sahabat' | 'rekan' | 'vip'
   - `phone`: String
   - `isOpened`: Boolean (otomatis `true` saat pertama kali dibuka)
   - `openedAt`: Timestamp ISO
   - `rsvpStatus`: 'hadir' | 'tidak_hadir' | 'ragu'
   - `guestCount`: Number
   - `rsvpNotes`: String
3. `invitations/{invitationId}/wishes/{wishId}`: Ucapan doa restu dari para tamu.

Aturan keamanan (`firestore.rules`) telah dikonfigurasi untuk:
- Mencegah *public listing* seluruh koleksi tamu ke publik.
- Mengizinkan tamu membaca data mereka sendiri dan memperbarui status buka serta RSVP.
- Mengizinkan admin melakukan pengelolaan penuh.

---

## 🌐 Cara Deploy ke Firebase Hosting

### 1. Install Firebase CLI (jika belum terpasang)
```bash
npm install -g firebase-tools
```

### 2. Login ke Firebase
```bash
firebase login
```

### 3. Inisialisasi Firebase di Direktori Project
```bash
firebase init
```
Pilih opsi:
- **Hosting: Configure files for Firebase Hosting**
- **Firestore: Configure security rules and indexes files for Firestore**
- Pilih project Firebase Anda.
- Tentukan direktori public: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds and deploys with GitHub: `No` (atau `Yes` sesuai kebutuhan).

### 4. Build Aplikasi untuk Produksi
```bash
npm run build
```

### 5. Deploy Security Rules & Hosting
Deploy aturan keamanan Firestore:
```bash
firebase deploy --only firestore:rules
```
Deploy aset website ke Firebase Hosting:
```bash
firebase deploy --only hosting
```

Aplikasi Anda kini online di: `https://<nama-project-anda>.web.app`

---

## 👥 Contoh 5 Tamu Bawaan (Testing Seed)

| Nama Tamu | Kategori | Kode Unik | URL Akses |
| :--- | :--- | :--- | :--- |
| **Pak Yanto** | Keluarga | `7KX92P` | `/inv/7KX92P` |
| **Ibu Siti** | Keluarga | `M4Q81Z` | `/inv/M4Q81Z` |
| **Budi** | Sahabat | `X9A72B` | `/inv/X9A72B` |
| **Andi** | Rekan Kerja | `K3N72Y` | `/inv/K3N72Y` |
| **Rina** | Sahabat | `P8R43W` | `/inv/P8R43W` |

Akses menu admin di: `/admin` (PIN: `wedding2026`).
