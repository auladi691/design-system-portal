# AI Working Agreement

Instruksi ini wajib dibaca sebelum model AI mengubah proyek.

## Locked decisions

1. Produk terdiri dari Portal tanpa login dan CMS khusus Administrator.
2. Foundations dan Components mengikuti cakupan Wise; kedalaman panduan mengikuti Atlassian Design.
3. Visual direction: Monochrome Editorial. Neutral-first, satu accent terpilih, light/dark mode.
4. Motion mengambil restraint Apple/Wise: membantu orientasi, tidak mengganggu membaca.
5. Copy menggunakan Bahasa Indonesia sederhana untuk UI/UX designer. Hindari istilah engineering.
6. Token sumber adalah JSON hasil plugin Figma Design Tokens. Jangan ubah file sumber.
7. Tidak menggunakan Figma API dan tidak membuat global brand switcher.
8. Icon hanya style Outline. `Icon Illustrations` adalah kategori terpisah dan memiliki filter brand.
9. Semua isi Portal harus CRUD melalui CMS. Jangan hardcode halaman editorial baru ke JSX.
10. Draft tidak boleh muncul di Portal.

## Before editing

- Baca dokumen DNA yang relevan.
- Pertahankan `.openai/hosting.json`, scripts build, dan struktur Next.js.
- Jangan menghapus perubahan pengguna yang tidak terkait.
- Gunakan semantic tokens, bukan warna hardcode baru.
- Uji light/dark, responsive, keyboard, reduced motion, dan build.

## Quality bar

- Teks mudah dipahami sekali baca.
- Body copy nyaman untuk sesi membaca panjang.
- Animasi tidak menjadi dekorasi terus-menerus.
- Portal dan CMS berbagi data yang sama.
- Empty, loading, error, success, draft, archived, dan deprecated states jelas.
