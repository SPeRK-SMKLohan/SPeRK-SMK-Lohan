import { apiFetch } from "../shared/api.js";
import { schools } from "../features/e-daftar/constants.js";
import { searchStudents } from "../features/e-daftar/api.js";
import { esc } from "../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../shared/feedback.js";

/* Home.
   Opens with the two things staff actually come here to do, then shows the
   state of registration day. Numbers support the tasks; they do not lead. */

const getDashboard = () => apiFetch("/api/dashboard");

export async function renderHome(root) {
  root.innerHTML = `
    <div class="page-head home-hero">
      <h1>Utama</h1>
      <p class="lede">Pilih kerja yang hendak dibuat. Semua rekod murid dan resit
        koperasi ada di sini.</p>
    </div>

    <div class="task-grid">
      <a class="task-card" href="#/pendaftaran">
        <span class="task-eyebrow">Hari pendaftaran</span>
        <span class="task-title">Daftar murid Tingkatan 1</span>
        <span class="task-desc">Cari murid mengikut sekolah rendah, kemudian tekan
          <strong>Tanda daftar</strong>.</span>
        <span class="task-go">Buka pendaftaran →</span>
      </a>
      <a class="task-card" href="#/jana-resit">
        <span class="task-eyebrow">Kaunter koperasi</span>
        <span class="task-title">Jana resit bayaran</span>
        <span class="task-desc">Pilih murid, tambah barangan, pilih bayaran dan simpan resit.</span>
        <span class="task-go">Buka jana resit →</span>
      </a>
    </div>

    <div id="home-data">${loadingState("Sedang mendapatkan ringkasan sistem…")}</div>`;

  const box = root.querySelector("#home-data");

  let d;
  try {
    d = await getDashboard();
    if (!Array.isArray(d.registrationBySchool)) {
      d.registrationBySchool = await Promise.all(
        schools.slice().sort((a, b) => a.localeCompare(b, "ms")).map(async (school) => {
          const summary = await searchStudents("", { school, limit: 1 });
          return {
            school,
            registered: summary.schoolRegisteredTotal ?? 0,
            notRegistered: summary.schoolNotRegisteredTotal ?? 0,
          };
        })
      );
    }
  } catch (err) {
    box.innerHTML = readErrorState(err, "Ringkasan utama");
    wireReadRetry(box, () => renderHome(root));
    return;
  }

  box.innerHTML = `
    <section class="card">
      <div class="card-head"><h2>Laporan Pendaftaran Tingkatan 1</h2></div>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Bilangan murid sudah daftar, belum daftar dan jumlah pelajar mengikut sekolah rendah</caption>
          <thead><tr><th scope="col">Sekolah Rendah</th><th scope="col">Bil. Sudah Daftar</th><th scope="col">Bil. Belum Daftar</th></tr></thead>
          <tbody>${schools.slice().sort((a, b) => a.localeCompare(b, "ms")).map((school) => {
            const row = (d.registrationBySchool ?? []).find((item) => item.school === school);
            return `<tr><th scope="row">${esc(school)}</th><td>${row?.registered ?? "—"}</td><td>${row?.notRegistered ?? "—"}</td></tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h2>Alat lain</h2></div>
      <ul class="tool-list">
        <li><a href="#/import">
          <span><span>Import Data</span><span class="tool-desc">Muat naik senarai murid dari fail Excel</span></span>
          <span aria-hidden="true">›</span>
        </a></li>
        <li><a href="#/barangan">
          <span><span>Barangan</span><span class="tool-desc">Senarai harga barangan koperasi</span></span>
          <span aria-hidden="true">›</span>
        </a></li>
        <li><a href="#/panduan">
          <span><span>Panduan</span><span class="tool-desc">Arahan ringkas untuk guru</span></span>
          <span aria-hidden="true">›</span>
        </a></li>
      </ul>
    </section>`;
}
