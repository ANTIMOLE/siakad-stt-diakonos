# File Tree: siakad-stt-diakonos

**Generated:** 2/17/2026, 7:09:02 PM
**Root Path:** `d:\DIAKONOS\SIAKAD\siakad-stt-diakonos`

```
├── 📁 backend
│   ├── 📁 dbml
│   │   └── 📄 schema.dbml
│   ├── 📁 logo
│   │   ├── 🖼️ LOGO.png
│   │   ├── 🖼️ android-chrome-192x192.png
│   │   ├── 🖼️ android-chrome-512x512.png
│   │   ├── 🖼️ apple-touch-icon.png
│   │   ├── 🖼️ favicon-16x16.png
│   │   └── 🖼️ favicon-32x32.png
│   ├── 📁 prisma
│   │   ├── 📁 migrations
│   │   │   ├── 📁 20251230065832_initial_schema
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260109032345_remove_email_from_user
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260115062206_add_pembayaran_krs
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260115062607_add_pembayaran_krs2
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260117135243_add_semester_id_to_paket_krs
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260121043823_mahasiswa_perubahan
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260126052614_add_username_column
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260126053107_add_username_unique_constraint
│   │   │   │   └── 📄 migration.sql
│   │   │   ├── 📁 20260130135710_add_kelas_mk_file
│   │   │   │   └── 📄 migration.sql
│   │   │   └── ⚙️ migration_lock.toml
│   │   ├── 📄 schema.prisma
│   │   ├── 📄 seed-clean.ts
│   │   ├── 📄 seed-clean_2.ts
│   │   ├── 📄 seed-incremental.ts
│   │   ├── 📄 seed-kelasmk.ts
│   │   ├── 📄 seed-paketkrs.ts
│   │   ├── 📄 seed-sttd.ts
│   │   └── 📄 seed.ts
│   ├── 📁 src
│   │   ├── 📁 config
│   │   │   ├── 📄 database.ts
│   │   │   └── 📄 env.ts
│   │   ├── 📁 controllers
│   │   │   ├── 📄 authController.ts
│   │   │   ├── 📄 dashboardController.ts
│   │   │   ├── 📄 dashboardKeuanganController.ts
│   │   │   ├── 📄 dosenController.ts
│   │   │   ├── 📄 kelasMKController.ts
│   │   │   ├── 📄 kelasMKFileController.ts
│   │   │   ├── 📄 khsController.ts
│   │   │   ├── 📄 krsController.ts
│   │   │   ├── 📄 mahasiswaController.ts
│   │   │   ├── 📄 mataKuliahController.ts
│   │   │   ├── 📄 nilaiController.ts
│   │   │   ├── 📄 paketKRSController.ts
│   │   │   ├── 📄 pembayaranController.ts
│   │   │   ├── 📄 presensiController.ts
│   │   │   ├── 📄 ruanganController.ts
│   │   │   └── 📄 semesterController.ts
│   │   ├── 📁 generated
│   │   │   └── 📁 prisma
│   │   │       ├── 📁 internal
│   │   │       │   ├── 📄 class.ts
│   │   │       │   ├── 📄 prismaNamespace.ts
│   │   │       │   └── 📄 prismaNamespaceBrowser.ts
│   │   │       ├── 📁 models
│   │   │       ├── 📄 browser.ts
│   │   │       ├── 📄 client.ts
│   │   │       ├── 📄 commonInputTypes.ts
│   │   │       ├── 📄 enums.ts
│   │   │       ├── 📄 models.ts
│   │   │       └── 📄 query_engine-windows.dll.node
│   │   ├── 📁 middlewares
│   │   │   ├── 📄 authMiddleware.ts
│   │   │   ├── 📄 errorMiddleware.ts
│   │   │   ├── 📄 roleMiddleware.ts
│   │   │   └── 📄 validationMiddleware.ts
│   │   ├── 📁 prisma
│   │   ├── 📁 routes
│   │   │   ├── 📄 authRoutes.ts
│   │   │   ├── 📄 dashboardKeuanganRoutes.ts
│   │   │   ├── 📄 dashboardRoutes.ts
│   │   │   ├── 📄 dosenRoutes.ts
│   │   │   ├── 📄 kelasMKFileRoutes.ts
│   │   │   ├── 📄 kelasMKRoutes.ts
│   │   │   ├── 📄 khsRoutes.ts
│   │   │   ├── 📄 krsRoutes.ts
│   │   │   ├── 📄 mahasiswaRoutes.ts
│   │   │   ├── 📄 mataKuliahRoutes.ts
│   │   │   ├── 📄 nilaiRoutes.ts
│   │   │   ├── 📄 paketKRSRoutes.ts
│   │   │   ├── 📄 pembayaranRoutes.ts
│   │   │   ├── 📄 presensiRoutes.ts
│   │   │   ├── 📄 ruanganRoutes.ts
│   │   │   └── 📄 semesterRoutes.ts
│   │   ├── 📁 services
│   │   │   ├── 📄 kelasMKFileService.ts
│   │   │   ├── 📄 krsService.ts
│   │   │   ├── 📄 nilaiService.ts
│   │   │   ├── 📄 pembayaranService.ts
│   │   │   └── 📄 presensiService.ts
│   │   ├── 📁 types
│   │   │   └── 📄 index.ts
│   │   ├── 📁 utils
│   │   │   ├── 📄 excelExport.ts
│   │   │   ├── 📄 excelGenerator.ts
│   │   │   ├── 📄 hitungIPK.ts
│   │   │   ├── 📄 konversiNilai.ts
│   │   │   ├── 📄 pdfGenerator.ts
│   │   │   └── 📄 validasi.ts
│   │   └── 📄 server.ts
│   ├── 📁 uploads
│   │   ├── 📁 kelasmkfiles
│   │   └── 📁 pembayaran
│   ├── ⚙️ .gitignore
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── 📄 prisma.config.ts
│   ├── 📄 render-build.sh
│   └── ⚙️ tsconfig.json
├── 📁 frontend
│   ├── 📁 app
│   │   ├── 📁 (auth)
│   │   │   ├── 📁 login
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 admin
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 dosen
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 kelas-mk
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 krs
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 krs-approval
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 mahasiswa
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 mata-kuliah
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 paket-krs
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 pembayaran
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 ruangan
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 semester
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 edit
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 tambah
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 settings
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 dosen
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 input-nilai
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 jadwal
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 kelas-mk-files
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 krs-approval
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 mahasiswa-bimbingan
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 presensi
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 profil
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 settings
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 keuangan
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 pembayaran
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 settings
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 mahasiswa
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 jadwal
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 kelas-mk-files
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 khs
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 krs
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 nilai
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 pembayaran
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 presensi
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 profil
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 settings
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📄 favicon.ico
│   │   ├── 🎨 globals.css
│   │   ├── 📄 layout.tsx
│   │   ├── 📄 page.tsx
│   │   └── 📄 providers.tsx
│   ├── 📁 components
│   │   ├── 📁 features
│   │   │   ├── 📁 cards
│   │   │   ├── 📁 forms
│   │   │   ├── 📁 modals
│   │   │   ├── 📁 status
│   │   │   │   └── 📄 StatusBadge.tsx
│   │   │   └── 📁 tables
│   │   ├── 📁 layouts
│   │   │   ├── 📄 DashboardLayout.tsx
│   │   │   ├── 📄 MobileNav.tsx
│   │   │   ├── 📄 Sidebar.tsx
│   │   │   └── 📄 TopBar.tsx
│   │   ├── 📁 shared
│   │   │   ├── 📄 EmptyState.tsx
│   │   │   ├── 📄 ErrorState.tsx
│   │   │   ├── 📄 LoadingSpinner.tsx
│   │   │   ├── 📄 PageHeader.tsx
│   │   │   └── 📄 SearchBar.tsx
│   │   └── 📁 ui
│   │       ├── 📄 accordion.tsx
│   │       ├── 📄 alert-dialog.tsx
│   │       ├── 📄 alert.tsx
│   │       ├── 📄 aspect-ratio.tsx
│   │       ├── 📄 avatar.tsx
│   │       ├── 📄 badge.tsx
│   │       ├── 📄 breadcrumb.tsx
│   │       ├── 📄 button-group.tsx
│   │       ├── 📄 button.tsx
│   │       ├── 📄 calendar.tsx
│   │       ├── 📄 card.tsx
│   │       ├── 📄 carousel.tsx
│   │       ├── 📄 chart.tsx
│   │       ├── 📄 checkbox.tsx
│   │       ├── 📄 collapsible.tsx
│   │       ├── 📄 command.tsx
│   │       ├── 📄 context-menu.tsx
│   │       ├── 📄 dialog.tsx
│   │       ├── 📄 drawer.tsx
│   │       ├── 📄 dropdown-menu.tsx
│   │       ├── 📄 empty.tsx
│   │       ├── 📄 field.tsx
│   │       ├── 📄 form.tsx
│   │       ├── 📄 hover-card.tsx
│   │       ├── 📄 input-group.tsx
│   │       ├── 📄 input-otp.tsx
│   │       ├── 📄 input.tsx
│   │       ├── 📄 item.tsx
│   │       ├── 📄 kbd.tsx
│   │       ├── 📄 label.tsx
│   │       ├── 📄 menubar.tsx
│   │       ├── 📄 navigation-menu.tsx
│   │       ├── 📄 pagination.tsx
│   │       ├── 📄 popover.tsx
│   │       ├── 📄 primary-button.tsx
│   │       ├── 📄 progress.tsx
│   │       ├── 📄 radio-group.tsx
│   │       ├── 📄 scroll-area.tsx
│   │       ├── 📄 select.tsx
│   │       ├── 📄 separator.tsx
│   │       ├── 📄 sheet.tsx
│   │       ├── 📄 sidebar.tsx
│   │       ├── 📄 skeleton.tsx
│   │       ├── 📄 slider.tsx
│   │       ├── 📄 sonner.tsx
│   │       ├── 📄 spinner.tsx
│   │       ├── 📄 switch.tsx
│   │       ├── 📄 table.tsx
│   │       ├── 📄 tabs.tsx
│   │       ├── 📄 textarea.tsx
│   │       ├── 📄 toggle-group.tsx
│   │       ├── 📄 toggle.tsx
│   │       └── 📄 tooltip.tsx
│   ├── 📁 hooks
│   │   ├── 📄 use-mobile.ts
│   │   └── 📄 useAuth.ts
│   ├── 📁 lib
│   │   ├── 📄 api.ts
│   │   ├── 📄 constants.ts
│   │   ├── 📄 queryClient.ts
│   │   └── 📄 utils.ts
│   ├── 📁 public
│   │   ├── 📁 favicon
│   │   │   ├── 🖼️ android-chrome-192x192.png
│   │   │   ├── 🖼️ android-chrome-512x512.png
│   │   │   ├── 🖼️ apple-touch-icon.png
│   │   │   ├── 🖼️ favicon-16x16.png
│   │   │   ├── 🖼️ favicon-32x32.png
│   │   │   └── 📄 favicon.ico
│   │   ├── 🖼️ LOGO.png
│   │   ├── 🖼️ file.svg
│   │   ├── 🖼️ globe.svg
│   │   ├── 🖼️ next.svg
│   │   ├── 🖼️ vercel.svg
│   │   └── 🖼️ window.svg
│   ├── 📁 types
│   │   ├── 📄 index.ts
│   │   └── 📄 model.ts
│   ├── ⚙️ .gitignore
│   ├── 📝 README.md
│   ├── ⚙️ components.json
│   ├── 📄 eslint.config.mjs
│   ├── 📄 global.d.ts
│   ├── 📄 next-env.d.ts
│   ├── 📄 next.config.ts
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── 📄 postcss.config.mjs
│   ├── 📄 tailwind.config.ts
│   └── ⚙️ tsconfig.json
└── ⚙️ .gitignore
```

---
*Generated by FileTree Pro Extension*