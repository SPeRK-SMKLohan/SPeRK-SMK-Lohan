import { esc } from "../shared/dom.js";

/* Help guide.
   Read before signing in, so it has to work without a session and without
   JavaScript-driven routing. Section links are buttons that scroll, because a
   plain `#id` link would be interpreted as a route change by the hash router. */

const SECTIONS = [
  { id: "guide-login", label: "Log masuk" },
  { id: "guide-register", label: "Daftar murid" },
  { id: "guide-import", label: "Import senarai" },
  { id: "guide-receipt", label: "Jana resit" },
  { id: "guide-report", label: "Laporan" },
  { id: "guide-help", label: "Jika ada masalah" },
];

export function renderGuide(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Panduan</h1>
    </div>

    <div class="guide-layout">
      <nav class="guide-nav no-print" aria-label="Kandungan panduan">
        <h2>Kandungan</h2>
        <ol>
          ${SECTIONS.map((s) => `
            <li><button type="button" class="guide-jump" data-target="${s.id}">${esc(s.label)}</button></li>`).join("")}
        </ol>
      </nav>

      <article class="guide-body">
        <section class="card" id="guide-login">
          <h2>1. Log masuk</h2>
          <p>Masukkan e-mel sekolah dan kata laluan, kemudian tekan <strong>Log masuk</strong>.</p>
          <p>Tekan <strong>Log Keluar</strong> pada peranti bersama.</p>
        </section>

        <section class="card" id="guide-register">
          <h2>2. Daftar murid Tingkatan 1</h2>
          <p>Daftar murid Tingkatan 1, satu sekolah rendah pada satu masa.</p>
          <ol>
            <li>Buka <strong>Pendaftaran</strong> dan pilih sekolah asal.</li>
            <li>Cari nama murid atau 2 digit terakhir No. IC.</li>
            <li>Semak rekod, kemudian tekan <strong>Tanda daftar</strong>.</li>
          </ol>
          <p>Tersilap? Tekan <strong>Buat asal</strong> dalam 12 saat, atau
            <strong>Batal daftar</strong> kemudian.</p>
          <h3>Tambah atau betulkan murid</h3>
          <p>Tekan <strong>+ Murid baharu</strong> untuk tambah, atau <strong>Butiran</strong> untuk edit.</p>
        </section>

        <section class="card" id="guide-import">
          <h2>3. Import senarai murid</h2>
          <ol>
            <li>Buka <strong>Import senarai murid</strong> dan muat turun templat.</li>
            <li>Isi nama, No. IC dan sekolah rendah asal. Simpan sebagai fail <strong>.xlsx</strong>.</li>
            <li>Pilih fail, semak pratonton dan tekan <strong>Import</strong>.</li>
          </ol>
          <p>Rekod sedia ada dengan No. IC sama tidak akan diganti. Had fail: 2 MB, 2,000 baris.</p>
        </section>

        <section class="card" id="guide-receipt">
          <h2>4. Jana resit koperasi</h2>
          <ol>
            <li>Buka <strong>Jana Resit</strong> dan cari murid.</li>
            <li>Tambah barangan dan laras kuantiti.</li>
            <li>Pilih <strong>Tunai</strong> atau <strong>Pindahan Bank</strong>.
              Untuk pindahan, isi nombor rujukan.</li>
            <li>Tandakan <strong>Pembayaran telah disahkan</strong>, kemudian tekan <strong>Simpan Resit</strong>.</li>
          </ol>
          <p class="notice">Jika sambungan terputus semasa menyimpan, semak <strong>Laporan</strong>.
            Simpan semula tidak akan menggandakan resit.</p>
        </section>

        <section class="card" id="guide-report">
          <h2>5. Laporan koperasi</h2>
          <ol>
            <li>Pilih tarikh mula dan tarikh akhir.</li>
            <li>Pilih semua bayaran, tunai atau pindahan bank.</li>
            <li>Semak jumlah jualan dan senarai resit.</li>
            <li>Gunakan <strong>Muat turun CSV</strong> atau <strong>Cetak</strong>.</li>
          </ol>
          <p class="muted">Had: 500 resit. Pilih tarikh lebih pendek jika had dicapai.</p>
        </section>

        <section class="card" id="guide-help">
          <h2>6. Jika ada masalah</h2>
          <h3>Senarai murid tidak muncul</h3>
          <p>Pilih sekolah, semak internet, kemudian tekan <strong>Muat semula</strong>.</p>
          <h3>Murid tidak dijumpai</h3>
          <p>Semak ejaan, No. IC dan sekolah. Jika tiada, tekan <strong>+ Murid baharu</strong>.</p>
          <h3>Tidak dapat log masuk</h3>
          <p>Semak e-mel dan kata laluan. Jika masih gagal, hubungi pentadbir sekolah.</p>
          <h3>Tulisan terlalu kecil</h3>
          <p>Gunakan zum pelayar atau tetapan paparan pada peranti anda.</p>
          <h3>Skrin telefon</h3>
          <p>Tekan <strong>Menu</strong> di bahagian atas untuk melihat semua halaman.</p>
          <p class="notice">SPeRK memerlukan sambungan internet. Jangan kongsi kata laluan,
            dan log keluar selepas menggunakan peranti bersama.</p>
        </section>
      </article>
    </div>`;

  const navButtons = [...root.querySelectorAll(".guide-jump")];
  const sections = SECTIONS.map((s) => root.querySelector(`#${s.id}`)).filter(Boolean);

  const setActive = (id) => {
    for (const btn of navButtons) {
      btn.setAttribute("aria-current", String(btn.dataset.target === id));
    }
  };

  for (const btn of navButtons) {
    btn.addEventListener("click", () => {
      const target = root.querySelector(`#${btn.dataset.target}`);
      if (!target) return;
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      setActive(btn.dataset.target);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  // Highlight the section currently in view.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.5] });

    for (const s of sections) observer.observe(s);
  }

  setActive(SECTIONS[0].id);
}
