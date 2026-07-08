let state = null

const $ = (id) => document.getElementById(id)

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

function card(title, body, footer = "") {
  return `<article class="card"><h3>${escapeHtml(title)}</h3><div>${body}</div>${footer ? `<p class="small">${escapeHtml(footer)}</p>` : ""}</article>`
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function renderStats() {
  const openBlockers = state.blockers.filter((b) => b.status !== "resolved")
  $("stats").innerHTML = [
    [openBlockers.length, "Open blockers"],
    [state.ratSessions.length, "Rat sessions"],
    [state.votes.length, "Votes"],
    [state.memories.length, "Memory records"],
  ].map(([count, label]) => `<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join("")
}

function renderBlockers() {
  $("blockers").innerHTML = state.blockers.length ? state.blockers.map((b) => {
    const body = `
      <p>${escapeHtml(b.description || b.title || "Blocker")}</p>
      <span class="badge ${escapeHtml(b.severity)}">${escapeHtml(b.severity || "medium")}</span>
      <span class="badge ${escapeHtml(b.status)}">${escapeHtml(b.status || "open")}</span>
      <div class="row">
        <button data-start-rat="${escapeHtml(b.id)}">Rat starten</button>
      </div>
    `
    return card(b.id, body, b.createdAt)
  }).join("") : card("Keine Blocker", "<p class='muted'>Der Moment, bevor jemand `works on my machine` sagt.</p>")

  document.querySelectorAll("[data-start-rat]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const blockerId = btn.getAttribute("data-start-rat")
      await api("/api/rat/start", {
        method: "POST",
        body: JSON.stringify({ blockerId, topic: `Blocker review ${blockerId}` }),
      })
      await load()
    })
  })
}

function renderRatSessions() {
  $("rat-sessions").innerHTML = state.ratSessions.length ? state.ratSessions.map((s) => {
    const body = `
      <p>${escapeHtml(s.topic)}</p>
      <span class="badge ${escapeHtml(s.status)}">${escapeHtml(s.status)}</span>
      <p class="small">Agents: ${(s.agents || []).map(escapeHtml).join(", ")}</p>
      <div class="row">
        <button data-approve="${escapeHtml(s.id)}">Approve</button>
        <button data-reject="${escapeHtml(s.id)}">Reject</button>
        <button data-revise="${escapeHtml(s.id)}">Revise</button>
      </div>
    `
    return card(s.id, body, s.startedAt)
  }).join("") : card("Kein Rat aktiv", "<p class='muted'>Noch kein Mini-Parlament der Agenten gestartet.</p>")

  document.querySelectorAll("[data-approve]").forEach((btn) => btn.addEventListener("click", () => voteUser(btn, "approve")))
  document.querySelectorAll("[data-reject]").forEach((btn) => btn.addEventListener("click", () => voteUser(btn, "reject")))
  document.querySelectorAll("[data-revise]").forEach((btn) => btn.addEventListener("click", () => voteUser(btn, "revise")))
}

async function voteUser(btn, action) {
  const id = btn.getAttribute(`data-${action}`)
  await api(`/api/user/${action}`, {
    method: "POST",
    body: JSON.stringify({ ratSessionId: id, reason: `${action} from dashboard` }),
  })
  await load()
}

function renderVotes() {
  $("votes").innerHTML = state.votes.length ? state.votes.map((v) => {
    const body = `
      <span class="badge ${escapeHtml(v.choice)}">${escapeHtml(v.choice)}</span>
      <p>${escapeHtml(v.rationale || "No rationale")}</p>
      <p class="small">Agent: ${escapeHtml(v.agentId)}</p>
    `
    return card(v.id, body, v.castAt)
  }).join("") : card("Keine Votes", "<p class='muted'>Demokratie lädt noch.</p>")
}

function renderMemories() {
  $("memories").innerHTML = state.memories.length ? state.memories.map((m) => {
    const body = `<p>${escapeHtml(m.content)}</p><span class="badge">${escapeHtml(m.key)}</span>`
    return card(m.id, body, m.createdAt)
  }).join("") : card("Kein Memory", "<p class='muted'>Noch nichts gemerkt. Fast menschlich.</p>")
}

async function load() {
  state = await api("/api/state")
  renderStats()
  renderBlockers()
  renderRatSessions()
  renderVotes()
  renderMemories()
}

async function readAloud() {
  const result = await api("/api/tts/read", { method: "POST", body: JSON.stringify({}) })
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.text))
  } else {
    alert(result.text)
  }
}

async function createDemoBlocker() {
  await api("/api/blocker", {
    method: "POST",
    body: JSON.stringify({
      description: "Demo blocker: decision needed before continuing",
      severity: "medium",
      context: { source: "dashboard" },
    }),
  })
  await load()
}

async function fourthVoice() {
  const latest = state.ratSessions[0]
  const prompt = $("fourth-prompt").value.trim()
  if (!latest) throw new Error("No rat session exists yet")
  if (!prompt) throw new Error("Prompt is empty")
  const result = await api("/api/fourth-voice/request", {
    method: "POST",
    body: JSON.stringify({ ratSessionId: latest.id, prompt }),
  })
  $("fourth-result").textContent = JSON.stringify(result, null, 2)
  await load()
}

$("refresh").addEventListener("click", load)
$("read-aloud").addEventListener("click", readAloud)
$("create-demo-blocker").addEventListener("click", createDemoBlocker)
$("fourth-submit").addEventListener("click", () => fourthVoice().catch((err) => alert(err.message)))

load().catch((err) => {
  console.error(err)
  document.body.insertAdjacentHTML("beforeend", `<pre>${escapeHtml(err.stack || err.message)}</pre>`)
})
