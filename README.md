# Nusa Design System Portal & CMS

Portal dokumentasi untuk UI/UX designer dengan CMS Administrator, Asset Explorer, token import, light/dark mode, dan motion yang terkontrol.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Portal tersedia dari `/`. CMS tersedia dari `/studio/login`. Pada demo lokal, email dan password apa pun dapat digunakan. Ganti autentikasi demo dengan Supabase Auth sebelum produksi.

## Build

```bash
npm run build
```

Proyek menggunakan Next.js dan dapat dipasang di Vercel. Salin `.env.example` menjadi `.env.local` saat Supabase diaktifkan.

## Keputusan penting

- Portal tidak membutuhkan login dan memakai `noindex`.
- CMS hanya untuk Administrator.
- Figma API tidak digunakan.
- Token sumber memakai format plugin Figma Design Tokens.
- Semua konten editorial dikelola dari CMS; renderer dan behavior berada di kode.
- UI memakai neutral-first color, light/dark mode, dan Bahasa Indonesia yang mudah dipahami designer.

Mulai dari [AGENTS.md](./AGENTS.md) sebelum mengubah proyek.
