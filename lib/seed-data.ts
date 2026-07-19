import type { Asset, ContentPage, SiteData } from "@/types/content";

const componentSections = (name: string) => [
  { id: "overview", kind: "overview" as const, title: "Overview", body: `${name} membantu designer membuat pengalaman yang jelas dan konsisten. Gunakan panduan ini untuk memilih bentuk, ukuran, dan perilaku yang sesuai.` },
  { id: "preview", kind: "preview" as const, title: "Contoh visual", body: "Coba pilihan yang tersedia untuk melihat perubahan secara langsung." },
  { id: "anatomy", kind: "anatomy" as const, title: "Anatomy", items: [{ title: "Container", description: "Area utama yang membentuk komponen." }, { title: "Label", description: "Teks yang menjelaskan tindakan atau informasi." }, { title: "Icon", description: "Elemen pendukung yang memperjelas makna." }] },
  { id: "variants", kind: "variants" as const, title: "Variants", items: [{ title: "Primary", description: "Gunakan untuk tindakan utama." }, { title: "Secondary", description: "Gunakan untuk tindakan pendukung." }, { title: "Tertiary", description: "Gunakan untuk tindakan dengan prioritas rendah." }] },
  { id: "sizes", kind: "sizes" as const, title: "Sizes", items: [{ title: "Small", description: "Untuk area yang ringkas." }, { title: "Medium", description: "Pilihan standar untuk sebagian besar kebutuhan." }, { title: "Large", description: "Untuk tindakan yang perlu lebih menonjol." }] },
  { id: "states", kind: "states" as const, title: "States", items: [{ title: "Default", description: "Tampilan awal." }, { title: "Hover", description: "Saat pointer berada di atas komponen." }, { title: "Focus", description: "Saat dipilih menggunakan keyboard." }, { title: "Disabled", description: "Saat tindakan belum dapat digunakan." }] },
  { id: "behavior", kind: "behavior" as const, title: "Behavior", body: "Berikan respons yang langsung dan dapat dipahami setelah pengguna berinteraksi. Jangan mengubah posisi komponen secara tiba-tiba." },
  { id: "content", kind: "content" as const, title: "Content guidelines", body: "Gunakan label singkat yang menjelaskan tujuan. Hindari kata yang terlalu umum seperti “OK” atau “Klik di sini”." },
  { id: "responsive", kind: "responsive" as const, title: "Responsive behavior", body: "Pertahankan hierarki dan ruang sentuh yang nyaman pada layar kecil. Susun konten secara vertikal jika ruang tidak mencukupi." },
  { id: "accessibility", kind: "accessibility" as const, title: "Accessibility", items: [{ title: "Label jelas", description: "Pastikan tujuan komponen dapat dipahami tanpa menebak." }, { title: "Focus terlihat", description: "Tampilkan penanda focus yang memiliki kontras cukup." }, { title: "Area sentuh", description: "Sediakan area interaksi yang nyaman pada perangkat sentuh." }] },
  { id: "do-dont", kind: "do-dont" as const, title: "Do & don’t", items: [{ title: "Gunakan hierarki yang jelas", description: "Bantu pengguna mengenali pilihan utama.", tone: "do" as const }, { title: "Jangan membuat pilihan bersaing", description: "Terlalu banyak penekanan membuat keputusan sulit.", tone: "dont" as const }] },
  { id: "related", kind: "related" as const, title: "Related components", body: "Lihat komponen lain yang dapat digunakan bersama." },
  { id: "figma", kind: "figma" as const, title: "Figma resource", body: "Buka komponen yang sudah disetujui di Figma Library." },
  { id: "changelog", kind: "changelog" as const, title: "Changelog", body: "Versi 1.0 — Panduan awal dipublikasikan." },
];

const foundationSections = (name: string) => [
  { id: "overview", kind: "overview" as const, title: "Overview", body: `${name} membantu menjaga keputusan visual tetap konsisten di seluruh pengalaman.` },
  { id: "principles", kind: "rich-text" as const, title: "Principles", items: [{ title: "Konsisten", description: "Gunakan pilihan yang sudah tersedia sebelum membuat yang baru." }, { title: "Bermakna", description: "Setiap pilihan harus membantu pengguna memahami interface." }, { title: "Inklusif", description: "Pastikan hasilnya tetap mudah digunakan oleh lebih banyak orang." }] },
  { id: "tokens", kind: "tokens" as const, title: "Token collection", body: "Gunakan nama token, bukan nilai yang dipilih secara manual." },
  { id: "usage", kind: "behavior" as const, title: "Usage", body: "Pilih token berdasarkan fungsi dan konteks, bukan hanya berdasarkan tampilannya." },
  { id: "examples", kind: "preview" as const, title: "Examples", body: "Contoh berikut menunjukkan penerapan yang disarankan." },
  { id: "accessibility", kind: "accessibility" as const, title: "Accessibility", body: "Periksa kontras, keterbacaan, dan kejelasan pada light maupun dark mode." },
  { id: "do-dont", kind: "do-dont" as const, title: "Do & don’t", items: [{ title: "Gunakan token yang tersedia", description: "Menjaga desain tetap konsisten.", tone: "do" as const }, { title: "Jangan membuat nilai baru tanpa kebutuhan", description: "Variasi yang tidak terkontrol sulit dikelola.", tone: "dont" as const }] },
  { id: "figma", kind: "figma" as const, title: "Figma resource", body: "Temukan foundation ini di Figma Library." },
  { id: "changelog", kind: "changelog" as const, title: "Changelog", body: "Versi 1.0 — Panduan awal dipublikasikan." },
];

const page = (id: string, type: ContentPage["type"], title: string, category: string, summary: string, featured = false): ContentPage => ({
  id, type, title, slug: title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), summary, category,
  status: "published", maturity: "stable", version: "1.0", owner: "Design System Team", updatedAt: "19 Jul 2026", featured,
  sections: type === "component" ? componentSections(title) : foundationSections(title),
});

const pages: ContentPage[] = [
  page("f-color", "foundation", "Colour", "Visual language", "Gunakan warna untuk membangun hierarki, menyampaikan makna, dan menjaga pengalaman tetap konsisten.", true),
  page("f-type", "foundation", "Typography", "Visual language", "Buat informasi mudah dipindai dan nyaman dibaca pada setiap ukuran layar.", true),
  page("f-space", "foundation", "Spacing", "Layout", "Ciptakan ritme yang konsisten di antara elemen dan bagian halaman."),
  page("f-grid", "foundation", "Grid", "Layout", "Susun konten dengan struktur yang fleksibel untuk desktop, tablet, dan mobile."),
  page("f-radius", "foundation", "Radius", "Shape", "Gunakan bentuk sudut yang konsisten untuk memperjelas hubungan antar elemen."),
  page("f-elevation", "foundation", "Elevation", "Visual language", "Tunjukkan hubungan lapisan tanpa menambahkan bayangan berlebihan."),
  page("f-gradient", "foundation", "Gradients", "Visual language", "Gunakan gradient untuk momen brand yang terpilih, bukan sebagai dekorasi umum."),
  page("f-icon", "foundation", "Iconography", "Assets", "Gunakan icon outline yang jelas dan konsisten untuk tindakan dan navigasi."),
  page("f-illustration", "foundation", "Illustration", "Assets", "Gunakan visual untuk membantu menjelaskan cerita, keadaan, atau pesan."),
  page("f-motion", "foundation", "Motion", "Interaction", "Gunakan gerakan untuk menjelaskan perubahan dan memberikan feedback."),
  page("f-a11y", "foundation", "Accessibility", "Experience", "Rancang pengalaman yang dapat digunakan oleh lebih banyak orang."),
  page("c-button", "component", "Button", "Actions", "Membantu pengguna menjalankan tindakan yang jelas.", true),
  page("c-input", "component", "Input", "Forms", "Membantu pengguna memasukkan informasi dengan mudah.", true),
  page("c-select", "component", "Select", "Forms", "Membantu pengguna memilih satu pilihan dari daftar."),
  page("c-check", "component", "Checkbox", "Selection", "Memungkinkan pengguna memilih satu atau beberapa pilihan."),
  page("c-radio", "component", "Radio", "Selection", "Digunakan ketika pengguna perlu memilih satu dari beberapa pilihan."),
  page("c-switch", "component", "Switch", "Selection", "Mengaktifkan atau menonaktifkan pengaturan secara langsung."),
  page("c-card", "component", "Card", "Content", "Mengelompokkan informasi dan tindakan yang saling berhubungan."),
  page("c-badge", "component", "Badge", "Status", "Menampilkan status atau informasi singkat."),
  page("c-modal", "component", "Modal", "Overlay", "Memusatkan perhatian pada keputusan atau tugas tertentu."),
  page("c-tabs", "component", "Tabs", "Navigation", "Memindahkan pengguna di antara beberapa bagian yang setara."),
  page("c-table", "component", "Table", "Data display", "Membantu pengguna membaca dan membandingkan data terstruktur."),
];

const asset = (id: string, type: Asset["type"], name: string, category: string, brand: Asset["brand"], glyph: string): Asset => ({ id, type, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), category, brand, status: "published", description: `${name} dapat digunakan untuk membantu menyampaikan makna dengan jelas.`, keywords: [name.toLowerCase(), category.toLowerCase()], glyph, version: "1.0", updatedAt: "19 Jul 2026" });

const iconNames = [["Add","Actions","＋"],["Arrow right","Navigation","→"],["Check","Status","✓"],["Search","Navigation","⌕"],["Close","Actions","×"],["Edit","Actions","✎"],["Delete","Actions","⌫"],["Settings","System","⚙"],["Download","Actions","↓"],["Upload","Actions","↑"],["Info","Status","i"],["Warning","Status","!"]] as const;

export const seedData: SiteData = {
  settings: { name: "Nusa Design System", tagline: "Design with clarity.", description: "Satu tempat untuk menemukan foundation, component, pattern, dan aset yang membantu designer bekerja lebih konsisten.", visibility: "unlisted" },
  pages,
  assets: [
    ...iconNames.map((item, index) => asset(`icon-${index}`, "icon", item[0], item[1], "Shared", item[2])),
    asset("ii-1", "icon-illustration", "Internet package", "Product", "IM3", "◉"), asset("ii-2", "icon-illustration", "Entertainment", "Lifestyle", "Indosat", "✦"),
    asset("ii-3", "icon-illustration", "Rewards", "Service", "Tri", "◇"), asset("ii-4", "icon-illustration", "Partner support", "Support", "Partner", "◎"),
    asset("ill-1", "illustration", "Empty state", "Empty state", "Shared", "◌"), asset("ill-2", "illustration", "Success moment", "Success", "Shared", "✺"),
    asset("logo-1", "logo", "IM3 Logo", "Corporate", "IM3", "IM3"), asset("logo-2", "logo", "Tri Logo", "Corporate", "Tri", "3"),
    asset("brand-1", "brand-asset", "Brand background", "Background", "Indosat", "▧"), asset("template-1", "template", "Mobile screen template", "UI template", "Shared", "▯"),
  ],
  releases: [{ id: "r-1", version: "1.0", title: "A clearer starting point", summary: "Foundation, component, dan Asset Library kini tersedia dalam satu portal.", date: "19 Jul 2026", status: "published", changes: ["Menambahkan Colour dan Typography", "Menambahkan Button dan Input", "Membuka Icon dan Icon Illustration Explorer"] }],
};
