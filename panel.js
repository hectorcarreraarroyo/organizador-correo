/* Organizador de correo · panel.js
   Dibuja el panel a partir de window.DATA. No contiene datos ni envía nada a ningún sitio. */
(function () {
  const D = window.DATA || {};
  D.proyectos = D.proyectos || []; D.correos = D.correos || []; D.enlaces = D.enlaces || []; D.observaciones = D.observaciones || [];

  const FMT = {DOC:"#2B579A",XLS:"#217346",PPT:"#C43E1C",PDF:"#FF3B30",SITE:"#30B0C7",TEAMS:"#5856D6",FORM:"#34C759",APP:"#FF9500",WEB:"#8E8E93",LINK:"#AEAEB2"};
  const NOMBRE_FMT = {DOC:"Word",XLS:"Excel",PPT:"PowerPoint",PDF:"Adobe PDF",SITE:"SharePoint/OneDrive",TEAMS:"Reunión",FORM:"Formulario",APP:"Sistema interno",WEB:"Web externa",LINK:"Otro"};
  const TREND = {Sube:["▲ Sube","#248A3D"],Baja:["▼ Baja","#D70015"],Igual:["▬ Igual","#8E8E93"],Nuevo:["★ Nuevo","#007AFF"]};
  const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const PR = {Alta:0,Media:1,Baja:2};
  const st = {q:"", fmt:"Todos", proy:new Set(), orden:"fecha"};
  let hechos = {}; try { hechos = JSON.parse(localStorage.getItem("hechos_"+D.semana) || "{}"); } catch (e) {}

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const okUrl = u => typeof u === "string" && /^https?:\/\//i.test(u);
  const fdate = d => { if (!d) return "sin fecha"; const p = String(d).split("-"); return p.length < 3 ? esc(d) : (+p[2]) + " " + MES[+p[1]-1]; };
  const colorP = n => (D.proyectos.find(p => p.nombre === n) || {}).color || "#8E8E93";
  const ini = s => String(s || "?").replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "").trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase() || "?";
  const MAIL_SVG = '<svg width="14" height="11" viewBox="0 0 14 11"><rect x=".75" y=".75" width="12.5" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 1.8l5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const mail = (u, asunto) => okUrl(u)
    ? `<a class="mail" href="${esc(u)}" target="_blank" rel="noopener" title="Abrir el correo en Outlook">${MAIL_SVG}Correo</a>`
    : (asunto ? `<button class="mail cp" data-a="${esc(asunto)}" title="Copia el asunto para buscarlo en Outlook">${MAIL_SVG}Correo</button>` : "");
  const ic = f => `<div class="ic" style="background:${FMT[f] || FMT.LINK}">${esc(f || "LINK")}</div>`;
  const pill = p => `<span class="pill ${String(p||"Baja").toLowerCase()}">${esc(p||"Baja")}</span>`;
  const match = (txt) => !st.q || txt.toLowerCase().includes(st.q.toLowerCase());
  const inProy = n => !st.proy.size || st.proy.has(n);

  document.body.innerHTML = `
  <div class="wrap">
    <div class="eyebrow" id="periodo"></div>
    <h1>Organizador de correo</h1>
    <div class="widgets" id="widgets"></div>
    <div class="search">
      <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#8E8E93" stroke-width="1.8"/><path d="M11 11l3.5 3.5" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round"/></svg>
      <input id="q" type="search" placeholder="Buscar por asunto, remitente, título o dominio">
    </div>
    <div class="chips" id="chips"></div>

    <section><div class="sh"><h2>Requieren acción</h2><span id="nAct"></span></div><div class="list" id="acciones"></div></section>
    <section><div class="sh"><h2>Correos por proyecto</h2><span id="nMail"></span></div><div id="correos"></div></section>

    <section>
      <div class="sh"><h2>Enlaces</h2><span id="nLib"></span></div>
      <div><div class="seg" id="segFmt"></div>
        <select id="orden" aria-label="Ordenar"><option value="fecha">Más recientes</option><option value="veces">Más recibidos</option><option value="titulo">Título A–Z</option></select></div>
      <div class="card" style="margin-bottom:6px"><div class="stack" id="stack"></div><div class="legend" id="legend"></div></div>
      <div id="biblioteca"></div>
    </section>

    <section><div class="sh"><h2>Actividad por proyecto</h2></div><div class="list" id="actividad"></div></section>
    <footer id="pie"></footer>
  </div>`;
  const $ = id => document.getElementById(id);

  function cabecera() {
    $("periodo").textContent = (D.periodo || "") + (D.semana ? " · Semana " + D.semana : "");
    const nAct = D.correos.filter(c => c.prioridad === "Alta" || c.prioridad === "Media").length;
    $("widgets").innerHTML =
      `<div class="w"><div class="k">Correos</div><div class="v">${D.correos.length}</div></div>
       <div class="w red"><div class="k"><span class="dot" style="background:var(--red)"></span>Requieren acción</div><div class="v">${nAct}</div></div>
       <div class="w"><div class="k">Proyectos</div><div class="v">${D.proyectos.length}</div></div>
       <div class="w"><div class="k">Enlaces</div><div class="v">${D.enlaces.length}</div></div>`;
    $("chips").innerHTML = D.proyectos.map(p => {
      const n = D.correos.filter(c => c.proyecto === p.nombre).length;
      return `<button class="chip ${st.proy.has(p.nombre) ? "on" : ""}" data-p="${esc(p.nombre)}"><span class="dot" style="background:${esc(p.color)};margin:0"></span>${esc(p.nombre)} <em>${n}</em></button>`;
    }).join("");
    const fmts = ["Todos", ...Object.keys(FMT).filter(f => D.enlaces.some(e => e.formato === f))];
    $("segFmt").innerHTML = fmts.map(f => `<button data-f="${f}" class="${f === st.fmt ? "on" : ""}">${f}</button>`).join("");
  }

  function acciones() {
    const l = D.correos.filter(c => (c.prioridad === "Alta" || c.prioridad === "Media") && inProy(c.proyecto) && match([c.asunto,c.remitente,c.resumen,c.proyecto].join(" ")))
      .sort((a,b) => PR[a.prioridad]-PR[b.prioridad] || String(a.limite||"9").localeCompare(String(b.limite||"9")));
    $("nAct").textContent = l.length;
    $("acciones").innerHTML = l.length ? l.map(c => {
      const k = c.asunto + "|" + c.fecha, h = !!hechos[k];
      return `<div class="row act ${h ? "done" : ""}">
        <div class="chk ${h ? "on" : ""}" data-k="${esc(k)}" title="Marcar como hecho"></div>
        <div class="av" style="background:${colorP(c.proyecto)}">${esc(ini(c.remitente))}</div>
        <div style="min-width:0"><div class="t">${esc(c.asunto)}</div><div class="s">${esc(c.accion||"Revisar")} · ${esc(c.proyecto)} · ${esc(c.remitente)}</div></div>
        <div class="end">${mail(c.correo, c.asunto)}${pill(c.prioridad)}<span class="due">${fdate(c.limite)}</span></div></div>`;
    }).join("") : `<div class="empty">Nada pendiente con estos filtros</div>`;
  }

  function grupos(lista, render, cont, vacio) {
    const g = {}; lista.forEach(x => (g[x.proyecto] = g[x.proyecto] || []).push(x));
    const orden = D.proyectos.map(p => p.nombre).filter(n => g[n]).concat(Object.keys(g).filter(n => !D.proyectos.some(p => p.nombre === n)));
    $(cont).innerHTML = orden.length ? orden.map(n => `
      <details class="grp" open>
        <summary class="group-label"><span class="tw">›</span><span class="dot" style="background:${colorP(n)}"></span>${esc(n)} · ${g[n].length}</summary>
        <div class="list">${g[n].map(render).join("")}</div>
      </details>`).join("") : `<div class="list"><div class="empty">${vacio}</div></div>`;
  }

  function correos() {
    const l = D.correos.filter(c => inProy(c.proyecto) && match([c.asunto,c.remitente,c.resumen,c.proyecto].join(" ")))
      .sort((a,b) => String(b.fecha).localeCompare(String(a.fecha)));
    $("nMail").textContent = l.length + (l.length === 1 ? " correo" : " correos");
    grupos(l, c => `
      <div class="row mail-row">
        <div class="av" style="background:${colorP(c.proyecto)}">${esc(ini(c.remitente))}</div>
        <div style="min-width:0"><div class="t">${esc(c.asunto)}</div>
          <div class="s">${esc(c.remitente)} · ${fdate(c.fecha)}</div>
          ${c.resumen ? `<div class="s2">${esc(c.resumen)}</div>` : ""}</div>
        <div class="end">${c.enlaces > 0 ? `<span class="lk">${c.enlaces} ${c.enlaces === 1 ? "enlace" : "enlaces"}</span>` : ""}
          ${c.accion && c.accion !== "Ninguna" ? `<span class="acc">${esc(c.accion)}</span>` : ""}${mail(c.correo, c.asunto)}</div>
      </div>`, "correos", "No hay correos que coincidan con la búsqueda");
  }

  function enlaces() {
    const cmp = {fecha:(a,b)=>String(b.fecha).localeCompare(String(a.fecha)), veces:(a,b)=>(b.veces||1)-(a.veces||1), titulo:(a,b)=>String(a.titulo).localeCompare(String(b.titulo),"es")}[st.orden];
    const l = D.enlaces.filter(e => (st.fmt === "Todos" || e.formato === st.fmt) && inProy(e.proyecto) && match([e.titulo,e.remitente,e.dominio,e.proyecto].join(" "))).sort(cmp);
    $("nLib").textContent = l.length + (l.length === 1 ? " enlace" : " enlaces");
    const c = {}; l.forEach(e => c[e.formato] = (c[e.formato] || 0) + 1);
    const fm = Object.keys(c).sort((a,b) => c[b]-c[a]);
    $("stack").innerHTML = fm.map(f => `<div title="${f}: ${c[f]}" style="flex:${c[f]};background:${FMT[f]||FMT.LINK}"></div>`).join("") || `<div style="flex:1;background:var(--fill)"></div>`;
    $("legend").innerHTML = fm.map(f => `<span><span class="dot" style="background:${FMT[f]||FMT.LINK}"></span>${f} ${c[f]}</span>`).join("") || "Sin enlaces";
    grupos(l, e => {
      const u = okUrl(e.url) ? esc(e.url) : "#";
      return `<div class="row">
        ${ic(e.formato)}
        <a class="main" href="${u}" target="_blank" rel="noopener"><div class="t">${esc(e.titulo)}</div><div class="s"><span class="mono">${esc(e.dominio)}</span> · ${esc(e.remitente)} · ${fdate(e.fecha)}</div></a>
        <div class="end">${(e.veces||1) > 1 ? `<span class="badge">×${e.veces}</span>` : ""}${mail(e.correo, e.asunto)}<a class="open" href="${u}" target="_blank" rel="noopener">Abrir ›</a></div>
      </div>`;
    }, "biblioteca", "No hay enlaces que coincidan");
  }

  function actividad() {
    const max = Math.max(1, ...D.proyectos.map(p => p.correos || 0));
    $("actividad").innerHTML = D.proyectos.map(p => { const t = TREND[p.tendencia] || ["",""]; return `
      <div class="prow"><span>${esc(p.nombre)}</span><div class="bar"><div style="width:${(p.correos||0)/max*100}%;background:${esc(p.color)}"></div></div>
      <b>${p.correos||0}</b><span class="x" style="color:${t[1]}">${t[0]}</span><span class="sum">${esc(p.resumen)}</span></div>`; }).join("") || `<div class="empty">Sin proyectos</div>`;
    $("pie").innerHTML = Object.keys(NOMBRE_FMT).map(f => f + " " + NOMBRE_FMT[f]).join(" · ") +
      (D.observaciones.length ? "<br>Observaciones: " + D.observaciones.map(esc).join(" · ") : "") +
      "<br>Generado el " + esc(D.generado || "");
  }

  function pintar() { acciones(); correos(); enlaces(); }

  $("q").oninput = e => { st.q = e.target.value; pintar(); };
  $("orden").onchange = e => { st.orden = e.target.value; enlaces(); };
  $("chips").onclick = ev => { const b = ev.target.closest("button"); if (!b) return; const p = b.dataset.p; st.proy.has(p) ? st.proy.delete(p) : st.proy.add(p); cabecera(); pintar(); };
  $("segFmt").onclick = ev => { const b = ev.target.closest("button"); if (!b) return; st.fmt = b.dataset.f; cabecera(); enlaces(); };
  $("acciones").onclick = ev => {
    const c = ev.target.closest(".chk"); if (!c) return;
    const k = c.dataset.k; hechos[k] = !hechos[k];
    try { localStorage.setItem("hechos_" + D.semana, JSON.stringify(hechos)); } catch (e) {}
    acciones();
  };
  const toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast);
  let tt;
  document.addEventListener("click", ev => {
    const b = ev.target.closest(".cp"); if (!b) return;
    ev.preventDefault();
    const a = b.dataset.a;
    const done = () => { toast.innerHTML = "<b>Asunto copiado</b><br>En Outlook pulsa <b>Ctrl+E</b>, pega con <b>Ctrl+V</b> y pulsa Intro."; toast.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("on"), 4500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(a).then(done, () => { prompt("Copia el asunto (Ctrl+C):", a); });
    else prompt("Copia el asunto (Ctrl+C):", a);
  });
  cabecera(); actividad(); pintar();
})();
