import { apiFetch } from "../shared/api.js";
import { formatRM } from "../shared/money.js";
import { esc, formatDate, formatTime } from "../shared/dom.js";
import { paymentLabel } from "../features/e-resit/constants.js";
import { loadingState, readErrorState, wireReadRetry } from "../shared/feedback.js";

/* Home.
   Opens with the two things staff actually come here to do, then shows the
   state of registration day. Numbers support the tasks; they do not lead. */

const getDashboard = () => apiFetch("/api/dashboard");

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

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
  } catch (err) {
    box.innerHTML = readErrorState(err, "Ringkasan utama");
    wireReadRetry(box, () => renderHome(root));
    return;
  }

  const registered = d.registeredStudents ?? 0;
  const notRegistered = d.notRegisteredStudents ?? 0;
  const total = registered + notRegistered;
  const percent = pct(registered, total);

  box.innerHTML = `
    <div class="home-grid">
      <section class="card">
        <div class="card-head">
          <h2>Kemajuan pendaftaran</h2>
          <span class="pill ${percent === 100 ? "ok" : "brand"}">${percent}% selesai</span>
        </div>

        <div class="meter-row" style="margin-bottom:var(--s4)">
          <div class="meter" role="img" aria-label="${percent}% murid sudah daftar">
            <span style="width:${percent}%"></span>
          </div>
        </div>

        <div class="stats cols-2">
          <div class="stat">
            <span class="stat-label">Sudah daftar</span>
            <strong class="stat-value">${registered}</strong>
            <span class="stat-note">daripada ${total} murid</span>
          </div>
          <div class="stat">
            <span class="stat-label">Belum daftar</span>
            <strong class="stat-value">${notRegistered}</strong>
            <span class="stat-note">masih menunggu</span>
          </div>
          <div class="stat">
            <span class="stat-label">Didaftarkan hari ini</span>
            <strong class="stat-value">${d.registeredTodayCount ?? 0}</strong>
            <span class="stat-note">sejak awal hari</span>
          </div>
          <div class="stat">
            <span class="stat-label">Ahli koperasi</span>
            <strong class="stat-value">${d.koperasiStudents ?? 0}</strong>
            <span class="stat-note">telah membayar keahlian</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Jualan hari ini</h2>
          <a class="btn secondary sm" href="#/laporan-koperasi">Lihat laporan</a>
        </div>
        <div class="stats cols-2" style="margin-bottom:var(--s4)">
          <div class="stat">
            <span class="stat-label">Jumlah kutipan</span>
            <strong class="stat-value">${formatRM(d.todayTotalSen ?? 0)}</strong>
            <span class="stat-note">${d.todayCount ?? 0} resit hari ini</span>
          </div>
        </div>
        <h3 style="font-size:1rem;margin-bottom:var(--s2)">Resit terkini</h3>
        ${(d.recent ?? []).length ? `
          <ul class="receipt-mini">
            ${(d.recent ?? []).map((r) => `
              <li>
                <a href="#/resit/${esc(r.receiptId)}">
                  <span>
                    <span class="rm-name">${esc(r.studentNameSnapshot)}</span>
                    <span class="rm-meta">${esc(r.receiptNo)} · ${esc(formatDate(r.createdAt))} ·
                      ${esc(paymentLabel(r.paymentMethod))}</span>
                  </span>
                  <strong class="num">${formatRM(r.totalSen)}</strong>
                </a>
              </li>`).join("")}
          </ul>` : `<p class="muted tiny">Belum ada resit hari ini.</p>`}
      </section>
    </div>

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
