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
      <h1>Panduan penggunaan</h1>
      <p class="lede">Arahan ringkas untuk pendaftaran Tingkatan 1 dan urusan koperasi
        SMK Lohan. Panduan ini boleh dibaca sebelum log masuk.</p>
    </div>

    <div class="guide-layout">
      <nav class="guide-nav no-print" aria-label="Kandungan panduan">
        <h2>Dalam panduan ini</h2>
        <ol>
          ${SECTIONS.map((s) => `
            <li><button type="button" class="guide-jump" data-target="${s.id}">${esc(s.label)}</button></li>`).join("")}
        </ol>
      </nav>

      <article class="guide-body">
        <section class="card" id="guide-login">
          <h2>1. Log masuk</h2>
          <ol>
            <li>Masukkan e-mel sekolah dan kata laluan yang diberi pentadbir.</li>
            <li>Masukkan <strong>nama guru</strong>. Nama ini dicetak pada resit yang anda jana.</li>
            <li>Tekan <strong>Log Masuk</strong>.</li>
          </ol>
          <p>Menutup tab tidak melog keluar. Pada peranti yang dikongsi, tekan
            <strong>Log Keluar</strong> di penjuru atas selepas selesai.</p>
          <p class="notice"><strong>Nama guru disimpan pada peranti ini sahaja.</strong>
            Jika anda menggunakan peranti lain, masukkan nama anda di peranti itu.</p>
        </section>

        <section class="card" id="guide-register">
          <h2>2. Daftar murid Tingkatan 1</h2>
          <p>Sistem ini hanya menerima murid <strong>Tingkatan 1</strong>. Pada hari
            pendaftaran, uruskan satu sekolah rendah pada satu masa.</p>
          <ol>
            <li>Buka <strong>Pendaftaran</strong> dan tekan nama sekolah rendah asal murid.</li>
            <li>Taip nama murid atau sekurang-kurangnya 2 digit No. IC.</li>
            <li>Semak nama, No. IC dan sekolah pada baris murid.</li>
            <li>Tekan <strong>Tanda daftar</strong>.</li>
          </ol>
          <p>Selepas menanda, satu makluman muncul di bawah skrin dengan butang
            <strong>Buat asal</strong>. Butang itu boleh digunakan selama 12 saat.
            Selepas itu, gunakan <strong>Batal daftar</strong> pada baris murid.</p>
          <p class="notice">Sekolah yang anda pilih akan diingati pada peranti ini,
            supaya anda tidak perlu memilihnya semula.</p>
          <h3>Tambah atau betulkan murid</h3>
          <p>Tekan <strong>+ Murid baharu</strong> untuk menambah rekod, atau
            <strong>Butiran</strong> pada baris murid untuk membetulkan maklumat.</p>
        </section>

        <section class="card" id="guide-import">
          <h2>3. Import senarai murid</h2>
          <p>Lakukan sebelum hari pendaftaran supaya guru hanya perlu mencari dan menanda.</p>
          <ol>
            <li>Buka <strong>Import Data</strong> dan muat turun templat.</li>
            <li>Isi nama, No. IC dan sekolah rendah asal. Simpan sebagai fail <strong>.xlsx</strong>.</li>
            <li>Pilih fail itu, semak pratonton, kemudian tekan butang import.</li>
          </ol>
          <p>Murid yang sudah wujud (No. IC sama) akan dilangkau, bukan diganti.
            Fail terhad kepada 2 MB dan 2,000 baris.</p>
        </section>

        <section class="card" id="guide-receipt">
          <h2>4. Jana resit koperasi</h2>
          <ol>
            <li>Buka <strong>Jana Resit</strong> dan cari murid.</li>
            <li>Tambah barangan yang dibeli. Kuantiti boleh diubah.</li>
            <li>Pilih <strong>Tunai</strong> atau <strong>Pindahan Bank</strong>.
              Untuk pindahan, isi nombor rujukan.</li>
            <li>Tandakan <strong>Pembayaran telah disahkan</strong>, kemudian tekan
              <strong>Simpan Resit</strong>.</li>
          </ol>
          <p>Jumlah resit sentiasa dipaparkan di bar bawah skrin, jadi anda boleh
            menyemaknya pada bila-bila masa.</p>
          <p class="notice">Jika sambungan terputus semasa menyimpan, buka
            <strong>Laporan</strong> dahulu. Resit mungkin telah disimpan, dan
            menyimpan semula akan menggunakan resit yang sama.</p>
        </section>

        <section class="card" id="guide-report">
          <h2>5. Laporan koperasi</h2>
          <p>Buka <strong>Laporan</strong> untuk melihat ringkasan jualan.</p>
          <ol>
            <li>Pilih tarikh mula dan tarikh akhir.</li>
            <li>Pilih semua bayaran, tunai atau pindahan bank.</li>
            <li>Semak jumlah jualan dan senarai resit.</li>
            <li>Gunakan <strong>Muat turun CSV</strong> atau <strong>Cetak</strong>.</li>
          </ol>
          <p class="muted">Laporan memuatkan sehingga 500 resit. Jika had itu dicapai,
            pilih tempoh tarikh yang lebih pendek.</p>
        </section>

        <section class="card" id="guide-help">
          <h2>6. Jika ada masalah</h2>
          <h3>Senarai murid tidak muncul</h3>
          <p>Pastikan sekolah rendah telah dipilih, semak sambungan internet, kemudian
            tekan <strong>Muat semula</strong>.</p>
          <h3>Murid tidak dijumpai</h3>
          <p>Semak ejaan nama atau nombor IC. Pastikan sekolah rendah yang dipilih betul.
            Jika rekod memang tiada, tambah melalui <strong>+ Murid baharu</strong>.</p>
          <h3>Tidak dapat log masuk</h3>
          <p>Semak e-mel dan kata laluan. Jika akaun tidak dibenarkan atau kata laluan
            terlupa, hubungi pentadbir sistem sekolah.</p>
          <h3>Tulisan terlalu kecil</h3>
          <p>Gunakan menu <strong>Saiz teks</strong> di penjuru atas dan pilih
            <strong>Besar</strong> atau <strong>Sangat besar</strong>. Pilihan ini
            diingati pada peranti ini.</p>
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
