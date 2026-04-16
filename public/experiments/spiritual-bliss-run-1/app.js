// spiritual-bliss-run conversation viewer
// Loads window.RUN_DATA populated by data.js (built by build_data.py).

(function () {
  const data = window.RUN_DATA;
  if (!data) { document.body.innerHTML = "<p style='padding:20px'>data.js missing. Run <code>python3 web/build_data.py</code>.</p>"; return; }

  const emails  = data.emails  || [];
  const agents  = data.agents  || [];
  const media   = data.media   || [];
  const codex   = data.codex   || [];
  const writes  = data.writes  || [];
  const bash    = data.bash    || [];
  const psyche  = data.psyche  || [];

  // ---------- state ----------
  const state = {
    tab: "emails",
    selectedAgent: null,
    humanOnly: false,
    search: "",
  };

  // ---------- header counters ----------
  document.getElementById("email-count").textContent = emails.length;
  document.getElementById("media-count").textContent = media.length;
  document.getElementById("codex-count").textContent = codex.length;
  document.getElementById("bash-count").textContent  = bash.length;

  // ---------- helpers ----------
  function agentKind(name) {
    const a = agents.find(x => x.name === name);
    return a ? a.kind : "external";
  }
  function escapeHTML(s) {
    return (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function formatMin(t) {
    if (t === null || t === undefined) return "";
    if (t < 60) return `${t.toFixed(1)}m`;
    const h = Math.floor(t / 60);
    const m = Math.round(t - h * 60);
    return `${h}h${String(m).padStart(2, "0")}m`;
  }
  function matchesFilter(entry, fields = ["content", "message", "subject", "cmd", "path", "prompt", "title"]) {
    if (state.selectedAgent && entry.from && entry.from !== state.selectedAgent) return false;
    if (state.humanOnly && entry.to) {
      const dests = [...(entry.to||[]), ...(entry.cc||[]), ...(entry.bcc||[])];
      if (!dests.includes("human")) return false;
    }
    if (state.humanOnly && !entry.to) return false;  // non-email entries can't be "to human"
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = fields.map(f => String(entry[f] || "")).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  // ---------- agent sidebar ----------
  const agentList = document.getElementById("agent-list");
  function renderAgents() {
    agentList.innerHTML = "";
    const groups = [
      ["time-aware (ta)", agents.filter(a => a.kind === "ta")],
      ["time veil (nta)", agents.filter(a => a.kind === "nta")],
      ["external",        agents.filter(a => a.kind === "external")],
    ];
    for (const [label, list] of groups) {
      if (!list.length) continue;
      const h = document.createElement("div");
      h.className = "agent-group-header";
      h.textContent = label;
      agentList.appendChild(h);
      for (const a of list) {
        const row = document.createElement("div");
        row.className = "agent-row" + (state.selectedAgent === a.name ? " active" : "");
        const toolsSummary = a.kind === "external" ? "" : `${a.tool_total} tools`;
        row.innerHTML = `
          <span class="agent-dot ${a.kind}"></span>
          <span class="agent-name">${a.name}</span>
          <span class="agent-stat">${a.sent}↑ ${a.received}↓</span>`;
        row.title = toolsSummary
          ? `${a.name} · ${a.sent} sent, ${a.received} received · ${toolsSummary}: ${
              Object.entries(a.tools).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k}:${v}`).join(", ")
            }`
          : `${a.name}`;
        row.addEventListener("click", () => {
          state.selectedAgent = state.selectedAgent === a.name ? null : a.name;
          state.humanOnly = false;
          updateButtonStates();
          renderAll();
        });
        agentList.appendChild(row);
      }
    }
  }

  // ---------- content list ----------
  const contentList  = document.getElementById("content-list");
  const threadsTitle = document.getElementById("threads-title");

  function filterTitle(base) {
    let t = base;
    if (state.humanOnly) t += " — to human";
    else if (state.selectedAgent) t += ` — ${state.selectedAgent}`;
    if (state.search) t += ` — search: "${state.search}"`;
    return t;
  }

  const TAB_RENDERERS = {
    emails: renderEmails,
    media:  renderMedia,
    codex:  renderCodex,
    writes: renderWrites,
    bash:   renderBash,
    psyche: renderPsyche,
  };

  function renderContent() {
    contentList.innerHTML = "";
    TAB_RENDERERS[state.tab]();
  }

  function renderEmails() {
    const matched = emails.filter(e => matchesFilter({
      from: e.from, to: e.to, cc: e.cc, bcc: e.bcc,
      subject: e.subject, message: e.message,
    }));
    threadsTitle.textContent = filterTitle("Emails") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No emails match.");

    for (const e of matched) {
      const fromKind = agentKind(e.from);
      const recipients = [...e.to, ...e.cc, ...e.bcc];
      const recipientsHTML = recipients.map(r => `<span class="recipient">${r}</span>`).join(" ");
      const isLong = e.message.length > 600;
      const card = document.createElement("div");
      card.className = "email";
      card.innerHTML = `
        <div class="email-header">
          <span class="email-from ${fromKind}">${e.from}</span>
          <span class="email-arrow">→</span>
          <span class="email-to">${recipientsHTML}</span>
          <span class="email-time">+${formatMin(e.t_min)}</span>
        </div>
        <div class="email-subject">${escapeHTML(e.subject || "(no subject)")}</div>
        <div class="email-body ${isLong ? "" : "short"}">${escapeHTML(e.message)}</div>
        ${isLong ? '<div class="email-expand">show full message ▾</div>' : ""}
      `;
      const body = card.querySelector(".email-body");
      const expander = card.querySelector(".email-expand");
      if (expander) {
        expander.addEventListener("click", () => {
          const on = body.classList.toggle("expanded");
          expander.textContent = on ? "collapse ▴" : "show full message ▾";
        });
      }
      contentList.appendChild(card);
    }
  }

  function renderMedia() {
    const matched = media.filter(m => matchesFilter({ from: m.from, prompt: m.prompt }));
    threadsTitle.textContent = filterTitle("Media") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No media match. (Only ta_03 and ta_09 drew.)");

    for (const m of matched) {
      const kind = agentKind(m.from);
      const card = document.createElement("div");
      card.className = "media-card";
      card.innerHTML = `
        <div class="log-head">
          <span class="pill-agent ${kind}">${m.from}</span>
          <span class="action">drew ${m.aspect || ""} image</span>
          <span class="t">+${formatMin(m.t_min)}</span>
        </div>
        ${m.path ? `<img src="${m.path}" alt="image by ${m.from}">` : '<div class="empty" style="padding:20px">image not found on disk</div>'}
        <div class="media-prompt">${escapeHTML(m.prompt)}</div>
        ${m.reasoning ? `<div class="media-reasoning"><strong>reasoning:</strong> ${escapeHTML(m.reasoning)}</div>` : ""}
      `;
      contentList.appendChild(card);
    }
  }

  function renderCodex() {
    const matched = codex.filter(c => matchesFilter({ from: c.from, title: c.title, content: c.content }));
    threadsTitle.textContent = filterTitle("Codex deposits") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No codex entries match.");

    for (const c of matched) {
      const kind = agentKind(c.from);
      const card = document.createElement("div");
      card.className = "codex-card";
      card.innerHTML = `
        <div class="log-head">
          <span class="pill-agent ${kind}">${c.from}</span>
          <span class="action">codex · submit</span>
          <span class="t">+${formatMin(c.t_min)}</span>
        </div>
        <div class="codex-title">${escapeHTML(c.title)}</div>
        <div class="codex-content">${escapeHTML(c.content)}</div>
        <div class="email-expand">show full ▾</div>
      `;
      const body = card.querySelector(".codex-content");
      const expander = card.querySelector(".email-expand");
      expander.addEventListener("click", () => {
        const on = body.classList.toggle("expanded");
        expander.textContent = on ? "collapse ▴" : "show full ▾";
      });
      contentList.appendChild(card);
    }
  }

  function renderWrites() {
    const matched = writes.filter(w => matchesFilter({ from: w.from, path: w.path, content: w.content }));
    threadsTitle.textContent = filterTitle("Shared writes (.library, README, SKILL.md)") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No shared writes match.");

    for (const w of matched) {
      const kind = agentKind(w.from);
      const short = w.path.replace("/Users/huangzesen/work/lingtai-experiments/spiritual-bliss-run", "");
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.innerHTML = `
        <div class="log-head">
          <span class="pill-agent ${kind}">${w.from}</span>
          <span class="action">wrote</span>
          <strong>${escapeHTML(short)}</strong>
          <span class="t">+${formatMin(w.t_min)}</span>
        </div>
        <pre>${escapeHTML(w.content)}</pre>
        <div class="email-expand">show full ▾</div>
      `;
      const pre = entry.querySelector("pre");
      const expander = entry.querySelector(".email-expand");
      expander.addEventListener("click", () => {
        const on = pre.classList.toggle("expanded");
        expander.textContent = on ? "collapse ▴" : "show full ▾";
      });
      contentList.appendChild(entry);
    }
  }

  function renderBash() {
    const matched = bash.filter(b => matchesFilter({ from: b.from, cmd: b.cmd }));
    threadsTitle.textContent = filterTitle("Bash commands") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No bash commands match.");

    for (const b of matched) {
      const kind = agentKind(b.from);
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.innerHTML = `
        <div class="log-head">
          <span class="pill-agent ${kind}">${b.from}</span>
          <span class="action">bash</span>
          <span class="t">+${formatMin(b.t_min)}</span>
        </div>
        <pre>${escapeHTML(b.cmd)}</pre>
      `;
      contentList.appendChild(entry);
    }
  }

  function renderPsyche() {
    const matched = psyche.filter(p => matchesFilter({ from: p.from, content: p.content, action: p.action, target: p.target }));
    threadsTitle.textContent = filterTitle("Psyche edits (identity + pad)") + `  (${matched.length})`;
    if (!matched.length) return renderEmpty("No psyche events match.");

    for (const p of matched) {
      const kind = agentKind(p.from);
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.innerHTML = `
        <div class="log-head">
          <span class="pill-agent ${kind}">${p.from}</span>
          <span class="action">psyche · ${escapeHTML(p.action)}${p.target ? " · " + escapeHTML(p.target) : ""}</span>
          <span class="t">+${formatMin(p.t_min)}</span>
        </div>
        <pre>${escapeHTML(p.content)}</pre>
        ${p.content && p.content.length > 400 ? '<div class="email-expand">show full ▾</div>' : ""}
      `;
      const pre = entry.querySelector("pre");
      const expander = entry.querySelector(".email-expand");
      if (expander) {
        expander.addEventListener("click", () => {
          const on = pre.classList.toggle("expanded");
          expander.textContent = on ? "collapse ▴" : "show full ▾";
        });
      }
      contentList.appendChild(entry);
    }
  }

  function renderEmpty(msg) {
    const d = document.createElement("div");
    d.className = "empty";
    d.textContent = msg;
    contentList.appendChild(d);
  }

  // ---------- network graph ----------
  const svg = document.getElementById("net-svg");
  const NS = "http://www.w3.org/2000/svg";

  function buildNetwork() {
    const edgeMap = new Map();
    for (const e of emails) {
      for (const dst of [...e.to, ...e.cc, ...e.bcc]) {
        const key = `${e.from}→${dst}`;
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      }
    }
    const edges = [...edgeMap.entries()].map(([k, n]) => {
      const [src, dst] = k.split("→");
      return { src, dst, n };
    });
    const maxN = Math.max(...edges.map(e => e.n), 1);

    const W = 520, H = 520;
    const ta  = agents.filter(a => a.kind === "ta").map(a => a.name).sort();
    const nta = agents.filter(a => a.kind === "nta").map(a => a.name).sort();
    const ext = agents.filter(a => a.kind === "external").map(a => a.name).sort();
    const pos = {};
    const R = 150;
    const cxL = W * 0.3, cxR = W * 0.7, cy = H * 0.58;
    ta.forEach((n, i) => {
      const t = Math.PI * 0.5 + Math.PI * i / Math.max(1, ta.length - 1);
      pos[n] = [cxL + R * Math.cos(t), cy + R * Math.sin(t)];
    });
    nta.forEach((n, i) => {
      const t = Math.PI * 0.5 - Math.PI * i / Math.max(1, nta.length - 1);
      pos[n] = [cxR + R * Math.cos(t), cy + R * Math.sin(t)];
    });
    ext.forEach((n, i) => {
      const x = W / 2 + (i - (ext.length - 1) / 2) * 90;
      pos[n] = [x, 40];
    });

    const totalDeg = {};
    agents.forEach(a => totalDeg[a.name] = a.sent + a.received);
    const maxDeg = Math.max(...Object.values(totalDeg), 1);

    svg.innerHTML = "";

    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#888"/>
      </marker>
    `;
    svg.appendChild(defs);

    const edgeGroup = document.createElementNS(NS, "g");
    svg.appendChild(edgeGroup);
    for (const e of edges) {
      const [x1, y1] = pos[e.src] || [0, 0];
      const [x2, y2] = pos[e.dst] || [0, 0];
      if (!pos[e.src] || !pos[e.dst]) continue;
      const dx = x2 - x1, dy = y2 - y1;
      const mx = (x1 + x2) / 2 + dy * 0.08;
      const my = (y1 + y2) / 2 - dx * 0.08;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
      path.setAttribute("class", "edge");
      path.dataset.src = e.src;
      path.dataset.dst = e.dst;
      const strength = e.n / maxN;
      path.setAttribute("stroke", "#888");
      path.setAttribute("stroke-width", 0.6 + 4 * strength);
      path.setAttribute("stroke-opacity", 0.25 + 0.55 * strength);
      path.setAttribute("marker-end", "url(#arrow)");
      path.addEventListener("click", () => {
        state.selectedAgent = e.src;
        state.humanOnly = false;
        renderAll();
      });
      const title = document.createElementNS(NS, "title");
      title.textContent = `${e.src} → ${e.dst} · ${e.n} email${e.n > 1 ? "s" : ""}`;
      path.appendChild(title);
      edgeGroup.appendChild(path);
    }

    const nodeGroup = document.createElementNS(NS, "g");
    svg.appendChild(nodeGroup);
    for (const a of agents) {
      if (!pos[a.name]) continue;
      const [x, y] = pos[a.name];
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "node");
      g.setAttribute("transform", `translate(${x},${y})`);
      g.dataset.name = a.name;

      const vol = totalDeg[a.name] || 0;
      const r = 6 + 16 * (vol / maxDeg);

      let shape;
      if (a.kind === "external") {
        shape = document.createElementNS(NS, "rect");
        shape.setAttribute("x", -r); shape.setAttribute("y", -r);
        shape.setAttribute("width", 2 * r); shape.setAttribute("height", 2 * r);
        shape.setAttribute("fill", "#bbb"); shape.setAttribute("stroke", "#555");
      } else {
        shape = document.createElementNS(NS, "circle");
        shape.setAttribute("r", r);
        shape.setAttribute("fill", a.kind === "ta" ? "#4a90d9" : "#f0943b");
        shape.setAttribute("stroke", a.kind === "ta" ? "#1f4e79" : "#994f00");
      }
      shape.setAttribute("stroke-width", 1.2);
      g.appendChild(shape);

      const t = document.createElementNS(NS, "text");
      t.setAttribute("y", r + 10);
      t.setAttribute("text-anchor", "middle");
      t.textContent = a.name;
      g.appendChild(t);

      const title = document.createElementNS(NS, "title");
      const toolsStr = Object.entries(a.tools || {}).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k}:${v}`).join(", ");
      title.textContent = `${a.name} · ${a.sent} sent · ${a.received} received${toolsStr ? " · " + toolsStr : ""}`;
      g.appendChild(title);

      g.addEventListener("click", () => {
        state.selectedAgent = state.selectedAgent === a.name ? null : a.name;
        state.humanOnly = false;
        renderAll();
      });
      nodeGroup.appendChild(g);
    }
  }

  function updateNetworkHighlight() {
    const sel = state.selectedAgent;
    for (const n of svg.querySelectorAll(".node")) {
      n.classList.toggle("selected", n.dataset.name === sel);
      n.classList.toggle("dim", sel && n.dataset.name !== sel && !edgeTouches(n.dataset.name, sel));
    }
    for (const e of svg.querySelectorAll(".edge")) {
      e.classList.toggle("dim", sel && e.dataset.src !== sel && e.dataset.dst !== sel);
    }
  }

  const incidence = new Map();
  function buildIncidence() {
    for (const e of emails) {
      for (const dst of [...e.to, ...e.cc, ...e.bcc]) {
        const k1 = e.from, k2 = dst;
        if (!incidence.has(k1)) incidence.set(k1, new Set());
        if (!incidence.has(k2)) incidence.set(k2, new Set());
        incidence.get(k1).add(k2);
        incidence.get(k2).add(k1);
      }
    }
  }
  function edgeTouches(a, b) {
    if (!a || !b) return false;
    return incidence.get(b)?.has(a) || false;
  }

  // ---------- controls ----------
  const btnAll = document.getElementById("btn-all");
  const btnNta05 = document.getElementById("btn-nta05");
  const btnHuman = document.getElementById("btn-human");
  const searchInput = document.getElementById("search");

  function updateButtonStates() {
    btnAll.classList.toggle("active", !state.selectedAgent && !state.humanOnly);
    btnNta05.classList.toggle("active", state.selectedAgent === "nta_05" && !state.humanOnly);
    btnHuman.classList.toggle("active", state.humanOnly);
  }
  btnAll.addEventListener("click", () => {
    state.selectedAgent = null; state.humanOnly = false;
    updateButtonStates(); renderAll();
  });
  btnNta05.addEventListener("click", () => {
    state.selectedAgent = "nta_05"; state.humanOnly = false;
    updateButtonStates(); renderAll();
  });
  btnHuman.addEventListener("click", () => {
    state.humanOnly = !state.humanOnly;
    if (state.humanOnly) state.selectedAgent = null;
    updateButtonStates(); renderAll();
  });

  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      renderContent();
    }, 120);
  });

  // Tabs
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
      state.tab = btn.dataset.tab;
      renderContent();
    });
  });

  // ---------- render ----------
  function renderAll() {
    renderAgents();
    renderContent();
    updateNetworkHighlight();
  }

  buildIncidence();
  buildNetwork();
  updateButtonStates();
  renderAll();
})();
