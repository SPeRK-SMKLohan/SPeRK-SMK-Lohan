# Sistem Resit Bayaran Koperasi SMK Lohan, Ranau

Aplikasi web untuk merekod bayaran koperasi dan menjana resit digital.
Status: dalam pembangunan (Fasa 1). Gunakan data rekaan sahaja.

## Struktur

- `frontend/`: antara muka (HTML, CSS, JavaScript, Vite)
- `worker/`: backend API (Cloudflare Workers)
- `docs/`: dokumentasi perancangan

## Menjalankan secara tempatan

Frontend:

```
cd frontend
npm install
npm run dev
```

Worker:

```
cd worker
npm install
npm run dev
```

## Peraturan penting

- Jangan masukkan data murid sebenar ke dalam repositori.
- Jangan commit kunci rahsia, fail `.env` atau `.dev.vars`.