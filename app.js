/**
 * KRILLION // ABYSSAL EDITION
 * 1:1 Krillion.io Remake + Topic Selector + Unlimited Mode + One in a Bakrillion
 */

const TIER_CONFIG = {
  plankton: {
    key: "plankton",
    label: "PLANKTON",
    points: 10,
    meters: 100,
    css: "t-plankton",
    color: "#94a3b8",
    percentile: "Top 85%",
    desc: "Surface-level obvious! Almost everyone dives here first."
  },
  too_clever: {
    key: "too_clever",
    label: "TOO CLEVER",
    points: 15,
    meters: 150,
    css: "t-clever",
    color: "#fbbf24",
    percentile: "Top 65%",
    desc: "The classic clever trap—feels uncommon, but thousands of players pick it!"
  },
  schooler: {
    key: "schooler",
    label: "SCHOOLER",
    points: 30,
    meters: 300,
    css: "t-schooler",
    color: "#34d399",
    percentile: "Top 40%",
    desc: "Pretty niche! A solid step past the obvious crowd answers."
  },
  rare: {
    key: "rare",
    label: "RARE",
    points: 60,
    meters: 600,
    css: "t-rare",
    color: "#38bdf8",
    percentile: "Top 15%",
    desc: "Genuinely niche! Requires strong category recall under pressure."
  },
  deep_cut: {
    key: "deep_cut",
    label: "DEEP CUT",
    points: 85,
    meters: 850,
    css: "t-deepcut",
    color: "#a855f7",
    percentile: "Top 4%",
    desc: "Very niche! Specialized insider or historical domain mastery."
  },
  krillion: {
    key: "krillion",
    label: "ONE IN A KRILLION",
    points: 100,
    meters: 1000,
    css: "t-krillion",
    color: "#f43f5e",
    percentile: "Top 0.5%",
    desc: "Dumb niche! Barely anyone on earth thinks to type this."
  },
  bakrillion: {
    key: "bakrillion",
    label: "ONE IN A BAKRILLION",
    points: 150,
    meters: 1500,
    css: "t-bakrillion",
    color: "#ff00e5",
    percentile: "Top 0.01%",
    desc: "ABYSSAL ANOMALY! Virtually unknown—verified via deep archival research!"
  },
  missed: {
    key: "missed",
    label: "OUT OF AIR",
    points: 0,
    meters: 0,
    css: "t-plankton",
    color: "#64748b",
    percentile: "0%",
    desc: "No valid answer locked in before the clock expired."
  }
};

// --- APPLICATION STATE ---
const state = {
  allPrompts: [],
  usedPromptIds: new Set(),
  selectedTopic: "all",
  selectedMode: "unlimited", // unlimited | endless | relax
  timerDuration: parseInt(localStorage.getItem("krillion_timer") || "25", 10),
  geminiKey: localStorage.getItem("krillion_gemini_key") || "",

  // Active Dive State
  activeDivePrompts: [],
  currentIndex: 0,
  totalScore: 0,
  totalDepth: 0,
  targetCanvasDepth: 0,
  currentCanvasDepth: 0,
  airTanks: 3,
  timeLeft: 25,
  timerInterval: null,
  isEvaluating: false,
  diveHistory: [],

  // Persistent Stats
  stats: JSON.parse(localStorage.getItem("krillion_stats") || JSON.stringify({
    divesCompleted: 0,
    deepestDive: 0,
    bakrillionsFound: 0,
    krillionsFound: 0
  }))
};

// ============================================================================
// 1. PYGAME-STYLE 60 FPS OCEAN DIVE ENGINE (HTML5 Canvas)
// ============================================================================
class OceanDiveEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.creatures = [];
    this.shockwaves = [];
    this.sonarActive = false;
    this.sonarAngle = 0;

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.initEntities();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initEntities() {
    for (let i = 0; i < 85; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.5 + 0.8,
        speedY: Math.random() * 0.6 + 0.2,
        alpha: Math.random() * 0.65 + 0.15,
        hue: Math.random() > 0.8 ? 305 : 190
      });
    }
    for (let i = 0; i < 6; i++) {
      this.creatures.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() * 0.6 + 0.25) * (Math.random() < 0.5 ? 1 : -1),
        size: Math.random() * 14 + 8,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  triggerShockwave(color = "#22d3ee") {
    this.shockwaves.push({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 20,
      maxRadius: Math.max(this.canvas.width, this.canvas.height) * 0.75,
      color,
      alpha: 0.85
    });
  }

  loop(timestamp) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Smoothly interpolate visual depth (Pygame camera lerp)
    const prevDepth = state.currentCanvasDepth;
    state.currentCanvasDepth += (state.targetCanvasDepth - state.currentCanvasDepth) * 0.05;
    const diveVelocity = Math.max(0, (state.currentCanvasDepth - prevDepth) * 0.45);

    // Depth factor 0.0 (0m) -> 1.0 (10,500m Bakrillion Trench)
    const depthRatio = Math.min(1, state.currentCanvasDepth / 9000);

    // Dynamic Ocean Gradient by Depth
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (depthRatio < 0.25) {
      grad.addColorStop(0, "#072547");
      grad.addColorStop(1, "#031024");
    } else if (depthRatio < 0.65) {
      grad.addColorStop(0, "#04142b");
      grad.addColorStop(1, "#020714");
    } else {
      grad.addColorStop(0, "#020512");
      grad.addColorStop(1, "#12021c"); // Bioluminescent Hadal Bakrillion Trench
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Bioluminescent Marine Snow & Rising Bubbles
    for (const p of this.particles) {
      p.y -= (p.speedY + diveVelocity);
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      const hue = depthRatio > 0.7 ? p.hue : 195;
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${p.alpha})`;
      ctx.fill();
    }

    // Draw Ambient Krill Swarms
    for (const c of this.creatures) {
      c.x += c.vx;
      c.y -= diveVelocity * 0.5;
      c.phase += 0.05;
      if (c.x < -50) c.x = w + 50;
      if (c.x > w + 50) c.x = -50;
      if (c.y < -40) c.y = h + 40;

      ctx.save();
      ctx.translate(c.x, c.y + Math.sin(c.phase) * 6);
      ctx.scale(c.vx > 0 ? 1 : -1, 1);
      ctx.fillStyle = depthRatio > 0.6
        ? "rgba(255, 0, 229, 0.22)"
        : "rgba(56, 189, 248, 0.16)";
      ctx.beginPath();
      ctx.ellipse(0, 0, c.size, c.size * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Deep Research Sonar Sweep when AI is verifying
    if (this.sonarActive) {
      this.sonarAngle += 0.08;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = "rgba(255, 0, 229, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 220 + Math.sin(this.sonarAngle) * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Tier Reveal Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 18;
      sw.alpha *= 0.94;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (sw.alpha < 0.03) this.shockwaves.splice(i, 1);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

let oceanEngine;

// ============================================================================
// 2. QUESTION BANK LOADER & 1,200+ PROMPT COMBINATORIAL GENERATOR
// ============================================================================
async function loadQuestionBank() {
  const res = await fetch("questions.json");
  const data = await res.json();
  const generated = [];

  // 1. Add all hand-curated flagship prompts
  for (const item of data.curatedPrompts) {
    generated.push({ ...item, isCurated: true });
  }

  // 2. Expand combinatorial matrices into 1,200+ unique prompts
  for (const tpl of data.combinatorialTemplates) {
    for (const adj of tpl.adjectives) {
      for (const dom of tpl.disciplines || tpl.tech_domains || tpl.music_domains || tpl.fishing_domains) {
        const promptStr = tpl.pattern
          .replace("{adj}", adj)
          .replace(/\{discipline\}|\{tech_domain\}|\{music_domain\}|\{fishing_domain\}/g, dom);

        generated.push({
          id: `gen-${tpl.topic}-${generated.length}`,
          topic: tpl.topic,
          prompt: promptStr,
          domainFocus: dom,
          keywords: [...tpl.keywords, ...dom.toLowerCase().split(/\W+/).filter(w => w.length > 3)],
          isCurated: false,
          tiers: null
        });
      }
    }
  }

  state.allPrompts = generated;
  updateTopicCountsUI();
}

function updateTopicCountsUI() {
  const counts = {
    all: state.allPrompts.length,
    sport: state.allPrompts.filter(q => q.topic === "sport").length,
    technology: state.allPrompts.filter(q => q.topic === "technology").length,
    music: state.allPrompts.filter(q => q.topic === "music").length,
    fishing: state.allPrompts.filter(q => q.topic === "fishing").length
  };

  document.getElementById("poolCountBadge").textContent = `${counts.all.toLocaleString()} Prompts Ready`;
  Object.entries(counts).forEach(([topic, count]) => {
    const el = document.querySelector(`[data-count-for="${topic}"]`);
    if (el) el.textContent = `${count}`;
  });
}

// ============================================================================
// 3. 3-LAYER HYBRID AI + LIVE WIKIPEDIA DEEP-RESEARCH JUDGE
// ============================================================================
function normalizeAnswer(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^a-z0-9+#.\s-]/g, "");
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

async function evaluateSubmission(answerRaw, promptObj) {
  const clean = normalizeAnswer(answerRaw);
  if (clean.length < 1) {
    return { valid: false, reason: "Enter an answer first!" };
  }

  // LAYER 1: Check Curated Multi-Tier Answer Bank (with fuzzy typo tolerance)
  if (promptObj.tiers) {
    for (const [tierKey, list] of Object.entries(promptObj.tiers)) {
      for (const candidate of list) {
        const normCand = normalizeAnswer(candidate);
        const dist = levenshtein(clean, normCand);
        const maxDist = normCand.length >= 7 ? 2 : normCand.length >= 4 ? 1 : 0;
        if (clean === normCand || dist <= maxDist) {
          return {
            valid: true,
            canonicalName: candidate,
            tier: tierKey,
            explanation: `Matched curated ${TIER_CONFIG[tierKey].label} benchmark for "${promptObj.prompt}".`
          };
        }
      }
    }
  }

  // LAYER 2: Check Serverless API (/api/evaluate) or Direct Gemini API if configured
  try {
    const aiResult = await queryServerlessOrGeminiJudge(answerRaw, promptObj);
    if (aiResult && typeof aiResult.valid === "boolean") {
      return aiResult;
    }
  } catch (_) {
    // Fall through seamlessly to Layer 3 Live Wikipedia Deep Research
  }

  // LAYER 3: Zero-Config Live Wikipedia Deep-Research Engine
  // Verifies real-world existence + category alignment + calculates obscurity from article byte length!
  return await verifyViaWikipediaDeepResearch(answerRaw, promptObj);
}

async function queryServerlessOrGeminiJudge(answerRaw, promptObj) {
  // 2A. If user entered a client-side Gemini API key in Settings
  if (state.geminiKey && state.geminiKey.trim().startsWith("AIza")) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.geminiKey.trim())}`;
    const sysPrompt = buildJudgePrompt(answerRaw, promptObj);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sysPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    if (resp.ok) {
      const json = await resp.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) return JSON.parse(rawText);
    }
  }

  // 2B. Call Vercel Serverless Function (/api/evaluate)
  const serverResp = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer: answerRaw,
      prompt: promptObj.prompt,
      topic: promptObj.topic
    })
  });
  if (serverResp.ok) {
    return await serverResp.json();
  }
  return null;
}

function buildJudgePrompt(answer, promptObj) {
  return `You are the official judge for Krillion.io (Abyssal Edition).
Prompt Category: "${promptObj.prompt}" (Topic: ${promptObj.topic})
Player's Submitted Answer: "${answer}"

Decide:
1. Is "${answer}" factually a valid, real-world entity that satisfies "${promptObj.prompt}"? (Allow minor spelling typos).
2. If valid, classify its obscurity into ONE of these exact 7 tier keys:
- "plankton": Really obvious, household name (top 15% most common)
- "too_clever": Predictable "clever" alternative that many trivia players think of
- "schooler": Pretty niche, solid knowledge
- "rare": Niche, genuinely uncommon
- "deep_cut": Very niche, specialist or historical knowledge
- "krillion": Dumb niche, barely anyone has ever heard of it
- "bakrillion": Essentially completely unknown abyssal obscurity—requires deep archival/specialist knowledge

Return strict JSON:
{
  "valid": true/false,
  "canonicalName": "Corrected Proper Name",
  "tier": "plankton|too_clever|schooler|rare|deep_cut|krillion|bakrillion",
  "explanation": "1-sentence witty explanation of why this fits and why it earned this rarity tier (or why it was refused)."
}`;
}

async function verifyViaWikipediaDeepResearch(answerRaw, promptObj) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(answerRaw)}&utf8=&format=json&origin=*`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  const hits = data?.query?.search || [];

  if (hits.length === 0) {
    return {
      valid: false,
      reason: `"${answerRaw}" couldn't be verified in deep archives. Try another spelling or pick!`
    };
  }

  // Find best matching Wikipedia article
  const topHit = hits[0];
  const combinedText = `${topHit.title} ${topHit.snippet}`.toLowerCase().replace(/<[^>]+>/g, "");

  // Check if article relates to topic keywords
  const matchedKeywords = (promptObj.keywords || []).filter(kw =>
    combinedText.includes(kw.toLowerCase())
  );

  // Also fetch full categories of topHit to verify domain relevance
  const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=categories|info&pageids=${topHit.pageid}&cllimit=30&format=json&origin=*`;
  const detailRes = await fetch(detailUrl);
  const detailData = await detailRes.json();
  const pageObj = detailData?.query?.pages?.[topHit.pageid] || {};
  const catString = (pageObj.categories || []).map(c => c.title.toLowerCase()).join(" ");
  const fullContext = `${combinedText} ${catString}`;

  const domainMatch = (promptObj.keywords || []).some(kw => fullContext.includes(kw.toLowerCase()));

  if (!domainMatch && matchedKeywords.length === 0) {
    return {
      valid: false,
      reason: `"${topHit.title}" exists, but doesn't appear to match this ${promptObj.topic} prompt!`
    };
  }

  // Calculate Obscurity Tier using Wikipedia Article Byte Length & Word Count!
  // Short stub/specialist articles (< 2,500 bytes) = One in a Bakrillion!
  // Huge articles (> 75,000 bytes) = Plankton / Too Clever!
  const byteLen = pageObj.length || topHit.size || 15000;
  let tier = "rare";

  if (byteLen > 95000) tier = "plankton";
  else if (byteLen > 55000) tier = "too_clever";
  else if (byteLen > 28000) tier = "schooler";
  else if (byteLen > 12000) tier = "rare";
  else if (byteLen > 5200) tier = "deep_cut";
  else if (byteLen > 2200) tier = "krillion";
  else tier = "bakrillion";

  const cleanSnippet = topHit.snippet.replace(/<[^>]+>/g, "");
  return {
    valid: true,
    canonicalName: topHit.title,
    tier,
    explanation: `Verified via Deep Archive (${byteLen.toLocaleString()} byte entry): "${cleanSnippet.slice(0, 140)}..."`
  };
}

// ============================================================================
// 4. CORE GAMEPLAY LOOP & UI CONTROLLERS
// ============================================================================
function startNewDive() {
  const pool = state.selectedTopic === "all"
    ? state.allPrompts
    : state.allPrompts.filter(p => p.topic === state.selectedTopic);

  // Prioritize curated + fresh prompts not yet seen this session
  const freshPool = pool.filter(p => !state.usedPromptIds.has(p.id));
  const sourcePool = freshPool.length >= 7 ? freshPool : pool;

  // Shuffle & pick 7 (or 50 for Endless mode)
  const shuffled = [...sourcePool].sort(() => Math.random() - 0.5);
  const count = state.selectedMode === "endless" ? 50 : 7;
  state.activeDivePrompts = shuffled.slice(0, count);

  state.currentIndex = 0;
  state.totalScore = 0;
  state.totalDepth = 0;
  state.targetCanvasDepth = 0;
  state.airTanks = 3;
  state.diveHistory = [];

  // Switch Screens
  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("summaryScreen").classList.add("hidden");
  document.getElementById("diveScreen").classList.remove("hidden");
  document.getElementById("depthRuler").classList.remove("hidden");

  const tanksWrap = document.getElementById("hudTanksWrap");
  if (state.selectedMode === "endless") {
    tanksWrap.classList.remove("hidden");
  } else {
    tanksWrap.classList.add("hidden");
  }

  renderPromptDots();
  loadCurrentPrompt();
}

function renderPromptDots() {
  const dotsWrap = document.getElementById("promptDots");
  dotsWrap.innerHTML = "";
  const total = Math.min(7, state.activeDivePrompts.length);
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("div");
    dot.className = `p-dot ${i < state.currentIndex ? "done" : i === state.currentIndex ? "active" : ""}`;
    dotsWrap.appendChild(dot);
  }
}

function loadCurrentPrompt() {
  const promptObj = state.activeDivePrompts[state.currentIndex];
  state.usedPromptIds.add(promptObj.id);

  // Update HUD
  const totalDisplay = state.selectedMode === "endless" ? "∞" : state.activeDivePrompts.length;
  document.getElementById("hudPromptCounter").textContent = `${state.currentIndex + 1} / ${totalDisplay}`;
  document.getElementById("hudDepth").textContent = `${state.totalDepth.toLocaleString()}m`;
  document.getElementById("hudScore").textContent = `${state.totalScore} pts`;
  document.getElementById("hudTanks").textContent = "🫧".repeat(Math.max(0, state.airTanks));

  // Show Question Card, Hide Reveal Card
  document.getElementById("questionCard").classList.remove("hidden");
  document.getElementById("revealCard").classList.add("hidden");
  document.getElementById("liveFeedbackBanner").classList.add("hidden");

  document.getElementById("questionCategoryBadge").textContent = promptObj.topic.toUpperCase();
  document.getElementById("promptText").textContent = promptObj.prompt;

  const input = document.getElementById("answerInput");
  input.value = "";
  input.disabled = false;
  input.focus();

  renderPromptDots();
  startPromptTimer();
}

function startPromptTimer() {
  clearInterval(state.timerInterval);
  const timerWrap = document.getElementById("timerWrap");
  const barFill = document.getElementById("timerBarFill");

  if (state.selectedMode === "relax") {
    document.getElementById("timerText").textContent = "∞";
    barFill.style.width = "100%";
    return;
  }

  state.timeLeft = state.timerDuration;
  document.getElementById("timerText").textContent = `${state.timeLeft}s`;
  barFill.style.width = "100%";

  const startTime = Date.now();
  const totalMs = state.timerDuration * 1000;

  state.timerInterval = setInterval(() => {
    if (state.isEvaluating) return; // Pause clock while AI deep-researches!

    const elapsed = Date.now() - startTime;
    const remainingMs = Math.max(0, totalMs - elapsed);
    state.timeLeft = Math.ceil(remainingMs / 1000);

    document.getElementById("timerText").textContent = `${state.timeLeft}s`;
    barFill.style.width = `${(remainingMs / totalMs) * 100}%`;

    if (remainingMs <= 0) {
      clearInterval(state.timerInterval);
      handlePromptTimeoutOrPass("Clock expired!");
    }
  }, 100);
}

async function handleAnswerSubmit(e) {
  e.preventDefault();
  if (state.isEvaluating) return;

  const input = document.getElementById("answerInput");
  const rawAnswer = input.value.trim();
  if (!rawAnswer) return;

  const promptObj = state.activeDivePrompts[state.currentIndex];
  const banner = document.getElementById("liveFeedbackBanner");

  // Activate Deep Research Sonar UI
  state.isEvaluating = true;
  oceanEngine.sonarActive = true;
  banner.className = "feedback-banner researching";
  banner.textContent = `🛰️ Deep-researching "${rawAnswer}" across archives... (Clock paused)`;
  banner.classList.remove("hidden");

  const verdict = await evaluateSubmission(rawAnswer, promptObj);

  state.isEvaluating = false;
  oceanEngine.sonarActive = false;

  if (!verdict.valid) {
    // KRILLION REFUSAL MECHANIC: Refused answers do NOT end the prompt!
    const row = document.getElementById("inputRow");
    row.classList.remove("shake");
    void row.offsetWidth;
    row.classList.add("shake");

    banner.className = "feedback-banner refused";
    banner.textContent = `❌ Refused: ${verdict.reason || verdict.explanation || "Not a valid match—keep trying while the clock runs!"}`;
    input.select();
    return;
  }

  // Valid Answer Accepted! End prompt & sink deeper!
  clearInterval(state.timerInterval);
  completePromptWithTier(
    verdict.tier || "rare",
    verdict.canonicalName || rawAnswer,
    verdict.explanation
  );
}

function handlePromptTimeoutOrPass(reasonText) {
  clearInterval(state.timerInterval);
  if (state.selectedMode === "endless") {
    state.airTanks--;
  }
  completePromptWithTier("missed", "No Answer", reasonText);
}

function completePromptWithTier(tierKey, answerTitle, explanationText) {
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.rare;
  const promptObj = state.activeDivePrompts[state.currentIndex];

  state.totalScore += tier.points;
  state.totalDepth += tier.meters;
  state.targetCanvasDepth = state.totalDepth;

  // Endless mode: One in a Krillion or Bakrillion restores 1 Air Tank!
  if (state.selectedMode === "endless" && (tierKey === "krillion" || tierKey === "bakrillion")) {
    state.airTanks = Math.min(3, state.airTanks + 1);
  }

  // Update persistent stats
  if (tierKey === "bakrillion") state.stats.bakrillionsFound++;
  if (tierKey === "krillion") state.stats.krillionsFound++;
  saveStats();

  state.diveHistory.push({
    prompt: promptObj.prompt,
    answer: answerTitle,
    tierKey,
    points: tier.points,
    meters: tier.meters
  });

  // Trigger visual shockwave on canvas
  oceanEngine.triggerShockwave(tier.color);

  // Update HUD & Depth Marker
  document.getElementById("hudDepth").textContent = `${state.totalDepth.toLocaleString()}m`;
  document.getElementById("hudScore").textContent = `${state.totalScore} pts`;
  const rulerPct = Math.min(96, (state.totalDepth / 10500) * 100);
  document.getElementById("subMarker").style.top = `${rulerPct}%`;
  document.getElementById("liveDepthLabel").textContent = `${state.totalDepth.toLocaleString()}m`;

  // Populate Reveal Card
  document.getElementById("questionCard").classList.add("hidden");
  const revealCard = document.getElementById("revealCard");
  revealCard.classList.remove("hidden");

  const badge = document.getElementById("revealTierBadge");
  badge.className = `reveal-tier-badge ${tier.css}`;
  badge.textContent = tier.label;

  document.getElementById("revealAnswerTitle").textContent = answerTitle;
  document.getElementById("revealPoints").textContent = `+${tier.points}`;
  document.getElementById("revealMeters").textContent = `+${tier.meters.toLocaleString()}m`;
  document.getElementById("revealPercentile").textContent = tier.percentile;
  document.getElementById("revealExplanation").textContent = `${tier.desc} ${explanationText || ""}`;

  // Show curated sample answers if available
  const sampleGrid = document.getElementById("sampleTiersGrid");
  sampleGrid.innerHTML = "";
  if (promptObj.tiers) {
    Object.entries(promptObj.tiers).forEach(([tKey, examples]) => {
      const cfg = TIER_CONFIG[tKey];
      if (!cfg || !examples.length) return;
      const div = document.createElement("div");
      div.className = `sample-item ${cfg.css}`;
      div.innerHTML = `<strong>${cfg.label}:</strong> ${examples.slice(0, 2).join(", ")}`;
      sampleGrid.appendChild(div);
    });
  } else {
    sampleGrid.innerHTML = `<div class="sample-item">Dynamic Prompt — Evaluated live via AI & Wikipedia Deep Research!</div>`;
  }
}

function advanceToNextPrompt() {
  state.currentIndex++;
  const outOfAir = state.selectedMode === "endless" && state.airTanks <= 0;
  const reachedEnd = state.currentIndex >= state.activeDivePrompts.length;

  if (outOfAir || reachedEnd) {
    finishDiveSummary();
  } else {
    loadCurrentPrompt();
  }
}

function finishDiveSummary() {
  clearInterval(state.timerInterval);
  document.getElementById("diveScreen").classList.add("hidden");
  document.getElementById("summaryScreen").classList.remove("hidden");

  state.stats.divesCompleted++;
  if (state.totalDepth > state.stats.deepestDive) {
    state.stats.deepestDive = state.totalDepth;
  }
  saveStats();

  // Zone Title
  let zoneTitle = "SUNLIGHT ZONE DIVE";
  if (state.totalDepth >= 7500) zoneTitle = "🌌 BAKRILLION ABYSSAL TRENCH REACHED";
  else if (state.totalDepth >= 5500) zoneTitle = "🌊 HADAL TRENCH FLOOR";
  else if (state.totalDepth >= 3500) zoneTitle = "🦑 MIDNIGHT ZONE EXPLORER";
  else if (state.totalDepth >= 1500) zoneTitle = "🐠 TWILIGHT ZONE DIVER";

  document.getElementById("summaryZoneLabel").textContent = zoneTitle;
  document.getElementById("summaryTotalDepth").textContent = `${state.totalDepth.toLocaleString()}m`;
  document.getElementById("summaryTotalScore").textContent =
    `${state.totalScore} Points · Topic: ${state.selectedTopic.toUpperCase()}`;

  const list = document.getElementById("summaryLogList");
  list.innerHTML = "";
  state.diveHistory.forEach((item, idx) => {
    const cfg = TIER_CONFIG[item.tierKey] || TIER_CONFIG.missed;
    const row = document.createElement("div");
    row.className = "summary-row";
    row.innerHTML = `
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted)">#${idx + 1} · ${item.prompt}</div>
        <div style="font-weight:700;font-size:1rem">${item.answer}</div>
      </div>
      <div style="text-align:right">
        <span class="tier-chip ${cfg.css}">${cfg.label}</span>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;margin-top:4px">+${item.meters}m</div>
      </div>
    `;
    list.appendChild(row);
  });
}

function saveStats() {
  localStorage.setItem("krillion_stats", JSON.stringify(state.stats));
}

// ============================================================================
// 5. EVENT LISTENERS & INITIALIZATION
// ============================================================================
window.addEventListener("DOMContentLoaded", async () => {
  oceanEngine = new OceanDiveEngine("oceanCanvas");
  await loadQuestionBank();

  // Topic Selector Cards
  document.querySelectorAll(".topic-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".topic-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      state.selectedTopic = card.dataset.topic;
      document.getElementById("selectedTopicLabel").textContent =
        card.querySelector("h3").textContent;
    });
  });

  // Mode Toggles
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedMode = btn.dataset.mode;
    });
  });

  // Start Dive & Gameplay Buttons
  document.getElementById("startDiveBtn").addEventListener("click", startNewDive);
  document.getElementById("answerForm").addEventListener("submit", handleAnswerSubmit);
  document.getElementById("passPromptBtn").addEventListener("click", () => handlePromptTimeoutOrPass("Prompt passed."));
  document.getElementById("abortDiveBtn").addEventListener("click", finishDiveSummary);
  document.getElementById("nextPromptBtn").addEventListener("click", advanceToNextPrompt);
  document.getElementById("playAgainBtn").addEventListener("click", startNewDive);

  document.getElementById("backHomeBtn").addEventListener("click", () => {
    state.targetCanvasDepth = 0;
    document.getElementById("summaryScreen").classList.add("hidden");
    document.getElementById("diveScreen").classList.add("hidden");
    document.getElementById("depthRuler").classList.add("hidden");
    document.getElementById("homeScreen").classList.remove("hidden");
  });

  document.getElementById("homeLogoBtn").addEventListener("click", () => {
    clearInterval(state.timerInterval);
    state.targetCanvasDepth = 0;
    document.getElementById("summaryScreen").classList.add("hidden");
    document.getElementById("diveScreen").classList.add("hidden");
    document.getElementById("depthRuler").classList.add("hidden");
    document.getElementById("homeScreen").classList.remove("hidden");
  });

  // Share Card
  document.getElementById("shareDiveBtn").addEventListener("click", () => {
    const emojis = state.diveHistory.map(h => {
      if (h.tierKey === "bakrillion") return "🌌";
      if (h.tierKey === "krillion") return "🦐";
      if (h.tierKey === "deep_cut") return "🔮";
      if (h.tierKey === "rare") return "💎";
      if (h.tierKey === "schooler") return "🐟";
      if (h.tierKey === "too_clever") return "⚠️";
      return "🫧";
    }).join("");
    const shareText = `Krillion Unlimited (${state.selectedTopic.toUpperCase()})\nDepth: ${state.totalDepth.toLocaleString()}m (${state.totalScore} pts)\n${emojis}`;
    navigator.clipboard.writeText(shareText);
    const btn = document.getElementById("shareDiveBtn");
    btn.textContent = "✅ Copied to Clipboard!";
    setTimeout(() => (btn.textContent = "📋 Copy Share Card"), 2000);
  });

  // Side Drawer & Modals
  const drawer = document.getElementById("sideDrawer");
  document.getElementById("menuBtn").addEventListener("click", () => drawer.classList.remove("hidden"));
  document.getElementById("closeDrawerBtn").addEventListener("click", () => drawer.classList.add("hidden"));
  document.getElementById("drawerBackdrop").addEventListener("click", () => drawer.classList.add("hidden"));

  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("geminiKeyInput").value = state.geminiKey;
    document.getElementById("timerDurationSelect").value = String(state.timerDuration);
    document.getElementById("settingsModal").classList.remove("hidden");
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    state.geminiKey = document.getElementById("geminiKeyInput").value.trim();
    state.timerDuration = parseInt(document.getElementById("timerDurationSelect").value, 10);
    localStorage.setItem("krillion_gemini_key", state.geminiKey);
    localStorage.setItem("krillion_timer", String(state.timerDuration));
    document.getElementById("settingsModal").classList.add("hidden");
  });

  document.getElementById("statsBtn").addEventListener("click", showStatsModal);

  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", () => {
      document.getElementById(el.dataset.closeModal).classList.add("hidden");
    });
  });

  // Keyboard shortcut: Enter on Reveal Screen goes to next prompt
  window.addEventListener("keydown", (e) => {
    const revealVisible = !document.getElementById("revealCard").classList.contains("hidden");
    if (e.key === "Enter" && revealVisible) {
      e.preventDefault();
      advanceToNextPrompt();
    }
  });
});

function showStatsModal() {
  const modal = document.getElementById("infoModal");
  document.getElementById("infoModalTitle").textContent = "🏆 My Krillion Logbook & Rarity Tiers";
  document.getElementById("infoModalBody").innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
      <div class="metric-box"><span class="metric-label">DIVES COMPLETED</span><span class="metric-val">${state.stats.divesCompleted}</span></div>
      <div class="metric-box"><span class="metric-label">DEEPEST DIVE</span><span class="metric-val">${state.stats.deepestDive.toLocaleString()}m</span></div>
      <div class="metric-box"><span class="metric-label">ONE IN A KRILLION</span><span class="metric-val">${state.stats.krillionsFound} 🦐</span></div>
      <div class="metric-box"><span class="metric-label">ONE IN A BAKRILLION</span><span class="metric-val">${state.stats.bakrillionsFound} 🌌</span></div>
    </div>
    <p class="modal-desc">
      <strong>Plankton (10 pts / 100m):</strong> Really obvious first-instinct answer.<br>
      <strong>Too Clever (15 pts / 150m):</strong> Pretty obvious trap answer thousands guess.<br>
      <strong>Schooler (30 pts / 300m):</strong> Pretty niche—solid domain knowledge.<br>
      <strong>Rare (60 pts / 600m):</strong> Niche—uncommon recall.<br>
      <strong>Deep Cut (85 pts / 850m):</strong> Very niche specialist/historical pick.<br>
      <strong>One in a Krillion (100 pts / 1,000m):</strong> Dumb niche, barely heard of.<br>
      <strong>One in a Bakrillion (150 pts / 1,500m):</strong> Abyssal obscurity verified via AI & deep archival research!
    </p>
  `;
  modal.classList.remove("hidden");
}
