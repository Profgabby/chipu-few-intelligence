# Stage 2 verification checklist

- TypeScript/Vite production build through repository CI
- Netlify deploy preview
- Supabase production migration applied additively
- RLS enabled on all new domain tables
- security advisor reviewed after DDL
- performance advisor reviewed; new Place foreign keys covered by indexes
- no production data dropped or renamed
- no default production dashboard values inserted
- legacy CropSmart routes and engines retained
