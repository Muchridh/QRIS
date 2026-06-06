# QRIS Dinamis Pro - Deploy Version (Static Standalone)

Versi ini dirancang khusus untuk keperluan **Mass Deployment** secara gratis dan mudah, tanpa memerlukan *backend* server (PHP) maupun database (MySQL). Aplikasi ini 100% berjalan secara *client-side* di browser pengguna.

## Fitur Utama

*   **Tanpa Database & Server**: Seluruh logika kalkulasi CRC16 dan manipulasi string QRIS telah ditanamkan ke dalam JavaScript.
*   **Penyimpanan Lokal (Local Storage)**: Template QRIS ("QRIS Tersimpan") akan disimpan langsung di dalam *local storage* browser. Data ini tidak akan hilang meskipun halaman di-refresh, selama data/cache browser tidak dibersihkan.
*   **Generate QRIS Dinamis**:
    *   Mendukung nominal tagihan fleksibel.
    *   Mendukung penambahan Biaya Layanan / Fee (secara persentase maupun nominal tetap). Fitur ini telah dikalibrasi agar fee otomatis tergabung ke nominal utama sehingga aplikasi e-wallet apa pun pasti akan menagih total tagihan secara akurat.
*   **Metode Input Beragam**:
    *   **Scan**: Unggah gambar QRIS statis (JPG/PNG), lalu sistem akan mengekstrak kode QRIS-nya.
    *   **Manual**: Paste string teks QRIS statis (biasanya diawali dengan `000201010211...`).
    *   **Tersimpan**: Gunakan fitur "Kelola Template" untuk menyimpan string toko Anda dan menggunakannya berulang kali tanpa perlu repot scan.

## Cara Penggunaan (Deployment)

Karena aplikasi ini sepenuhnya statis, Anda bebas menghostingnya di mana saja. Beberapa cara penggunaannya:

### 1. Penggunaan Lokal (Offline)
Anda bahkan tidak memerlukan koneksi internet aktif. Cukup buka folder ini dan klik dua kali pada file `index.html`. Aplikasi akan terbuka di browser default Anda dan siap digunakan!

### 2. Upload ke Hosting Standar (cPanel / Hostinger)
1. Jadikan folder `deploy` ini dalam bentuk file `.zip`.
2. Unggah file zip tersebut ke File Manager di panel hosting Anda.
3. Ekstrak (unzip) di dalam folder `public_html`.
4. Anda bisa langsung mengaksesnya lewat domain Anda (contoh: `https://domainanda.com`).

### 3. Deploy Gratis via GitHub Pages / Vercel / Netlify
Versi ini sangat cocok untuk dihosting secara gratis selamanya karena tidak butuh database.
*   **GitHub Pages**: Buat repositori baru, unggah semua isi folder ini, buka *Settings* -> *Pages*, lalu pilih *branch* `main`.
*   **Netlify**: Cukup *drag and drop* seluruh isi folder `deploy` ini ke dashboard Netlify Anda.
*   **Vercel**: Hubungkan dengan repository GitHub Anda, Vercel akan otomatis mendeteksinya sebagai project HTML statis.

## Struktur File Penting

*   `index.html`: Merupakan inti antarmuka antarmuka (UI) website.
*   `style.css`: Menampung seluruh aturan gaya, warna (termasuk Dark Mode), dan desain responsif (Mobile Friendly).
*   `script.js`: Menampung seluruh "otak" aplikasi. Memuat logika jsQR, kalkulator CRC16, dan sistem penyimpanan `localStorage`.
*   `qris2.png`: Merupakan frame/bingkai gambar yang akan menyelimuti QR Code yang di-generate.
*   `jsQR.min.js` & `qrcode.min.js`: Library pihak ketiga *(open-source)* untuk membaca dan menggambar QR Code.

---

*Dibuat oleh [Muchridh]*
