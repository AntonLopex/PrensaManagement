// ═══════════════════════════════
// CONFIG
// ═══════════════════════════════
let cfg = { sid: "", url: "", cost: 1, sell: 2 };
function loadCfg() {
  try {
    cfg = { ...cfg, ...JSON.parse(localStorage.getItem("srcalo") || "{}") };
  } catch (_) {}
}
function saveConf() {
  cfg.sid = q("ci-sid").value.trim();
  cfg.url = q("ci-url").value.trim();
  cfg.cost = parseFloat(q("ci-cost").value) || 1;
  cfg.sell = parseFloat(q("ci-sell").value) || 2;
  localStorage.setItem("srcalo", JSON.stringify(cfg));
  closeModal();
  toast("Configuración gardada", "ok");
  q("banner").style.display = "none";
  updatePP();
  if (cfg.sid) fetchAll();
}

// ═══════════════════════════════
// NAVIGATION
// ═══════════════════════════════
function go(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("on"));
  document.querySelectorAll(".ni").forEach((n) => n.classList.remove("on"));
  q("page-" + id).classList.add("on");
  q("nav-" + id).classList.add("on");
}

// ═══════════════════════════════
// LOCATION
// ═══════════════════════════════
let loc = "gasolinera";
function setLoc(l) {
  loc = l;
  q("bgas").className = "loc-btn" + (l === "gasolinera" ? " agas" : "");
  q("bbar").className = "loc-btn" + (l === "bar" ? " abar" : "");
  const v = q("edSel").value;
  if (v !== "new") prefill(v);
  else clearForm(false);
}

// ═══════════════════════════════
// EDITION SELECTOR
// ═══════════════════════════════
let editMode = false;

function populateSel() {
  const sel = q("edSel"),
    cur = sel.value;
  sel.innerHTML = '<option value="new">+ Nova edición</option>';
  const allEds = new Set();
  gasD.forEach((r) => allEds.add(parseFloat(r.ed)));
  barD.forEach((r) => allEds.add(parseFloat(r.ed)));
  const sorted = [...allEds].filter((n) => !isNaN(n)).sort((a, b) => a - b);
  sorted.forEach((ed) => {
    const hG = gasD.some((r) => parseFloat(r.ed) === ed);
    const hB = barD.some((r) => parseFloat(r.ed) === ed);
    const opt = document.createElement("option");
    opt.value = ed;
    opt.textContent =
      `Edición ${ed}  ` + (hG ? "⛽" : "") + " " + (hB ? "🍺" : "");
    sel.appendChild(opt);
  });
  // Próximas ediciones sin datos
  const maxEd = sorted.length ? Math.max(...sorted) : 0;
  for (let i = maxEd + 1; i <= maxEd + 3 && i <= 29; i++) {
    if (!allEds.has(i)) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `Edición ${i}  (nova)`;
      sel.appendChild(opt);
    }
  }
  if ([...sel.options].some((o) => o.value == cur)) sel.value = cur;
}

function onEdChange() {
  const v = q("edSel").value;
  if (v === "new") {
    editMode = false;
    clearForm(true);
    setBadge("new", null);
    q("edHint").className = "ed-hint";
  } else {
    editMode = true;
    const n = parseFloat(v);
    setBadge("edit", n);
    prefill(v);
    showHint(n);
  }
}

function prefill(edVal) {
  const n = parseFloat(edVal);
  const row =
    loc === "gasolinera"
      ? gasD.find((r) => parseFloat(r.ed) === n)
      : barD.find((r) => parseFloat(r.ed) === n);
  if (row) {
    fi("f-ent", row.ent, true);
    fi("f-vend", row.vend, true);
    fi("f-rec", row.rec, true);
  } else clearForm(false);
  calc();
}

function showHint(n) {
  const h = q("edHint");
  const prev = n - 1;
  if (prev >= 1) {
    h.innerHTML = `📦 Entregando ed.<strong> ${n}</strong> — as <strong>Vendidas</strong> e <strong>Recollidas</strong> solen ser da edición anterior (<strong>${prev}</strong>).`;
    h.className = "ed-hint show";
  } else h.className = "ed-hint";
}

function setBadge(mode, n) {
  const b = q("edBadge"),
    btn = q("sbtn");
  if (mode === "new") {
    b.className = "ed-badge new";
    b.textContent = "NOVA";
    btn.textContent = "GARDAR REXISTRO";
    btn.className = "sbtn";
  } else {
    b.className = "ed-badge edit";
    b.textContent = `ED. ${n}`;
    btn.textContent = "ACTUALIZAR EDICIÓN";
    btn.className = "sbtn editm";
  }
}

function fi(id, val, pre) {
  const el = q(id);
  el.value = val || "";
  el.className = "fi" + (pre && val ? " pre" : "");
}

function clearForm(resetBadge) {
  ["f-ent", "f-vend", "f-rec"].forEach((id) => {
    q(id).value = "";
    q(id).className = "fi";
  });
  if (resetBadge) setBadge("new", null);
  calc();
}

// ═══════════════════════════════
// CALC
// ═══════════════════════════════
function calc() {
  const ent = +q("f-ent").value || 0,
    vend = +q("f-vend").value || 0,
    rec = +q("f-rec").value || 0;
  const cost = ent * cfg.cost,
    ing = vend * cfg.sell,
    ben = ing - cost;
  const bal = ent - vend - rec;

  cv("cv-cost", ent ? (ent * cfg.cost).toFixed(2) + "€" : "—", ent);
  cv("cv-ing", vend ? (vend * cfg.sell).toFixed(2) + "€" : "—", vend);
  cv("cv-ben", ent ? ben.toFixed(2) + "€" : "—", ent);

  const bEl = q("cv-bal");
  if (ent) {
    bEl.textContent =
      bal === 0 ? "✓ Cadra" : bal > 0 ? `+${bal} pend.` : `${bal} extra`;
    bEl.className = "cb-v has";
    bEl.style.color =
      bal === 0 ? "var(--green)" : bal > 0 ? "var(--blue-l)" : "#E83A3A";
  } else {
    bEl.textContent = "—";
    bEl.className = "cb-v";
    bEl.style.color = "";
  }
}
function cv(id, val, has) {
  const e = q(id);
  e.textContent = val;
  e.className = "cb-v" + (has ? " has" : "");
}

// ═══════════════════════════════
// SUBMIT
// ═══════════════════════════════
async function doSubmit() {
  const edVal = q("edSel").value;
  const edNum = edVal === "new" ? getNextEd() : parseInt(edVal);
  const ent = q("f-ent").value.trim(),
    vend = q("f-vend").value.trim(),
    rec = q("f-rec").value.trim();
  if (!ent) {
    toast("Enche entregadas", "ko");
    return;
  }
  if (!cfg.sid) {
    toast("Configura o Sheet ID", "ko");
    openModal();
    return;
  }
  if (!cfg.url) {
    toast("Configura o Apps Script URL", "ko");
    openModal();
    return;
  }
  if (!edNum || edNum < 1 || edNum > 29) {
    toast("Edición inválida (1-29)", "ko");
    return;
  }
  const btn = q("sbtn");
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = editMode ? "ACTUALIZANDO..." : "GARDANDO...";
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        table: loc,
        edicion: edNum,
        entregadas: +ent,
        vendidas: +vend,
        recollidas: +rec,
      }),
    });
    console.log("Request sent successfully");
    toast(
      editMode ? `✓ Edición ${edNum} actualizada` : "✓ Rexistro gardado",
      "ok",
    );
    if (!editMode) clearForm(true);
    setTimeout(fetchAll, 1500);
  } catch (e) {
    console.error("Submit error:", e);
    toast("Error ao conectar con Apps Script: " + e.message, "ko");
  }
  btn.disabled = false;
  btn.textContent = orig;
}

function getNextEd() {
  const all = [...gasD, ...barD]
    .map((r) => parseFloat(r.ed))
    .filter((n) => !isNaN(n));
  return all.length ? Math.max(...all) + 1 : 1;
}

// Botón editar desde tabla
function editRow(edNum, tbl) {
  loc = tbl;
  q("bgas").className = "loc-btn" + (tbl === "gasolinera" ? " agas" : "");
  q("bbar").className = "loc-btn" + (tbl === "bar" ? " abar" : "");
  q("edSel").value = edNum;
  editMode = true;
  setBadge("edit", edNum);
  prefill(edNum);
  showHint(edNum);
  go("form");
  window.scrollTo({ top: 0, behavior: "smooth" });
  toast(
    `✏ Editando ed. ${edNum} — ${tbl === "gasolinera" ? "Gasolinera" : "Bar"}`,
    "",
  );
}

// ═══════════════════════════════
// FETCH
// ═══════════════════════════════
let gasD = [],
  barD = [];

async function gviz(range) {
  const url = `https://docs.google.com/spreadsheets/d/${cfg.sid}/gviz/tq?tqx=out:json&sheet=REVISTAS&range=${encodeURIComponent(range)}`;
  const r = await fetch(url);
  const txt = await r.text();
  return JSON.parse(txt.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "")).table;
}

function parseRows(table) {
  if (!table || !table.rows) return [];
  return table.rows
    .map((row) => {
      if (!row.c) return null;
      const v = row.c.map((c) => (c ? c.v : null));
      const [ed, ent, vend, rec] = v;
      if (ed === null && ent === null) return null;
      if (typeof ed === "string" && isNaN(+ed)) return null;
      if (ent === null && vend === null) return null;
      return {
        ed: ed != null ? String(ed).replace(/\.0$/, "") : "—",
        ent: +(ent || 0),
        vend: +(vend || 0),
        rec: +(rec || 0),
        ing: +(vend || 0) * cfg.sell,
        cost: +(ent || 0) * cfg.cost
      };
    })
    .filter(Boolean);
}

async function fetchAll() {
  if (!cfg.sid) {
    setStatus("");
    return;
  }
  setStatus("syncing");
  try {
    // Leer datos individuales (filas 6-34)
    const gasRaw = await gviz("B6:G34");
    const barRaw = await gviz("J6:O34");
    
    // Leer totales directamente de la fila 2
    const totalsRaw = await gviz("C2:F2");
    
    gasD = parseRows(gasRaw, false);
    barD = parseRows(barRaw, true);
    
    // Parsear totales de fila 2
    if (totalsRaw && totalsRaw.rows && totalsRaw.rows[0]) {
      const totVals = totalsRaw.rows[0].c || [];
      window.sheettotals = {
        prod: totVals[0]?.v || null,
        ing: totVals[1]?.v || null,
        gas: totVals[2]?.v || null,
        gan: totVals[3]?.v || null,
      };
    }
    
    renderGas();
    renderBar();
    renderRes();
    renderHero();
    populateSel();
    setStatus("live");
  } catch (e) {
    console.error(e);
    setStatus("err");
    toast("Error ao leer o Sheet. ¿Está compartido?", "ko");
    showEmpty();
  }
}

function showEmpty() {
  ["g-load", "b-load"].forEach((id) => (q(id).style.display = "none"));
  ["g-empty", "b-empty"].forEach((id) => (q(id).style.display = "block"));
}

// ═══════════════════════════════
// RENDER
// ═══════════════════════════════
function renderGas() {
  q("g-load").style.display = "none";
  if (!gasD.length) {
    q("g-tbl").style.display = "none";
    q("g-empty").style.display = "block";
  } else {
    q("g-empty").style.display = "none";
    q("g-tbl").style.display = "table";
    q("g-body").innerHTML = gasD
      .map(
        (r) => `
      <tr>
        <td class="edt-col"><button class="edt-btn" onclick="editRow(${r.ed},'gasolinera')" title="Editar">✏</button></td>
        <td><span class="eb">${r.ed}</span></td>
        <td>${r.ent}</td>
        <td><span class="pill ps">${r.vend}</span></td>
        <td>${r.rec > 0 ? `<span class="pill pr">${r.rec}</span>` : "—"}</td>
        <td class="ing">${r.ing.toFixed(2)}€</td>
      </tr>`,
      )
      .join("");
  }
  q("g-cnt").textContent = gasD.length + " edicións";
  const t = tot(gasD);
  q("g-ent").textContent = t.ent || "—";
  q("g-vend").textContent = t.vend || "—";
  q("g-rec").textContent = t.rec || "—";
  q("g-ing").textContent = t.ing ? t.ing.toFixed(0) + "€" : "—";
}

function renderBar() {
  q("b-load").style.display = "none";
  if (!barD.length) {
    q("b-tbl").style.display = "none";
    q("b-empty").style.display = "block";
  } else {
    q("b-empty").style.display = "none";
    q("b-tbl").style.display = "table";
    q("b-body").innerHTML = barD
      .map(
        (r) => `
      <tr>
        <td class="edt-col"><button class="edt-btn" onclick="editRow(${r.ed},'bar')" title="Editar">✏</button></td>
        <td><span class="eb">${r.ed}</span></td>
        <td>${r.ent}</td>
        <td><span class="pill ps">${r.vend}</span></td>
        <td>${r.rec > 0 ? `<span class="pill pr">${r.rec}</span>` : "—"}</td>
        <td class="ing">${r.ing.toFixed(2)}€</td>
      </tr>`,
      )
      .join("");
  }
  q("b-cnt").textContent = barD.length + " edicións";
  const t = tot(barD);
  q("b-ent").textContent = t.ent || "—";
  q("b-vend").textContent = t.vend || "—";
  q("b-rec").textContent = t.rec || "—";
  q("b-ing").textContent = t.ing ? t.ing.toFixed(0) + "€" : "—";
}

function renderRes() {
  const tg = tot(gasD),
    tb = tot(barD);
  let aEnt = tg.ent + tb.ent,
    aIng = tg.ing + tb.ing,
    aCst = tg.cost + tb.cost,
    gain = aIng - aCst;
  const mx = Math.max(gasD.length, barD.length);
  
  // If totals from sheet are available, use those instead
  if (window.sheettotals) {
    aEnt = window.sheettotals.prod || aEnt;
    aIng = window.sheettotals.ing || aIng;
    aCst = window.sheettotals.gas || aCst;
    gain = aIng - aCst;
  }
  
  q("r-prod").textContent = aEnt || "—";
  q("r-ed").textContent = mx || "—";
  q("r-ing").textContent = aIng ? aIng.toFixed(2) + "€" : "—";
  q("r-gas").textContent = aCst ? (aCst).toFixed(2) + "€" : "—";
  q("r-gan").textContent = aIng ? (gain).toFixed(2) + "€" : "—";
  q("r-gans").textContent =
    aIng > 0
      ? `Marxe do ${((gain / aIng) * 100).toFixed(0)}%`
      : "Sen datos suficientes";
  const m = Math.max(tg.vend, tb.vend) || 1;
  q("cmp-gv").textContent = `${tg.vend} vendidas`;
  q("cmp-bv").textContent = `${tb.vend} vendidas`;
  q("cmp-gb").style.width = `${(tg.vend / m) * 100}%`;
  q("cmp-bb").style.width = `${(tb.vend / m) * 100}%`;
  q("cfg-c").textContent = cfg.cost.toFixed(2);
  q("cfg-s").textContent = cfg.sell.toFixed(2);
}

function renderHero() {
  const tg = tot(gasD),
    tb = tot(barD);
  let aEnt = tg.ent + tb.ent,
    aIng = tg.ing + tb.ing,
    aCst = tg.cost + tb.cost;
  
  // If totals from sheet are available, use those instead
  if (window.sheettotals) {
    aEnt = window.sheettotals.prod || aEnt;
    aIng = window.sheettotals.ing || aIng;
    aCst = window.sheettotals.gas || aCst;
  }
  
  q("h-prod").textContent = aEnt || "—";
  q("h-ing").textContent = aIng ? aIng.toFixed(0) + "€" : "—";
  q("h-gas").textContent = aCst ? (aCst).toFixed(0)  + "€" : "—";
  q("h-gan").textContent = aIng ? (aIng - aCst).toFixed(0) + "€" : "—";
}

function tot(arr) {
  return arr.reduce(
    (a, r) => ({
      ent: a.ent + r.ent,
      vend: a.vend + r.vend,
      rec: a.rec + r.rec,
      ing: a.ing + r.ing,
      cost: a.cost + r.cost,
    }),
    { ent: 0, vend: 0, rec: 0, ing: 0, cost: 0 },
  );
}

// ═══════════════════════════════
// UTILS
// ═══════════════════════════════
function setStatus(s) {
  const d = q("dot"),
    l = q("syncLbl");
  d.className = "dot" + (s ? " " + s : "");
  l.textContent =
    { live: "EN LIÑA", syncing: "SYNC...", err: "ERROR", "": "CONFIG" }[s] ||
    "CONFIG";
}
function openModal() {
  q("ci-sid").value = cfg.sid;
  q("ci-url").value = cfg.url;
  q("ci-cost").value = cfg.cost;
  q("ci-sell").value = cfg.sell;
  q("ov").classList.add("on");
}
function closeModal() {
  q("ov").classList.remove("on");
}
function bgClose(e) {
  if (e.target === q("ov")) closeModal();
}
let _t;
function toast(msg, type) {
  clearTimeout(_t);
  const e = q("toast");
  e.textContent = msg;
  e.className = "toast " + (type || "");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => e.classList.add("on")),
  );
  _t = setTimeout(() => e.classList.remove("on"), 3200);
}
function q(id) {
  return document.getElementById(id);
}
function updatePP() {
  q("pp-c").textContent = cfg.cost.toFixed(2);
  q("pp-s").textContent = cfg.sell.toFixed(2);
}

function copyCode() {
  const codeBlock = q("code-apps-script");
  if (!codeBlock) return;
  
  const text = codeBlock.innerText;
  navigator.clipboard.writeText(text).then(() => {
    toast("✓ Código copiado ao portapapeis", "ok");
  }).catch(() => {
    toast("Error al copiar el código", "ko");
  });
}

// ═══════════════════════════════
// INIT
// ═══════════════════════════════
loadCfg();
updatePP();
if (!cfg.sid) {
  q("banner").style.display = "block";
  showEmpty();
  setStatus("");
} else fetchAll();
setInterval(() => {
  if (cfg.sid) fetchAll();
}, 60000);
