export function renderGuide(root) {
  root.innerHTML = `
    <div class="page-head guide-head">
      <div>
        <h1>Panduan Penggunaan</h1>
        <p>Panduan ringkas untuk pendaftaran Tingkatan 1 dan urusan koperasi SMK Lohan.</p>
      </div>
      <a class="btn" href="#/">Kembali ke sistem</a>
    </div>

    <nav class="card guide-index" aria-label="Kandungan panduan">
      <strong>Dalam panduan ini</strong>
      <button type="button" data-guide-target="guide-login">Log masuk</button>
      <button type="button" data-guide-target="guide-register">Pendaftaran murid</button>
      <button type="button" data-guide-target="guide-import">Import senarai</button>
      <button type="button" data-guide-target="guide-receipt">Resit koperasi</button>
      <button type="button" data-guide-target="guide-report">Laporan koperasi</button>
      <button type="button" data-guide-target="guide-help">Jika ada masalah</button>
    </nav>

    <article class="guide-content">
      <section class="card" id="guide-login">
        <h2>1. Log masuk</h2>
        <ol>
          <li>Gunakan akaun e-mel sekolah yang telah dibenarkan.</li>
          <li>Masukkan e-mel dan kata laluan, kemudian tekan <strong>Log Masuk</strong>.</li>
          <li>Menutup tab tidak melog keluar. Pada komputer atau telefon yang dikongsi, tekan <strong>Log Keluar</strong> apabila selesai.</li>
        </ol>
      </section>

      <section class="card" id="guide-register">
        <h2>2. Pendaftaran Tingkatan 1 mengikut sekolah rendah</h2>
        <p>Semua urusan pendaftaran dalam sistem ini adalah untuk <strong>murid Tingkatan 1 sahaja</strong>. Pada hari pendaftaran, urus murid mengikut sekolah rendah asal.</p>
        <ol>
          <li>Buka <strong>e-Daftar → Pendaftaran</strong> dan pilih sekolah rendah dalam menu <strong>Sekolah rendah</strong>. Pilih <strong>Semua sekolah</strong> untuk melihat semua murid.</li>
          <li>Cari murid menggunakan nama atau sebahagian nombor IC. Semak nama dan sekolah rendah pada kad murid.</li>
          <li>Tekan <strong>Tanda daftar</strong> apabila kehadiran disahkan. Jika tersalah, tekan <strong>Batal daftar</strong>.</li>
          <li>Gunakan penapis status untuk melihat murid yang sudah atau belum daftar. Senarai akan dikemas kini secara automatik; tekan <strong>Muat semula</strong> jika perlu.</li>
        </ol>
        <p class="notice">Pastikan sekolah rendah yang dipilih betul sebelum menanda kehadiran. Jika murid tiada dalam senarai, semak ejaan carian atau hubungi pentadbir untuk semakan data.</p>
        <h3>Tambah atau betulkan maklumat murid</h3>
        <p>Tekan <strong>Murid baharu</strong> untuk menambah rekod atau <strong>Butiran</strong> untuk pembetulan. Tingkatan ditetapkan kepada Tingkatan 1. Maklumat penting ialah sekolah rendah asal, nama, nombor IC dan status OKU.</p>
      </section>

      <section class="card" id="guide-import">
        <h2>3. Import senarai murid</h2>
        <p>Import senarai Excel sebelum hari pendaftaran supaya guru hanya perlu mencari murid dan menanda kehadiran.</p>
        <ol>
          <li>Buka <strong>e-Daftar → Import Data</strong>, kemudian muat turun templat.</li>
          <li>Isi nama, nombor IC dan sekolah rendah asal. Sistem menerima murid Tingkatan 1 sahaja; baris dengan tingkatan lain akan ditolak.</li>
          <li>Pilih fail Excel <strong>.xlsx</strong> (maksimum 2 MB dan 2,000 baris), semak pratonton, kemudian tekan butang import.</li>
        </ol>
        <p class="muted">Rekod dengan nombor IC yang sudah wujud akan dilangkau dan tidak ditulis ganti.</p>
      </section>

      <section class="card" id="guide-receipt">
        <h2>4. Resit koperasi</h2>
        <ol>
          <li>Buka <strong>e-Resit Koperasi → Jana Resit</strong> dan cari murid Tingkatan 1 menggunakan nama atau nombor IC.</li>
          <li>Pilih murid yang betul, tambah barangan dan semak kuantiti serta jumlah.</li>
          <li>Pilih <strong>Tunai</strong> atau <strong>Pindahan Bank</strong>. Untuk pindahan bank, isikan nombor rujukan.</li>
          <li>Sahkan pembayaran dan tekan <strong>Simpan Resit</strong>. Semak <strong>Sejarah Resit</strong> jika sambungan terputus semasa menyimpan, supaya resit tidak dibuat dua kali.</li>
        </ol>
        <p>Semasa log masuk, pilih nombor kaunter peranti ini. Nombor disimpan pada peranti dan dicatat pada resit baharu; peranti lain boleh menggunakan nombor kaunter berbeza. Resit boleh dibuka semula melalui Sejarah Resit untuk dicetak atau dikongsi.</p>
      </section>

      <section class="card" id="guide-report">
        <h2>5. Laporan koperasi</h2>
        <p>Buka <strong>e-Resit Koperasi → Laporan Koperasi</strong> untuk melihat ringkasan jualan yang direkod melalui resit.</p>
        <ol>
          <li>Pilih tarikh mula dan tarikh akhir. Laporan dibuka dengan rekod dari awal tahun hingga hari ini.</li>
          <li>Pilih semua bayaran, tunai atau pindahan bank untuk menapis transaksi.</li>
          <li>Semak jumlah jualan dan gunakan jadual untuk melihat nombor kaunter, nama murid, nombor resit, jumlah serta kaedah pembayaran bagi setiap resit.</li>
          <li>Gunakan <strong>Muat turun CSV</strong> untuk membuka butiran dalam hamparan atau <strong>Cetak laporan</strong> untuk salinan bercetak.</li>
        </ol>
      </section>

      <section class="card" id="guide-help">
        <h2>6. Jika ada masalah</h2>
        <ul>
          <li><strong>Senarai masih memuatkan:</strong> semak sambungan internet, tunggu sebentar, kemudian tekan <strong>Muat semula</strong>. Jika berulang, maklumkan pentadbir.</li>
          <li><strong>Murid tidak dijumpai:</strong> semak nama atau nombor IC, pilih sekolah rendah yang betul, dan pastikan data murid telah diimport.</li>
          <li><strong>Akaun tidak dibenarkan atau kata laluan terlupa:</strong> hubungi pentadbir sistem sekolah.</li>
          <li><strong>Telefon atau skrin kecil:</strong> tekan <strong>Menu</strong> di bahagian atas untuk membuka navigasi. Senarai pendaftaran dipaparkan sebagai kad yang boleh ditatal.</li>
        </ul>
        <p class="notice">SPeRK memerlukan sambungan internet. Jangan kongsi kata laluan, dan log keluar selepas menggunakan peranti bersama.</p>
      </section>
    </article>`;

  root.querySelectorAll("[data-guide-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const section = root.querySelector(`#${button.dataset.guideTarget}`);
      if (!section) return;
      section.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}
