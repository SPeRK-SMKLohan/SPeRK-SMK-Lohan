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
    </div>

    <div class="task-grid">
      <a class="task-card" href="#/pendaftaran">
        <span class="task-title">Pendaftaran Tingkatan 1</span>
        <span class="task-desc">Cari murid dan tandakan kehadiran.</span>
        <span class="task-go">Buka →</span>
      </a>
      <a class="task-card" href="#/jana-resit">
        <span class="task-title">Resit koperasi</span>
        <span class="task-desc">Pilih murid, barangan dan bayaran.</span>
        <span class="task-go">Buka →</span>
      </a>
    </div>

    <div id="home-data">${loadingState("Memuatkan ringkasan…")}</div>`;

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
      <div class="card-head"><h2>Ringkasan pendaftaran</h2></div>
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Bilangan murid sudah dan belum daftar mengikut sekolah rendah</caption>
          <thead><tr><th scope="col">Sekolah</th><th scope="col">Sudah daftar</th><th scope="col">Belum daftar</th></tr></thead>
          <tbody>${schools.slice().sort((a, b) => a.localeCompare(b, "ms")).map((school) => {
            const row = (d.registrationBySchool ?? []).find((item) => item.school === school);
            return `<tr><th scope="row">${esc(school)}</th><td>${row?.registered ?? "—"}</td><td>${row?.notRegistered ?? "—"}</td></tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>`;
}
