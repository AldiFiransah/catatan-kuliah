"use strict";
var KEY = "catatan-kuliah-v1";
var CATS = ["Makan", "Transport", "Kuliah", "Kuota/Pulsa", "Hiburan", "Lainnya"];

var TYPES = {
  notes: { label: "Catatan", fields: [
    { k: "title", l: "Judul", req: 1 },
    { k: "content", l: "Isi catatan", t: "area" } ] },
  materi: { label: "Materi Dosen", fields: [
    { k: "course", l: "Mata kuliah" },
    { k: "lecturer", l: "Dosen" },
    { k: "title", l: "Judul materi", req: 1 },
    { k: "content", l: "Ringkasan / isi materi", t: "area" } ] },
  links: { label: "Link Materi", fields: [
    { k: "title", l: "Judul" },
    { k: "url", l: "Link (https://...)", t: "url", req: 1 },
    { k: "course", l: "Mata kuliah" } ] },
  expenses: { label: "Pengeluaran", fields: [
    { k: "date", l: "Tanggal", t: "date", req: 1 },
    { k: "amount", l: "Nominal (Rp)", t: "number", req: 1 },
    { k: "cat", l: "Kategori", t: "select" },
    { k: "note", l: "Keterangan" } ] }
};

var data = load();
var current = "notes";
var $ = function (id) { return document.getElementById(id); };

function load() {
  var d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  Object.keys(TYPES).forEach(function (t) { if (!Array.isArray(d[t])) d[t] = []; });
  return d;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); $("status").textContent = "Tersimpan otomatis di browser ini."; }
  catch (e) { $("status").textContent = "Gagal menyimpan. Penyimpanan browser penuh atau diblokir."; }
}
function esc(s) {
  var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML;
}
function rupiah(n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }
function today() { return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
function fmtDate(s) {
  var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : "https://" + u; }

function renderTabs() {
  $("tabs").innerHTML = Object.keys(TYPES).map(function (t) {
    return '<button type="button" role="tab" data-t="' + t + '" aria-selected="' + (t === current) + '">' +
      TYPES[t].label + "<span>" + data[t].length + "</span></button>";
  }).join("");
}

function renderForm() {
  var html = TYPES[current].fields.map(function (f) {
    var inner;
    if (f.t === "area") inner = '<textarea name="' + f.k + '"></textarea>';
    else if (f.t === "select") inner = '<select name="' + f.k + '">' + CATS.map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select>";
    else inner = '<input name="' + f.k + '" type="' + (f.t || "text") + '"' + (f.t === "number" ? ' min="0" step="100" inputmode="numeric"' : "") + (f.t === "date" ? ' value="' + today() + '"' : "") + ">";
    var wide = f.t === "area" || f.k === "title" || f.k === "url" || (current === "links" && f.k === "course");
    return '<label class="f' + (wide ? " wide" : "") + '">' + f.l + (f.req ? " *" : "") + inner + "</label>";
  }).join("");
  $("form").innerHTML = "<h2>Tambah " + TYPES[current].label.toLowerCase() + "</h2>" + html + '<button type="submit">Simpan</button>';
  TYPES[current].fields.forEach(function (f) {
    if (f.req) $("form").elements[f.k].required = true;
  });
}

function renderSummary() {
  var box = $("summary");
  if (current !== "expenses") { box.hidden = true; return; }
  var list = data.expenses, total = 0, last14 = 0, n14 = 0, byDay = {}, byCat = {};
  var start = new Date(); start.setDate(start.getDate() - 13);
  var from = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  list.forEach(function (e) {
    total += e.amount;
    byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
    if (e.date >= from && e.date <= today()) { last14 += e.amount; n14++; byDay[e.date] = (byDay[e.date] || 0) + e.amount; }
  });
  var top = Object.keys(byDay).sort(function (a, b) { return byDay[b] - byDay[a]; })[0];
  var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; })
    .map(function (c) { return '<span class="chip">' + esc(c) + "<b>" + rupiah(byCat[c]) + "</b></span>"; }).join("");
  box.hidden = false;
  box.innerHTML = '<div class="stats">' +
    '<div class="tile main"><span>14 hari terakhir</span><b>' + rupiah(last14) + "</b><small>" + n14 + " catatan</small></div>" +
    '<div class="tile"><span>Rata-rata per hari</span><b>' + rupiah(last14 / 14) + "</b><small>dibagi 14 hari</small></div>" +
    '<div class="tile"><span>Hari paling boros</span><b>' + (top ? rupiah(byDay[top]) : "-") + "</b><small>" + (top ? fmtDate(top) : "belum ada data") + "</small></div>" +
    '<div class="tile"><span>Total semua data</span><b>' + rupiah(total) + "</b><small>" + list.length + " catatan</small></div></div>" +
    (cats ? '<div class="chips">' + cats + "</div>" : "");
}

function itemHTML(it) {
  var h = '<div class="item t-' + current + '">';
  if (current === "expenses") {
    h += '<div class="meta">' + esc(fmtDate(it.date)) + " · " + esc(it.cat) + '</div><div class="amount">' + rupiah(it.amount) + "</div>";
    if (it.note) h += "<p>" + esc(it.note) + "</p>";
  } else if (current === "links") {
    var u = safeUrl(it.url);
    h += "<h3>" + esc(it.title || it.url) + "</h3>" + (it.course ? '<div class="meta">' + esc(it.course) + "</div>" : "") +
      '<p><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + "</a></p>";
  } else {
    h += "<h3>" + esc(it.title) + "</h3>";
    var meta = [it.course, it.lecturer].filter(Boolean).join(" · ");
    if (meta) h += '<div class="meta">' + esc(meta) + "</div>";
    if (it.content) h += "<p>" + esc(it.content) + "</p>";
  }
  return h + '<button type="button" class="del" data-id="' + it.id + '">Hapus</button></div>';
}

function renderList() {
  var q = $("search").value.toLowerCase();
  var list = data[current].slice().reverse();
  if (current === "expenses") list.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  list = list.filter(function (it) { return JSON.stringify(it).toLowerCase().indexOf(q) > -1; });
  $("list").innerHTML = list.length ? list.map(itemHTML).join("") : '<div class="empty">Belum ada data. Isi formulir di atas lalu tekan Simpan.</div>';
}

function render() { renderTabs(); renderSummary(); renderList(); }
function switchTab(t) { current = t; $("search").value = ""; renderForm(); render(); }

$("tabs").addEventListener("click", function (e) {
  var b = e.target.closest("button"); if (b) switchTab(b.dataset.t);
});
$("form").addEventListener("submit", function (e) {
  e.preventDefault();
  var it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  TYPES[current].fields.forEach(function (f) {
    var v = $("form").elements[f.k].value.trim();
    it[f.k] = f.t === "number" ? Number(v) : v;
  });
  data[current].push(it); save();
  renderForm(); render();
});
$("list").addEventListener("click", function (e) {
  var b = e.target.closest(".del"); if (!b) return;
  if (!confirm("Hapus data ini? Tindakan ini tidak bisa dibatalkan.")) return;
  data[current] = data[current].filter(function (x) { return x.id !== b.dataset.id; });
  save(); render();
});
$("search").addEventListener("input", renderList);

$("export").addEventListener("click", function () {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "cadangan-catatan-kuliah-" + today() + ".json";
  a.click(); URL.revokeObjectURL(a.href);
});
$("import").addEventListener("change", function (e) {
  var f = e.target.files[0]; if (!f) return;
  var r = new FileReader();
  r.onload = function () {
    try {
      var d = JSON.parse(r.result);
      if (typeof d !== "object" || !d) throw 0;
      if (!confirm("Impor akan menggantikan semua data saat ini. Lanjutkan?")) return;
      Object.keys(TYPES).forEach(function (t) { data[t] = Array.isArray(d[t]) ? d[t] : []; });
      save(); render();
    } catch (err) { alert("File cadangan tidak valid."); }
  };
  r.readAsText(f); e.target.value = "";
});

renderForm(); render();
