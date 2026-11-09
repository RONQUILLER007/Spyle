"use strict";
/* EXPEDIENTE ES — Protocolo de Infiltración (Motor lógico 100% offline) */

/* ==========================================================================
   CONEXIÓN AL WEBHOOK DE GOOGLE SHEETS (GOOGLE APPS SCRIPT)
   ========================================================================== */
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9Supz_QAPtnOT0afclWaisYv-bA80Tx16GUlxI45xqGCjN21VwzvyPDVKF4bEJv4pIQ/exec';

function enviarSugerenciaAGoogle(promptTitulo, palabraSugerida) {
  const payload = JSON.stringify({
    promptTitle: promptTitulo,
    suggestedWord: palabraSugerida
  });

  return fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors', // Evita bloqueos y redirecciones de Google Apps Script
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: payload
  });
}

const ROUNDS = 7;
const ROUND_SECONDS = 25;
const SPEED_BONUS_MIN_LEFT_MS = 19000; // Quedan 19 s o más (primeros 6 s de la ronda)
const SPEED_BONUS_MULT = 1.2;          // +20 % redondeado al alza
const COVER_UNITS_PER_POINT = 10;      // Escala operativa de cobertura (1 pt = 10 uds.)
const MAX_GAUGE_POINTS = 700;          // Escala visual lateral de 0 a 700 pts
const CHAPTER_PASS_POINTS = 250;       // Puntos mínimos para desclasificar siguiente capítulo
const CHAPTERS_PER_PACK = 3;           // Capítulos por dossier temático
const EPOCH = new Date(2026, 10, 7);   // Día #1 (hoy 8-nov-2026 = Día #2)

/* ---------- Niveles de Evaluación de Contrainteligencia ---------- */
const TIERS = {
  fail: {
    emoji: "⬛",
    nombre: "Delatado / Misión Fallida",
    pts: 0,
    state: "off",
    stamp: "[ TAPADERA COMPROMETIDA ]",
    subtext: "La tapadera cayó. Sin registro válido en los archivos locales.",
    channel: "ALERTA DE SEGURIDAD // AGENTE DESCUBIERTO"
  },
  plankton: {
    emoji: "📰",
    nombre: "Registro Turístico",
    pts: 10,
    state: "plankton",
    stamp: "[ REGISTRO TURÍSTICO · SUPERFICIAL ]",
    subtext: "Demasiado obvio. Cualquier civil extranjero conocería ese dato.",
    channel: "DICTAMEN // COBERTURA BÁSICA"
  },
  tooclever: {
    emoji: "🎭",
    nombre: "Tapadera Chapucera",
    pts: 25,
    state: "judge",
    stamp: "[ ALERTA: CLICHÉ SOSPECHOSO ]",
    subtext: "Gesto delatador: intento pretencioso de parecer nativo que levanta sospechas.",
    channel: "ADVERTENCIA // ANOMALÍA EN INTERROGATORIO"
  },
  schooler: {
    emoji: "🗂️",
    nombre: "Conocimiento de Campo",
    pts: 45,
    state: "schooler",
    stamp: "[ EXPEDIENTE APROBADO ]",
    subtext: "Referencia creíble y natural en una conversación callejera estándar.",
    channel: "DICTAMEN // APTO PARA DESPLIEGUE"
  },
  rare: {
    emoji: "🕵️",
    nombre: "Infiltración Profunda",
    pts: 65,
    state: "rare",
    stamp: "[ INFILTRACIÓN PROFUNDA ]",
    subtext: "Dominio propio de un residente veterano integrado en el terreno.",
    channel: "DICTAMEN // COBERTURA SÓLIDA"
  },
  deepcut: {
    emoji: "🗝️",
    nombre: "Alto Secreto / Archivo Reservado",
    pts: 85,
    state: "deepcut",
    stamp: "[ ALTO SECRETO · ARCHIVO RESERVADO ]",
    subtext: "Microcultura o marca local prácticamente invisible para forasteros.",
    channel: "CLASIFICACIÓN // ACCESO RESTRINGIDO"
  },
  trillion: {
    emoji: "🎖️",
    nombre: "Agente Durmiente Perfecto",
    pts: 100,
    state: "gold",
    stamp: "[ AGENTE DURMIENTE PERFECTO ]",
    subtext: "Precisión cultural milimétrica. Tapadera imposible de quebrar.",
    channel: "MÁXIMA DISTINCIÓN // INDETECTABLE"
  }
};

const PTS_TO_TIER = {
  0: "fail",
  10: "plankton",
  25: "tooclever",
  45: "schooler",
  50: "schooler",
  65: "rare",
  70: "rare",
  85: "deepcut",
  100: "trillion"
};

/* ---------- Cámara de Archivos Clasificados (Guerra Fría) ---------- */
/* ---------- Catálogo Oficial de Condecoraciones Tácticas (10 Logros Clasificados) ---------- */
const ACHIEVEMENTS = [
  {
    id: "logro_doble_centenario",
    titulo: "Doble Agente Durmiente",
    icono: "🎖️",
    codigo: "CONDECORACIÓN // OP-01",
    desc: "Clava dos palabras de 100 puntos en una misma misión (partida de 7 rondas).",
    censurada: "Mérito confidencial. Requiere infiltración extrema doble (dos aciertos de 100 pts en una sola misión)."
  },
  {
    id: "logro_umbral_500",
    titulo: "Informe Sobresaliente",
    icono: "📁",
    codigo: "CONDECORACIÓN // OP-02",
    desc: "Consigue 500 o más puntos en una sola misión.",
    censurada: "Aptitud insuficiente. Requiere alcanzar un umbral mínimo de 500 puntos en un expediente."
  },
  {
    id: "logro_pleno_700",
    titulo: "Operativo Impecable",
    icono: "⭐",
    codigo: "CONDECORACIÓN // OP-03",
    desc: "Consigue un pleno perfecto de 700 puntos base (o más con multiplicadores) en una sola misión (todas las rondas de 100 pts).",
    censurada: "Perfección operativa exigida. Pleno absoluto de 7 rondas consecutivas de 100 puntos."
  },
  {
    id: "logro_reflejos_frio",
    titulo: "Gatillo Rápido",
    icono: "⚡",
    codigo: "CONDECORACIÓN // OP-04",
    desc: "Responde de forma válida en menos de 2,0 segundos en cualquier ronda activa.",
    censurada: "Tiempo de reacción insuficiente. Requiere dictamen válido en menos de 2,0 segundos de reloj."
  },
  {
    id: "logro_pleno_velocidad",
    titulo: "Carrera de Espías",
    icono: "⏱️",
    codigo: "CONDECORACIÓN // OP-05",
    desc: "Obtén la bonificación de velocidad (+20% por responder en <6s) en las 7 rondas de una misma misión.",
    censurada: "Misión contrarreloj. Requiere bonificación de velocidad mantenida en las 7 rondas de la sesión."
  },
  {
    id: "logro_tiro_limpio",
    titulo: "Sin Rastro",
    icono: "🎯",
    codigo: "CONDECORACIÓN // OP-06",
    desc: "Completa las 7 rondas de una misión sin registrar un solo intento fallido o no catalogado (100% de efectividad al primer intento).",
    censurada: "Fugas detectadas. Requiere completar las 7 rondas con efectividad quirúrgica sin fallos."
  },
  {
    id: "logro_al_limite",
    titulo: "Extracción In Extremis",
    icono: "⏳",
    codigo: "CONDECORACIÓN // OP-07",
    desc: "Acierta una palabra válida quedando menos de 1,0 segundo en el temporizador de la ronda.",
    censurada: "Extracción al borde del abismo. Requiere acierto válido con menos de 1,0 segundo en el temporizador."
  },
  {
    id: "logro_comodin_dorado",
    titulo: "Infiltración Duplicada",
    icono: "🃏",
    codigo: "CONDECORACIÓN // OP-08",
    desc: "Activa el comodín en una ronda y obtén una puntuación de Infiltración Profunda (≥65 pts), duplicando con éxito los puntos.",
    censurada: "Protocolo Doble Fondo. Requiere duplicar con éxito una ronda de 65 o más puntos con el comodín."
  },
  {
    id: "logro_veterano_red",
    titulo: "Red Durmiente",
    icono: "🌐",
    codigo: "CONDECORACIÓN // OP-09",
    desc: "Completa al menos 5 misiones completas (diarias o ilimitadas) acumulando un mínimo de 2.000 puntos totales históricos.",
    censurada: "Experiencia de campo acumulada. Requiere al menos 5 misiones finalizadas y 2.000 pts totales."
  },
  {
    id: "logro_criptografo",
    titulo: "Desclasificación Total",
    icono: "🗝️",
    codigo: "CONDECORACIÓN // OP-10",
    desc: "Descubre el Easter Egg diario y desbloquea el Archivo Histórico y Calendario de Misiones.",
    censurada: "Cifrado de máxima seguridad. Requiere introducir la clave Easter Egg y desclasificar el Calendario."
  }
];

// Alias de retrocompatibilidad
const ARCHIVES = ACHIEVEMENTS;

/* ---------- Marcador Persistente de Puntuación Acumulada (localStorage: spyle_puntos_totales) ---------- */
function getPuntosHistoricosTotales() {
  try {
    const raw = localStorage.getItem("spyle_puntos_totales");
    const val = parseInt(raw || "0", 10);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

function actualizarMarcadorPuntosTotales(puntos, animar = false) {
  const el = $("marcador-puntos-totales");
  if (el) {
    el.textContent = Number(puntos || 0).toLocaleString("es-ES");
  }
  if (animar) {
    const pill = document.querySelector(".marcador-total-pill");
    if (pill) {
      pill.classList.remove("pulse-impact");
      void pill.offsetWidth; // Forzar reflow para reiniciar animación
      pill.classList.add("pulse-impact");
      setTimeout(() => pill.classList.remove("pulse-impact"), 350);
    }
  }
}

function sumarPuntosHistoricos(puntosGanados) {
  if (!puntosGanados || puntosGanados <= 0) return getPuntosHistoricosTotales();
  let puntosHistoricos = getPuntosHistoricosTotales();
  puntosHistoricos += puntosGanados;
  try {
    localStorage.setItem("spyle_puntos_totales", puntosHistoricos.toString());
  } catch { /* almacenamiento restringido */ }
  actualizarMarcadorPuntosTotales(puntosHistoricos, true);
  return puntosHistoricos;
}

/* ---------- Almacenamiento Local ---------- */
const store = {
  get(k, def) {
    try {
      let v = localStorage.getItem("spyle:" + k);
      if (!v) {
        v = localStorage.getItem("tinkleES:" + k);
        if (v) {
          localStorage.setItem("spyle:" + k, v);
        }
      }
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("spyle:" + k, JSON.stringify(v));
    } catch { /* almacenamiento restringido */ }
  }
};

/* ---------- Sistema de Audio Táctico Sintético (Web Audio API) ---------- */
const sound = {
  ctx: null,
  muted: store.get("muted", false),

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    store.set("muted", this.muted);
    this.updateButton();
    if (!this.muted) {
      this.playTone(720, "sine", 0.06, 0.12);
    }
  },

  updateButton() {
    const btn = $("btn-mute");
    if (!btn) return;
    btn.textContent = this.muted ? "🔇" : "🔊";
    btn.classList.toggle("muted", this.muted);
    btn.title = this.muted ? "Audio silenciado (clic para activar)" : "Audio de terminal activo (clic para silenciar)";
  },

  playTone(freq, type = "sine", duration = 0.1, vol = 0.14, slideTo = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
      }

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch { /* AudioContext bloqueado */ }
  },

  stampThud() {
    if (this.muted) return;
    this.playTone(115, "triangle", 0.08, 0.22, 42);
  },

  rejectBeep() {
    if (this.muted) return;
    this.playTone(195, "sawtooth", 0.07, 0.11, 130);
  },

  tick(urgent = false) {
    if (this.muted) return;
    if (urgent) {
      this.playTone(980, "square", 0.035, 0.1);
    } else {
      this.playTone(620, "square", 0.028, 0.065);
    }
  },

  tierSound(tier) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.stampThud();

    if (tier === "fail") {
      setTimeout(() => this.playTone(155, "sawtooth", 0.32, 0.18, 65), 40);
      return;
    }
    if (tier === "plankton") {
      setTimeout(() => this.playTone(480, "triangle", 0.11, 0.13), 45);
      return;
    }
    if (tier === "tooclever") {
      setTimeout(() => this.playTone(415, "sawtooth", 0.12, 0.14, 350), 45);
      setTimeout(() => this.playTone(330, "sawtooth", 0.18, 0.14, 260), 150);
      return;
    }
    if (tier === "schooler") {
      [523.25, 659.25].forEach((f, i) => setTimeout(() => this.playTone(f, "triangle", 0.14, 0.15), 45 + i * 65));
      return;
    }
    if (tier === "rare") {
      [587.33, 739.99, 880].forEach((f, i) => setTimeout(() => this.playTone(f, "sine", 0.18, 0.16), 45 + i * 55));
      return;
    }
    if (tier === "deepcut") {
      [440, 554.37, 659.25, 880].forEach((f, i) => setTimeout(() => this.playTone(f, "triangle", 0.22, 0.16), 45 + i * 50));
      return;
    }
    if (tier === "trillion") {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
        setTimeout(() => this.playTone(f, "triangle", 0.24, 0.19), 40 + i * 60)
      );
    }
  },

  unlockSound() {
    if (this.muted) return;
    [587.33, 739.99, 880, 1174.66].forEach((f, i) =>
      setTimeout(() => this.playTone(f, "triangle", 0.22, 0.17), i * 75)
    );
  }
};

["click", "touchstart", "keydown"].forEach((evt) => {
  window.addEventListener(evt, () => sound.init(), { once: true, passive: true });
});

/* ==========================================================================
   1. MOTOR DE NORMALIZACIÓN ROBUSTA Y MULTIFORMATO
   - Minúsculas siempre (.toLowerCase())
   - Conservación estricta de 'ñ' / 'Ñ' -> 'ñ' (jamás se convierte en 'n')
   - Limpieza exclusiva de acentos vocálicos (á, é, í, ó, ú, ü -> a, e, i, o, u)
   - Conversión de '-', '_', '.' y '/' en espacios
   - Estrategia de Búsqueda Dual: con espacios y colapsado sin espacios
   - Fuzzy Matching (Levenshtein === 1) para entradas de 5 o más letras
   ========================================================================== */
const ARTICLES = ["el", "la", "los", "las", "un", "una"];

function normalizeInput(str) {
  if (str == null) return "";

  // 1. Convertir siempre a minúsculas ('BYD', 'Byd' -> 'byd', 'Ñ' -> 'ñ')
  let s = String(str).toLowerCase();

  // 2. Proteger 'ñ' tanto precompuesta (U+00F1) como descompuesta NFD ('n' + U+0303)
  s = s
    .replace(/n\u0303/g, "\u0001")
    .replace(/ñ/g, "\u0001");

  // 3. Eliminar tildes/diéresis de las vocales (á, é, í, ó, ú, ü -> a, e, i, o, u)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 4. Restaurar 'ñ' intacta
  s = s.replace(/\u0001/g, "ñ");

  // 5. Convertir separadores (-, _, ., /) en espacios
  s = s.replace(/[-_./\\]+/g, " ");

  // 6. Limpiar otros signos de puntuación conservando letras, dígitos, 'ñ' y espacios
  s = s.replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();

  return s;
}

function stripLeadingArticle(spaced) {
  for (const art of ARTICLES) {
    if (spaced.startsWith(art + " ")) {
      const rest = spaced.slice(art.length + 1).trim();
      if (rest) return rest;
    }
  }
  return spaced;
}

function collapseSpaces(str) {
  return str.replace(/\s+/g, "");
}

// Alias de compatibilidad
function normalize(str) {
  return stripLeadingArticle(normalizeInput(str));
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  if (Math.abs(m - n) > 1) return 2; // Poda rápida para distancia máxima 1
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const val = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      cur[j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > 1) return 2;
    prev = cur;
  }
  return prev[n];
}

function pickHigherTier(tierA, tierB) {
  if (!tierA) return tierB;
  if (!tierB) return tierA;
  return TIERS[tierB].pts > TIERS[tierA].pts ? tierB : tierA;
}

const indexCache = new Map();

function registerKeyInMaps(spacedMap, collapsedMap, rawAns, tier) {
  if (!tier || tier === "fail") return;
  const spaced = normalizeInput(rawAns);
  if (!spaced) return;

  const noArt = stripLeadingArticle(spaced);
  const collapsed = collapseSpaces(spaced);
  const collapsedNoArt = collapseSpaces(noArt);

  spacedMap.set(spaced, pickHigherTier(spacedMap.get(spaced), tier));
  if (noArt && noArt !== spaced) {
    spacedMap.set(noArt, pickHigherTier(spacedMap.get(noArt), tier));
  }

  if (collapsed) {
    collapsedMap.set(collapsed, pickHigherTier(collapsedMap.get(collapsed), tier));
  }
  if (collapsedNoArt && collapsedNoArt !== collapsed) {
    collapsedMap.set(collapsedNoArt, pickHigherTier(collapsedMap.get(collapsedNoArt), tier));
  }
}

function getIndex(p) {
  if (!indexCache.has(p.id)) {
    const spacedMap = new Map();
    const collapsedMap = new Map();

    if (p.answers) {
      for (const [ans, pts] of Object.entries(p.answers)) {
        const tier = PTS_TO_TIER[pts] || "fail";
        registerKeyInMaps(spacedMap, collapsedMap, ans, tier);
      }
    } else if (p.respuestas) {
      for (const [tier, list] of Object.entries(p.respuestas)) {
        for (const ans of list) {
          registerKeyInMaps(spacedMap, collapsedMap, ans, tier);
        }
      }
    }

    indexCache.set(p.id, { spacedMap, collapsedMap });
  }
  return indexCache.get(p.id);
}

function evaluate(prompt, input) {
  const spaced = normalizeInput(input);
  if (!spaced) return "fail";

  const noArt = stripLeadingArticle(spaced);
  const collapsed = collapseSpaces(spaced);
  const collapsedNoArt = collapseSpaces(noArt);

  const { spacedMap, collapsedMap } = getIndex(prompt);

  // 1. Búsqueda Dual Exacta (con espacios y colapsada sin espacios)
  let exactTier = null;
  if (spacedMap.has(spaced)) exactTier = pickHigherTier(exactTier, spacedMap.get(spaced));
  if (spacedMap.has(noArt)) exactTier = pickHigherTier(exactTier, spacedMap.get(noArt));
  if (collapsedMap.has(collapsed)) exactTier = pickHigherTier(exactTier, collapsedMap.get(collapsed));
  if (collapsedMap.has(collapsedNoArt)) exactTier = pickHigherTier(exactTier, collapsedMap.get(collapsedNoArt));

  if (exactTier) return exactTier;

  // 2. Fuzzy Matching (Levenshtein === 1 para palabras de 5 o más letras/caracteres útiles)
  if (collapsed.length >= 5 || collapsedNoArt.length >= 5) {
    let best = null;

    const candidatesSpaced = noArt !== spaced ? [spaced, noArt] : [spaced];
    for (const cand of candidatesSpaced) {
      if (collapseSpaces(cand).length < 5) continue;
      for (const [k, tier] of spacedMap) {
        if (levenshtein(cand, k) === 1) {
          best = pickHigherTier(best, tier);
        }
      }
    }

    const candidatesCollapsed = collapsedNoArt !== collapsed ? [collapsed, collapsedNoArt] : [collapsed];
    for (const cand of candidatesCollapsed) {
      if (cand.length < 5) continue;
      for (const [k, tier] of collapsedMap) {
        if (levenshtein(cand, k) === 1) {
          best = pickHigherTier(best, tier);
        }
      }
    }

    if (best) return best;
  }

  return "fail";
}

/* ---------- Utilidades Generales ---------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("es-ES");

function dayNumber(d = new Date()) {
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
  return Math.floor((a - b) / 86400000) + 1;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Gestión de Archivos Clasificados (Coleccionables) ---------- */
/* ==========================================================================
   SISTEMA DE LOGROS Y ARCHIVOS CLASIFICADOS (localStorage: spyle_logros)
   ========================================================================== */
function getAchievements() {
  try {
    const raw = localStorage.getItem("spyle_logros");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch { /* ignorar error de parseo */ }
  return {};
}

function saveAchievements(obj) {
  try {
    localStorage.setItem("spyle_logros", JSON.stringify(obj));
  } catch { /* almacenamiento restringido */ }
}

function isAchievementUnlocked(id) {
  const achs = getAchievements();
  return Boolean(achs[id] && achs[id].unlocked);
}

// Cola de notificaciones tácticas para evitar solapamientos
const achievementToastQueue = [];
let isShowingAchievementToast = false;
let toastHideTimeout = null;

function unlockAchievement(id) {
  const ach = ACHIEVEMENTS.find((a) => a.id === id);
  if (!ach) return null;

  const current = getAchievements();
  if (current[id] && current[id].unlocked) {
    return null; // Ya obtenido previamente
  }

  const unlockedAt = new Date().toISOString();
  current[id] = { unlocked: true, unlockedAt };
  saveAchievements(current);

  // Alerta sonora táctica de condecoración
  sound.unlockSound();

  // Encolar y mostrar notificación flotante
  achievementToastQueue.push({ ...ach, unlockedAt });
  processToastQueue();

  // Actualizar indicadores visuales de logros si están montados
  updateAchievementsStatus();
  return ach;
}

function processToastQueue() {
  if (isShowingAchievementToast || achievementToastQueue.length === 0) return;
  const ach = achievementToastQueue.shift();
  showAchievementToast(ach);
}

function showAchievementToast(ach) {
  const toast = $("unlock-toast");
  if (!toast) return;

  isShowingAchievementToast = true;
  if (toastHideTimeout) clearTimeout(toastHideTimeout);

  const iconEl = $("toast-icon");
  const titleEl = $("toast-title");
  const descEl = $("toast-desc");

  if (iconEl) iconEl.textContent = ach.icono || "🎖️";
  if (titleEl) titleEl.textContent = `CONDECORACIÓN: ${ach.titulo.toUpperCase()}`;
  if (descEl) descEl.textContent = `${ach.codigo} · Desclasificado e incorporado a los Archivos`;

  toast.classList.remove("hidden", "toast-closing");

  // Duración estricta de 3.5 segundos con transición de salida
  toastHideTimeout = setTimeout(() => {
    toast.classList.add("toast-closing");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("toast-closing");
      isShowingAchievementToast = false;
      // Procesar siguiente logro en cola si lo hubiera
      processToastQueue();
    }, 350);
  }, 3150);
}

// Compatibilidad con invocaciones antiguas
function getUnlockedArchives() {
  const achs = getAchievements();
  const unlocked = new Set();
  ACHIEVEMENTS.forEach((a) => {
    if (achs[a.id] && achs[a.id].unlocked) unlocked.add(a.id);
  });
  return unlocked;
}

function unlockNextArchive() {
  // En el nuevo sistema, el comodín exitoso activa directamente logro_comodin_dorado
  return unlockAchievement("logro_comodin_dorado");
}

function showUnlockToast(archive) {
  showAchievementToast(archive);
}

function updateAchievementsStatus() {
  const achs = getAchievements();
  let count = 0;
  ACHIEVEMENTS.forEach((a) => {
    if (achs[a.id] && achs[a.id].unlocked) count++;
  });

  const counterEl = $("archives-counter");
  if (counterEl) {
    counterEl.textContent = `ARCHIVOS DESCLASIFICADOS: [${count} / ${ACHIEVEMENTS.length}]`;
  }

  const menuStatusEl = $("bestiary-status");
  if (menuStatusEl) {
    menuStatusEl.textContent = `${count}/${ACHIEVEMENTS.length} condecoraciones desclasificadas`;
  }
}

function renderArchives() {
  const list = $("bestiary-list");
  if (!list) return;
  list.innerHTML = "";
  const achs = getAchievements();

  let unlockedCount = 0;

  ACHIEVEMENTS.forEach((item) => {
    const isUnlocked = Boolean(achs[item.id] && achs[item.id].unlocked);
    if (isUnlocked) unlockedCount++;

    const card = document.createElement("div");
    const isElite = item.id === "logro_pleno_700" || item.id === "logro_criptografo";
    card.className = `achievement-card ${isUnlocked ? "unlocked" : "locked"} ${isUnlocked && isElite ? "elite" : ""}`;

    // Cabecera superior
    const top = document.createElement("div");
    top.className = "ach-top";

    const code = document.createElement("div");
    code.className = "ach-code";
    code.textContent = item.codigo;

    const icon = document.createElement("div");
    icon.className = "ach-icon";
    icon.textContent = isUnlocked ? item.icono : "🔒";

    top.append(code, icon);

    // Título de la condecoración
    const title = document.createElement("div");
    title.className = "ach-title";
    title.textContent = isUnlocked ? item.titulo : "EXPEDIENTE CENSURADO";

    // Descripción del mérito
    const desc = document.createElement("div");
    desc.className = "ach-desc";
    desc.textContent = isUnlocked ? item.desc : (item.censurada || "Autorización confidencial denegada.");

    // Pie con estado y fecha de desclasificación
    const footer = document.createElement("div");
    footer.className = "ach-footer";

    const badge = document.createElement("span");
    badge.className = "ach-status-badge";
    badge.textContent = isUnlocked ? "DESCLASIFICADO" : "CLASIFICADO";

    const dateSpan = document.createElement("span");
    dateSpan.className = "ach-date";
    if (isUnlocked && achs[item.id].unlockedAt) {
      try {
        const d = new Date(achs[item.id].unlockedAt);
        dateSpan.textContent = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch {
        dateSpan.textContent = "AUTORIZADO";
      }
    } else {
      dateSpan.textContent = "[NIVEL RESTRINGIDO]";
    }

    footer.append(badge, dateSpan);
    card.append(top, title, desc, footer);
    list.appendChild(card);
  });

  const counterEl = $("archives-counter");
  if (counterEl) {
    counterEl.textContent = `ARCHIVOS DESCLASIFICADOS: [${unlockedCount} / ${ACHIEVEMENTS.length}]`;
  }
}

/* ---------- Selección de Prompts: Diaria e Unlimited ---------- */
/* Calendario del reto diario: ids que abren la jornada de un día concreto.
   El resto de huecos hasta completar ROUNDS se rellena con el algoritmo clásico. */
/* ===================== ESTRUCTURA DE RETOS DIARIOS Y CALENDARIO ===================== */
function dateForDay(d) {
  const dt = new Date(EPOCH.getTime() + (d - 1) * 86400000);
  return dt.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function dailyPrompts(day = dayNumber()) {
  const mission = (typeof DAILY_MISSIONS !== "undefined")
    ? (DAILY_MISSIONS[day] || DAILY_MISSIONS[`dia_${day}`] || DAILY_MISSIONS[((day - 1) % 3) + 1])
    : null;

  if (mission && Array.isArray(mission.prompts) && mission.prompts.length >= ROUNDS) {
    const list = mission.prompts
      .map((id) => PROMPTS.find((p) => p.id === id))
      .filter(Boolean);
    if (list.length >= ROUNDS) return list.slice(0, ROUNDS);
  }

  // Fallback seguro: bloques cerrados secuenciales de 7 categorías
  const generals = PROMPTS.filter((p) => p.pack === "general");
  const total = generals.length;
  if (total >= ROUNDS) {
    const startIdx = ((day - 1) * ROUNDS) % total;
    const selected = [];
    for (let i = 0; i < ROUNDS; i++) {
      selected.push(generals[(startIdx + i) % total]);
    }
    return selected;
  }
  return PROMPTS.slice(0, ROUNDS);
}

const sessionPlayed = new Set();
function unlimitedPrompts() {
  let pool = PROMPTS.filter((p) => !sessionPlayed.has(p.id));
  if (pool.length < ROUNDS) {
    sessionPlayed.clear();
    pool = PROMPTS.slice();
  }
  const sel = shuffle(pool).slice(0, ROUNDS);
  sel.forEach((p) => sessionPlayed.add(p.id));
  return sel;
}

/* ---------- Estructura de Packs Temáticos por Capítulos ---------- */
function getPackProgress() {
  const prog = store.get("packChapters", {});
  PACKS.forEach((pk) => {
    if (!prog[pk.id]) prog[pk.id] = {};
    for (let c = 1; c <= CHAPTERS_PER_PACK; c++) {
      if (!prog[pk.id][c]) {
        prog[pk.id][c] = {
          unlocked: c === 1,
          passed: false,
          bestScore: 0
        };
      }
    }
  });
  return prog;
}

function savePackProgress(prog) {
  store.set("packChapters", prog);
}

function getChapterPrompts(packId, chapterNum) {
  const all = PROMPTS.filter((p) => p.pack === packId);
  if (!all.length) return [];

  const seed = packId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 100 + chapterNum * 37;
  const shuffled = shuffle(all, mulberry32(seed));

  const prompts = [];
  const start = (chapterNum - 1) * ROUNDS;
  for (let i = 0; i < ROUNDS; i++) {
    const idx = (start + i) % shuffled.length;
    prompts.push(shuffled[idx]);
  }
  return prompts;
}

function renderPacks() {
  const list = $("pack-list");
  if (!list) return;
  list.innerHTML = "";
  const prog = getPackProgress();

  PACKS.forEach((pk) => {
    const pkProg = prog[pk.id] || {};
    let passedCount = 0;
    for (let c = 1; c <= CHAPTERS_PER_PACK; c++) {
      if (pkProg[c] && pkProg[c].passed) passedCount++;
    }

    const card = document.createElement("button");
    card.type = "button";
    card.className = "btn big pack-card";

    const title = document.createElement("div");
    title.className = "btn-main-line";
    title.textContent = `${pk.icono} ${pk.nombre}`;

    const sub = document.createElement("small");
    sub.textContent = `${passedCount}/${CHAPTERS_PER_PACK} capítulos autorizados (requiere 250+ pts)`;

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("div");
    fill.style.width = ((passedCount / CHAPTERS_PER_PACK) * 100) + "%";
    bar.appendChild(fill);

    card.append(title, sub, bar);
    card.addEventListener("click", () => openPackChapters(pk.id));
    list.appendChild(card);
  });
}

let activePackId = null;
function openPackChapters(packId) {
  activePackId = packId;
  const pk = PACKS.find((p) => p.id === packId);
  if (!pk) return;

  $("pack-title").textContent = `${pk.icono} ${pk.nombre} — Capítulos`;
  const list = $("chapter-list");
  list.innerHTML = "";
  const prog = getPackProgress();
  const pkProg = prog[packId];

  for (let c = 1; c <= CHAPTERS_PER_PACK; c++) {
    const chData = pkProg[c];
    const card = document.createElement("div");
    card.className = `chapter-card ${chData.unlocked ? "" : "locked"}`;

    const info = document.createElement("div");
    info.className = "chapter-info";
    const h4 = document.createElement("h4");
    h4.textContent = `Capítulo 0${c} · 7 consultas`;
    const desc = document.createElement("small");

    if (chData.passed) {
      desc.textContent = `AUTORIZADO · Mejor aptitud: ${chData.bestScore} pts`;
    } else if (chData.unlocked) {
      desc.textContent = chData.bestScore > 0
        ? `Mejor registro: ${chData.bestScore} pts (Umbral requerido: 250 pts)`
        : "Pendiente de evaluación (Umbral: 250+ pts)";
    } else {
      desc.textContent = `🔒 Acceso restringido: supera el Capítulo 0${c - 1} con 250+ pts`;
    }
    info.append(h4, desc);

    const action = document.createElement("div");
    if (chData.unlocked) {
      const btnPlay = document.createElement("button");
      btnPlay.type = "button";
      btnPlay.className = "btn primary-action";
      btnPlay.textContent = chData.passed ? "Reevaluar" : "Iniciar";
      btnPlay.addEventListener("click", () => {
        openDeployModal(`DOSSIER: ${pk.nombre.toUpperCase()} - CAPÍTULO ${c}`, () => {
          const prompts = getChapterPrompts(packId, c);
          startGame("pack", prompts, {
            packId,
            chapter: c,
            label: `${pk.nombre} · Cap. 0${c}`
          });
        });
      });
      action.appendChild(btnPlay);
    } else {
      const badge = document.createElement("span");
      badge.className = "chapter-badge";
      badge.textContent = "Restringido";
      action.appendChild(badge);
    }

    card.append(info, action);
    list.appendChild(card);
  }

  showScreen("chapters");
}

/* ---------- Partículas Ambientales de Polvo Táctico (Canvas Ligero) ---------- */
function initAmbientDust() {
  const canvas = $("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const PARTICLE_COUNT = 26;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.4 + 0.6,
    alpha: Math.random() * 0.35 + 0.1,
    vx: (Math.random() - 0.5) * 0.18,
    vy: -(Math.random() * 0.22 + 0.08)
  }));

  function loop() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(218, 224, 233, ${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---------- Modal de Manual de Evaluación (Reglas Operativas) ---------- */
function openRulesModal() {
  const modal = $("modal-rules");
  if (!modal) return;
  modal.classList.remove("hidden", "closing");
  sound.playTone(520, "sine", 0.08, 0.1);
}

function closeRulesModal() {
  const modal = $("modal-rules");
  if (!modal || modal.classList.contains("hidden")) return;
  try {
    localStorage.setItem("spyle_briefing_visto", "true");
  } catch {}
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
  }, 220);
}

function checkFirstVisitBriefing() {
  try {
    const visto = localStorage.getItem("spyle_briefing_visto") || localStorage.getItem("briefing_visto");
    if (!visto) {
      setTimeout(() => {
        openRulesModal();
      }, 350);
    }
  } catch {}
}

/* ---------- Modal de Protocolo de Despliegue Operativo (Confirmación) ---------- */
let pendingDeployAction = null;

function openDeployModal(modeSubtitle, onConfirm, isUnlimited = false) {
  const modal = $("modal-deploy");
  const subEl = $("deploy-mode-subtitle");
  const wcIntelEl = $("deploy-intel-wildcard");
  if (!modal) return;
  if (subEl) subEl.textContent = modeSubtitle;

  if (wcIntelEl) {
    if (isUnlimited) {
      wcIntelEl.innerHTML = "<strong>Comodín:</strong> Deshabilitado en este modo operativo.";
    } else {
      wcIntelEl.innerHTML = "<strong>Comodín:</strong> 1 uso disponible. Se quema si la respuesta es no catalogada.";
    }
  }

  pendingDeployAction = onConfirm;
  modal.classList.remove("hidden", "closing");
  sound.playTone(380, "triangle", 0.09, 0.14);
}

function closeDeployModal() {
  const modal = $("modal-deploy");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
    pendingDeployAction = null;
  }, 220);
}

/* ---------- Modal de Confirmación de Aborto de Misión ---------- */
function openAbortModal() {
  const modal = $("modal-abort");
  if (!modal) return;
  modal.classList.remove("hidden", "closing");
  sound.playTone(280, "sawtooth", 0.12, 0.14);
}

function closeAbortModal() {
  const modal = $("modal-abort");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
  }, 220);
}

function abortMissionAndReturnHome() {
  closeAbortModal();
  clearInterval(timerId);
  clearRejectFeedback();
  clearLiveAttempts();

  // Resetear estado de la partida activa
  if (game) {
    game.started = false;
    game.answered = true;
    game = null;
  }

  showScreen("menu");
  sound.playTone(440, "sine", 0.08, 0.1);
}

function handleHomeClick() {
  const activeScreen = document.querySelector(".screen.active");
  const isGameActive = activeScreen && activeScreen.id === "screen-game" && game && game.started && !game.answered;

  if (isGameActive) {
    openAbortModal();
  } else {
    abortMissionAndReturnHome();
  }
}

/* ---------- Dossier Clasificado de la Sesión (Panel Lateral) ---------- */
function renderSideDossier() {
  const list = $("side-dossier-list");
  if (!list || !game || !Array.isArray(game.prompts)) return;
  list.innerHTML = "";

  game.prompts.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "side-round-card";

    const isCurrent = idx === game.idx && !game.answered;
    const res = game.results && game.results[idx];

    if (res) {
      const isFail = res.tier === "fail" || res.points === 0;
      card.classList.add(isFail ? "failed" : "completed");
    } else if (isCurrent) {
      card.classList.add("current");
    }

    const titleGroup = document.createElement("div");
    titleGroup.className = "side-round-title-group";

    const num = document.createElement("span");
    num.className = "side-round-num";
    num.textContent = `0${idx + 1}. `;

    const text = document.createElement("span");
    text.className = "side-round-text";
    text.textContent = p.texto;

    titleGroup.append(num, text);

    const stamp = document.createElement("span");
    stamp.className = "side-round-stamp";

    if (res) {
      const t = TIERS[res.tier] || TIERS.fail;
      stamp.classList.add(res.points > 0 ? "scored" : "failed");
      stamp.textContent = res.points > 0 ? `${t.emoji} +${res.points}` : "⬛ 0 PTS";
    } else if (isCurrent) {
      stamp.classList.add("in-progress");
      stamp.textContent = "EN CURSO";
    } else {
      stamp.classList.add("pending");
      stamp.textContent = "PENDIENTE";
    }

    card.append(titleGroup, stamp);
    list.appendChild(card);
  });
}
let game = null;
let timerId = null;
let deadline = 0;
let lastTickedSec = -1;
let intentosNoReconocidosPorRonda = [];
let rondaLimpia = true;
let rejectFeedbackTimer = null;
let rejectBorderTimer = null;
let roundEndedAt = 0;

function clearRejectFeedback() {
  clearTimeout(rejectFeedbackTimer);
  clearTimeout(rejectBorderTimer);
  const wrap = $("terminal-input-wrap");
  if (wrap) wrap.classList.remove("input-rejected");
  const fb = $("attempt-feedback");
  if (fb) {
    fb.textContent = "";
    fb.classList.remove("wildcard-burned");
    fb.classList.add("hidden");
  }
}

function triggerRejectFeedback(customMsg = null, isWildcardBurned = false) {
  const wrap = $("terminal-input-wrap");
  if (wrap) {
    wrap.classList.remove("input-rejected");
    void wrap.offsetWidth;
    wrap.classList.add("input-rejected");
    clearTimeout(rejectBorderTimer);
    rejectBorderTimer = setTimeout(() => {
      wrap.classList.remove("input-rejected");
    }, 420);
  }

  const fb = $("attempt-feedback");
  if (fb) {
    fb.textContent = customMsg || "// Término no catalogado - Sigue intentando";
    fb.classList.toggle("wildcard-burned", Boolean(isWildcardBurned));
    fb.classList.remove("hidden");
    clearTimeout(rejectFeedbackTimer);
    rejectFeedbackTimer = setTimeout(() => {
      fb.classList.add("hidden");
      fb.classList.remove("wildcard-burned");
    }, isWildcardBurned ? 3200 : 2000);
  }
}

function createLiveAttemptTag(palabra) {
  const tag = document.createElement("span");
  tag.className = "live-attempt-tag";

  const openX = document.createElement("span");
  openX.className = "live-attempt-x";
  openX.textContent = "[✕";

  const word = document.createElement("span");
  word.className = "live-attempt-word";
  word.textContent = palabra;

  const closeBracket = document.createElement("span");
  closeBracket.className = "live-attempt-x";
  closeBracket.textContent = "]";

  tag.append(openX, " ", word, closeBracket);
  return tag;
}

function clearLiveAttempts() {
  const box = $("intentos-en-vivo");
  if (!box) return;
  box.innerHTML = "";
  box.classList.add("hidden");
}

function renderLiveAttempts(rondaActual) {
  const box = $("intentos-en-vivo");
  if (!box) return;
  box.innerHTML = "";
  const list = Array.isArray(intentosNoReconocidosPorRonda[rondaActual])
    ? intentosNoReconocidosPorRonda[rondaActual]
    : [];
  if (list.length === 0) {
    box.classList.add("hidden");
    return;
  }
  list.forEach((palabra) => {
    box.appendChild(createLiveAttemptTag(palabra));
  });
  box.classList.remove("hidden");
}

function updateSpeedIndicator(leftMs) {
  const fill = $("timer-fill");
  const ind = $("speed-live-indicator");
  const marker = $("timer-speed-marker");
  const inWindow = leftMs >= SPEED_BONUS_MIN_LEFT_MS;

  if (fill) {
    fill.classList.toggle("speed-window", rondaLimpia && inWindow);
  }
  if (marker) {
    marker.classList.toggle("cancelled", !rondaLimpia);
  }
  if (ind) {
    if (!rondaLimpia) {
      ind.textContent = "⚡ +20% VELOCIDAD";
      ind.classList.remove("expired");
      ind.classList.add("cancelled");
    } else if (inWindow) {
      ind.textContent = "⚡ +20% VELOCIDAD";
      ind.classList.remove("expired", "cancelled");
    } else {
      ind.textContent = "⚡ +20% EXPIRADO";
      ind.classList.add("expired");
      ind.classList.remove("cancelled");
    }
  }

  // Sincronización de telemetría de escritorio
  const sideBox = $("side-speed-box");
  const sideText = $("side-speed-text");
  const sideSub = $("side-speed-sub");
  const sideBar = $("side-speed-bar");

  if (sideBox && sideText && sideSub && sideBar) {
    if (!rondaLimpia) {
      sideBox.className = "side-telemetry-box cancelled";
      sideText.textContent = "VELOCIDAD ANULADA";
      sideSub.textContent = "Tiro sucio · Bonificación cancelada";
      sideBar.style.width = "0%";
    } else if (inWindow) {
      const windowRemainingMs = leftMs - SPEED_BONUS_MIN_LEFT_MS;
      const windowPct = Math.max(0, Math.min(100, (windowRemainingMs / 6000) * 100));
      sideBox.className = "side-telemetry-box active";
      sideText.textContent = "+20% SPEED BONUS ACTIVO";
      sideSub.textContent = `Ventana abierta: ${(windowRemainingMs / 1000).toFixed(1)}s restantes`;
      sideBar.style.width = `${windowPct}%`;
    } else {
      sideBox.className = "side-telemetry-box expired";
      sideText.textContent = "VENTANA VELOCIDAD EXPIRADA";
      sideSub.textContent = "Puntuación en valor nominal (1.0x)";
      sideBar.style.width = "0%";
    }
  }
}

function setJudgeSeal(tierKeyOrIdle, customOpts = {}) {
  const seal = $("judge-seal");
  if (!seal) return;

  if (tierKeyOrIdle === "idle" || !TIERS[tierKeyOrIdle]) {
    seal.dataset.state = customOpts.overrideState || "idle";
    seal.classList.remove("stamped");
    $("stamp-icon").textContent = customOpts.icon || "🗂️";
    $("stamp-verdict").textContent = customOpts.stamp || "[ EN ESPERA DE INTERROGATORIO ]";
    $("seal-subtext").textContent = customOpts.subtext || "Estación de escucha activa · Evalúe la cobertura cultural del agente.";
    $("seal-channel").textContent = customOpts.channel || "CANAL DE VERIFICACIÓN // ACTIVO";
    $("seal-serial").textContent = customOpts.serial || `REF: K7-${String(dayNumber()).padStart(3, "0")}`;
    return;
  }

  const t = TIERS[tierKeyOrIdle];
  seal.dataset.state = t.state;
  $("stamp-icon").textContent = t.emoji;
  $("stamp-verdict").textContent = customOpts.timeout ? "[ TIEMPO AGOTADO · DELATADO ]" : t.stamp;
  $("seal-subtext").textContent = customOpts.timeout
    ? "Silencio sospechoso ante el interrogador. La tapadera ha caído."
    : t.subtext;
  $("seal-channel").textContent = t.channel;
  $("seal-serial").textContent = `DICTAMEN: +${customOpts.pts !== undefined ? customOpts.pts : t.pts} PTS`;

  // Reiniciar animación mecánica de impacto de sello
  seal.classList.remove("stamped");
  void seal.offsetWidth;
  seal.classList.add("stamped");
}

/* ---------- Micro-interacciones: cascada (staggered UI) y máquina de escribir ---------- */
const STAGGER_STEP_MS = 50;
let promptTypeRaf = null;

function applyStagger(container) {
  if (!container) return;
  Array.from(container.children).forEach((el, i) => {
    el.style.setProperty("--i", i);
    el.classList.add("stagger-in");
  });
}

function typewritePrompt(el, text, durationMs = 400) {
  cancelAnimationFrame(promptTypeRaf);
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !text) {
    el.textContent = text;
    return;
  }
  el.classList.remove("declassify");
  void el.offsetWidth;
  el.classList.add("declassify");
  const start = performance.now();
  const step = (now) => {
    const frac = Math.min(1, (now - start) / durationMs);
    el.textContent = text.slice(0, Math.ceil(text.length * frac));
    if (frac < 1) {
      promptTypeRaf = requestAnimationFrame(step);
    } else {
      el.textContent = text;
      el.classList.remove("declassify");
    }
  };
  el.textContent = "";
  promptTypeRaf = requestAnimationFrame(step);
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const target = $("screen-" + name);
  if (target) target.classList.add("active");

  ["pack-list", "chapter-list", "bestiary-list", "calendar-grid"].forEach((id) => applyStagger($(id)));
  if (name === "menu") applyStagger(target && target.querySelector(".menu-actions"));

  if (name === "menu") {
    setJudgeSeal("idle");
    updateTelemetry(0, 0);
    refreshMenu();
  }
}

function roundPoints(r) {
  return typeof r.points === "number" ? r.points : TIERS[r.tier].pts;
}

function totalPoints() {
  return game ? game.results.reduce((s, r) => s + roundPoints(r), 0) : 0;
}

function totalCoverUnits() {
  return game
    ? game.results.reduce((s, r) => s + (r.meters !== undefined ? r.meters : roundPoints(r) * COVER_UNITS_PER_POINT), 0)
    : 0;
}

function updateTelemetry(points, coverUnits = null) {
  const frac = Math.min(points / MAX_GAUGE_POINTS, 1);
  const pct = (frac * 100).toFixed(2);

  const fill = $("depthfill");
  const sub = $("depth-sub");
  if (fill) fill.style.height = pct + "%";
  if (sub) sub.style.bottom = pct + "%";

  const gaugeLabel = $("gauge-label");
  if (gaugeLabel) gaugeLabel.textContent = points + " pts";

  const coverEl = $("depthtext");
  const displayCover = coverUnits !== null ? coverUnits : points * COVER_UNITS_PER_POINT;
  if (coverEl) coverEl.textContent = String(displayCover).padStart(4, "0");
}

function saveDaily() {
  if (!game || game.mode !== "daily") return;
  const isDone = game.results.length >= game.prompts.length;
  if (game.day === dayNumber()) {
    store.set("daily", {
      day: game.day,
      results: game.results,
      unrecognizedByRound: intentosNoReconocidosPorRonda,
      wildcardUsed: Boolean(game.wildcardUsed),
      idx: game.idx,
      started: game.started && !game.answered,
      done: isDone
    });
  }
  if (isDone && game.day) {
    const history = store.get("daily_history", {}) || {};
    history[game.day] = {
      day: game.day,
      score: totalPoints(),
      emojis: game.results.map((r) => TIERS[r.tier]?.emoji || "⬛").join(""),
      done: true,
      timestamp: Date.now()
    };
    store.set("daily_history", history);
  }
}

function focusInput() {
  const input = $("answer-input");
  if (!input) return;
  input.focus({ preventScroll: true });
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
  setTimeout(() => input.focus({ preventScroll: true }), 40);
}

/* ---------- Lógica del Comodín (Protocolo Doble Fondo) ---------- */
function updateWildcardUI() {
  const btn = $("btn-wildcard");
  const label = $("wc-label");
  const sideWcState = $("side-wc-state");
  const sideWcDisplay = $("side-wildcard-display");
  if (!btn || !label || !game) return;

  // Bloqueo exclusivo para Modo Ilimitado
  if (game.mode === "unlimited" || game.wildcardAvailable === false) {
    btn.className = "btn-wildcard disabled-mode";
    btn.disabled = true;
    label.textContent = "[ COMODÍN: NO DISPONIBLE EN ENTRENAMIENTO ]";
    if (sideWcState) {
      sideWcState.className = "side-wc-state disabled-mode";
      sideWcState.textContent = "NO DISPONIBLE";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display disabled-mode";
    }
    return;
  }

  if (sideWcDisplay) {
    sideWcDisplay.classList.remove("disabled-mode");
  }

  if (game.wildcardBurnedThisRound) {
    btn.className = "btn-wildcard burned";
    btn.disabled = true;
    label.textContent = "[COMODÍN QUEMADO - FALLO DE INFILTRACIÓN]";
    if (sideWcState) {
      sideWcState.className = "side-wc-state burned";
      sideWcState.textContent = "COMODÍN QUEMADO";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display burned";
    }
  } else if (game.wildcardUsed) {
    btn.className = "btn-wildcard used";
    btn.disabled = true;
    label.textContent = "Protocolo Doble Fondo: Consumido en esta sesión";
    if (sideWcState) {
      sideWcState.className = "side-wc-state used";
      sideWcState.textContent = "CONSUMIDO";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display";
    }
  } else if (!rondaLimpia) {
    btn.className = "btn-wildcard locked-dirty";
    btn.disabled = true;
    label.textContent = "Protocolo Doble Fondo: Bloqueado en esta ronda (1.0x nominal)";
    if (sideWcState) {
      sideWcState.className = "side-wc-state locked";
      sideWcState.textContent = "BLOQUEADO EN ESTA RONDA";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display";
    }
  } else if (game.wildcardActive) {
    btn.className = "btn-wildcard active";
    btn.disabled = false;
    label.textContent = "⚡ DOBLE FONDO ARMADO (x2 cobertura y desclasifica archivo con 65+ pts)";
    if (sideWcState) {
      sideWcState.className = "side-wc-state active";
      sideWcState.textContent = "⚡ DOBLE FONDO ARMADO";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display active";
    }
  } else {
    btn.className = "btn-wildcard";
    btn.disabled = false;
    label.textContent = "🃏 Protocolo Doble Fondo: Disponible (Pulsa para armar)";
    if (sideWcState) {
      sideWcState.className = "side-wc-state ready";
      sideWcState.textContent = "DISPONIBLE PARA ACTIVAR";
    }
    if (sideWcDisplay) {
      sideWcDisplay.className = "side-wildcard-display";
    }
  }
}

function toggleWildcard() {
  if (!game || game.mode === "unlimited" || game.wildcardAvailable === false || game.answered || game.wildcardUsed || !rondaLimpia) return;
  game.wildcardActive = !game.wildcardActive;
  if (game.wildcardActive) {
    sound.playTone(840, "triangle", 0.1, 0.16);
  } else {
    sound.playTone(420, "sine", 0.07, 0.12);
  }
  updateWildcardUI();
  focusInput();
}

/* ---------- Flujo de Partida ---------- */
function startGame(mode, prompts, extra = {}) {
  intentosNoReconocidosPorRonda = prompts.map(() => []);
  rondaLimpia = true;
  const isUnlimitedMode = mode === "unlimited";
  game = {
    mode,
    prompts,
    results: [],
    idx: 0,
    started: false,
    answered: false,
    wildcardAvailable: !isUnlimitedMode,
    wildcardUsed: isUnlimitedMode,
    wildcardActive: false,
    wildcardBurnedThisRound: false,
    ...extra
  };
  showScreen("game");
  $("mode-label").textContent = extra.label || "";
  startRound();
}

function startRound() {
  const rondaActual = game.idx;
  const p = game.prompts[rondaActual];
  if (!Array.isArray(intentosNoReconocidosPorRonda[rondaActual])) {
    intentosNoReconocidosPorRonda[rondaActual] = [];
  }

  game.started = true;
  game.answered = false;
  game.wildcardBurnedThisRound = false;
  rondaLimpia = intentosNoReconocidosPorRonda[rondaActual].length === 0;
  lastTickedSec = -1;
  clearRejectFeedback();
  renderLiveAttempts(rondaActual);
  saveDaily();

  $("round-label").textContent = `${rondaActual + 1}/${game.prompts.length}`;
  $("score-label").textContent = totalPoints() + " pts";
  typewritePrompt($("prompt-text"), p.texto, 400);
  $("result").classList.add("hidden");
  $("result-speed-bonus").classList.add("hidden");
  $("result-wildcard-note").classList.add("hidden");

  const input = $("answer-input");
  input.value = "";
  input.disabled = false;
  $("btn-submit").disabled = false;

  updateWildcardUI();
  setJudgeSeal("idle", {
    stamp: `[ CONSULTA 0${rondaActual + 1}/0${game.prompts.length} · EN ESCUCHA ]`,
    subtext: "Transmita una referencia local creíble antes de que expire el tiempo.",
    channel: "INTERROGATORIO EN CURSO",
    serial: `EXP: ${p.id.toUpperCase()}`
  });
  updateTelemetry(totalPoints(), totalCoverUnits());

  // Actualizar telemetría lateral de escritorio
  const sideMissionDate = $("side-mission-date");
  if (sideMissionDate) {
    sideMissionDate.textContent = game.day ? `EXPEDIENTE #${game.day}` : "SIMULACRO CONTINUO";
  }
  renderSideDossier();

  deadline = performance.now() + ROUND_SECONDS * 1000;
  clearInterval(timerId);
  timerId = setInterval(tick, 50);
  tick();

  focusInput();
}

function tick() {
  const left = Math.max(0, deadline - performance.now());
  const sec = Math.ceil(left / 1000);

  const fill = $("timer-fill");
  if (fill) {
    fill.style.width = (left / (ROUND_SECONDS * 1000)) * 100 + "%";
    fill.classList.toggle("warn", left < 10000 && left >= 6000);
    fill.classList.toggle("low", left < 6000);
  }

  // Temporizador Circular Táctico (SVG)
  const cProgress = $("c-timer-progress");
  const cText = $("circular-timer-text");
  const CIRCLE_CIRCUMFERENCE = 339.292; // 2 * PI * 54
  if (cProgress) {
    const fraction = left / (ROUND_SECONDS * 1000);
    const strokeOffset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
    cProgress.style.strokeDashoffset = strokeOffset;
    cProgress.classList.toggle("speed-window", rondaLimpia && left >= SPEED_BONUS_MIN_LEFT_MS);
    cProgress.classList.toggle("warn", left < 10000 && left >= 6000);
    cProgress.classList.toggle("low", left < 6000);
  }
  if (cText) {
    cText.textContent = sec + "s";
  }

  updateSpeedIndicator(left);
  const timerText = $("timer-text");
  if (timerText) timerText.textContent = sec + "s";

  if (sec <= 5 && sec > 0 && sec !== lastTickedSec) {
    lastTickedSec = sec;
    sound.tick(sec <= 2);
  }

  if (left <= 0) {
    submitAnswer(true);
  }
}

function submitAnswer(timeout = false) {
  if (!game || game.answered) return;

  const rondaActual = game.idx;
  const p = game.prompts[rondaActual];
  const input = $("answer-input");
  const palabraEscrita = input.value.trim();

  if (!Array.isArray(intentosNoReconocidosPorRonda[rondaActual])) {
    intentosNoReconocidosPorRonda[rondaActual] = [];
  }

  // Envío manual durante los 25 s: permitir intentos múltiples si no está catalogada
  if (!timeout) {
    if (!palabraEscrita) {
      input.focus({ preventScroll: true });
      return;
    }

    const candidateTier = evaluate(p, palabraEscrita);
    if (candidateTier === "fail") {
      // El temporizador NO se detiene: registrar palabra no reconocida y mostrar en #intentos-en-vivo
      const bucket = intentosNoReconocidosPorRonda[rondaActual];
      if (!bucket.some((w) => w.toLowerCase() === palabraEscrita.toLowerCase())) {
        intentosNoReconocidosPorRonda[rondaActual].push(palabraEscrita);
      }
      renderLiveAttempts(rondaActual);

      // Cláusula de Multiplicador Limpio / Tiro Único: anular bonificaciones tras primer fallo
      rondaLimpia = false;
      updateSpeedIndicator(Math.max(0, deadline - performance.now()));

      let burnedWildcardNow = false;
      if (game.wildcardActive) {
        game.wildcardActive = false;
        game.wildcardUsed = true;
        game.wildcardBurnedThisRound = true;
        burnedWildcardNow = true;
      }
      updateWildcardUI();
      saveDaily();

      input.value = "";
      input.focus({ preventScroll: true });
      sound.rejectBeep();
      if (burnedWildcardNow) {
        sound.playTone(150, "sawtooth", 0.18, 0.16);
        triggerRejectFeedback("[COMODÍN QUEMADO - FALLO DE INFILTRACIÓN]", true);
      } else {
        triggerRejectFeedback();
      }
      return;
    }

    // Acierto (> 0 pts): detener inmediatamente el temporizador y puntuar
    game.answered = true;
    clearInterval(timerId);
    clearRejectFeedback();
    roundEndedAt = performance.now();

    const tier = candidateTier;
    const t = TIERS[tier];

    // Interceptar condición Easter Egg de desbloqueo criptográfico
    checkEasterEggUnlock(p, palabraEscrita);

    input.disabled = true;
    $("btn-submit").disabled = true;

    // Bonificación de velocidad (+20%) SOLO si rondaLimpia === true y quedan >= 19 s; si no, valor nominal 1.0x
    const timeLeftMs = deadline - performance.now();
    const elapsedMs = (ROUND_SECONDS * 1000) - timeLeftMs;
    const speedBonus = rondaLimpia && t.pts > 0 && timeLeftMs >= SPEED_BONUS_MIN_LEFT_MS;
    const roundPts = speedBonus ? Math.ceil(t.pts * SPEED_BONUS_MULT) : t.pts;

    // Evaluaciones tácticas inmediatas en la ronda activa:
    // 1. logro_reflejos_frio: Responde de forma válida en menos de 2,0 segundos
    if (elapsedMs < 2000 && t.pts > 0) {
      unlockAchievement("logro_reflejos_frio");
    }

    // 2. logro_al_limite: Acierta una palabra válida quedando menos de 1,0 segundo en el temporizador
    if (timeLeftMs <= 1000 && timeLeftMs > 0 && t.pts > 0) {
      unlockAchievement("logro_al_limite");
    }

    // Comprobar activación de Comodín (solo aplicable si rondaLimpia === true)
    let roundCover = roundPts * COVER_UNITS_PER_POINT;
    let isWildcardDoubled = false;
    let unlockedArchive = null;
    let wildcardFailedAttempt = false;

    if (rondaLimpia && game.wildcardActive) {
      game.wildcardUsed = true;
      game.wildcardActive = false;

      if (t.pts >= 65) {
        isWildcardDoubled = true;
        roundCover = roundCover * 2;
        unlockAchievement("logro_comodin_dorado");
      } else {
        wildcardFailedAttempt = true;
      }
    } else if (game.wildcardActive) {
      game.wildcardUsed = true;
      game.wildcardActive = false;
    }

    updateWildcardUI();

    game.results.push({
      tier,
      answer: palabraEscrita,
      points: roundPts,
      speedBonus,
      meters: roundCover,
      wildcardDoubled: isWildcardDoubled,
      unrecognizedAttempts: intentosNoReconocidosPorRonda[rondaActual].slice()
    });
    game.idx++;

    setJudgeSeal(tier, { timeout: false, pts: roundPts });
    sound.tierSound(tier);

    updateTelemetry(totalPoints(), totalCoverUnits());
    $("score-label").textContent = totalPoints() + " pts";
    $("result-emoji").textContent = t.emoji;
    $("result-stamp-tag").textContent = t.stamp;
    $("result-text").textContent = `${t.nombre} · +${roundPts} pts (+${fmt(roundCover)} cob.)`;

    const speedEl = $("result-speed-bonus");
    if (speedEl) {
      if (speedBonus) {
        speedEl.textContent = `⚡ +20% Impulso de velocidad (${t.pts} → ${roundPts} pts)`;
        speedEl.classList.remove("hidden");
        speedEl.style.animation = "none";
        void speedEl.offsetWidth;
        speedEl.style.animation = "";
      } else {
        speedEl.classList.add("hidden");
      }
    }

    const wcNote = $("result-wildcard-note");
    if (wcNote) {
      if (isWildcardDoubled) {
        wcNote.textContent = `🃏 DOBLE FONDO EXITOSO: Cobertura x2 (+${fmt(roundCover)}) ${unlockedArchive ? `· Desclasificado: ${unlockedArchive.icono} ${unlockedArchive.nombre}` : ""}`;
        wcNote.classList.remove("hidden");
      } else if (game.wildcardBurnedThisRound) {
        wcNote.textContent = "🃏 [COMODÍN QUEMADO - FALLO DE INFILTRACIÓN] · Acreditado valor nominal base (1.0x).";
        wcNote.classList.remove("hidden");
      } else if (wildcardFailedAttempt) {
        wcNote.textContent = "🃏 Protocolo Doble Fondo agotado sin efecto (exigía nivel de 65+ pts).";
        wcNote.classList.remove("hidden");
      } else {
        wcNote.classList.add("hidden");
      }
    }

    $("btn-next").textContent = game.idx >= game.prompts.length ? "Emitir expediente final ➔" : "Siguiente consulta ➔";
    $("result").classList.remove("hidden");

    renderSideDossier();
    saveDaily();
    $("btn-next").focus();
    return;
  }

  // Agotamiento del tiempo (0 s): calificar definitivamente con 0 pts (⬛ Tapadera caída)
  game.answered = true;
  clearInterval(timerId);
  clearRejectFeedback();
  roundEndedAt = performance.now();

  input.value = "";
  input.disabled = true;
  $("btn-submit").disabled = true;

  let wildcardFailedAttempt = false;
  if (game.wildcardActive) {
    game.wildcardUsed = true;
    game.wildcardActive = false;
    wildcardFailedAttempt = true;
  }
  updateWildcardUI();

  const roundAttempts = intentosNoReconocidosPorRonda[rondaActual].slice();
  const t = TIERS.fail;

  game.results.push({
    tier: "fail",
    answer: "",
    points: 0,
    speedBonus: false,
    meters: 0,
    wildcardDoubled: false,
    unrecognizedAttempts: roundAttempts
  });
  game.idx++;

  setJudgeSeal("fail", { timeout: true, pts: 0 });
  sound.tierSound("fail");

  updateTelemetry(totalPoints(), totalCoverUnits());
  $("score-label").textContent = totalPoints() + " pts";
  $("result-emoji").textContent = t.emoji;
  $("result-stamp-tag").textContent = "[ TIEMPO AGOTADO · TAPADERA CAÍDA ]";
  $("result-text").textContent = "⬛ Tapadera caída · 0 pts";
  $("result-speed-bonus").classList.add("hidden");

  const wcNote = $("result-wildcard-note");
  if (wcNote) {
    if (game.wildcardBurnedThisRound) {
      wcNote.textContent = "🃏 [COMODÍN QUEMADO - FALLO DE INFILTRACIÓN] · Tiempo agotado.";
      wcNote.classList.remove("hidden");
    } else if (wildcardFailedAttempt) {
      wcNote.textContent = "🃏 Protocolo Doble Fondo agotado sin efecto (tiempo expirado).";
      wcNote.classList.remove("hidden");
    } else {
      wcNote.classList.add("hidden");
    }
  }

  $("btn-next").textContent = game.idx >= game.prompts.length ? "Emitir expediente final ➔" : "Siguiente consulta ➔";
  $("result").classList.remove("hidden");

  renderSideDossier();
  saveDaily();
  $("btn-next").focus();
}

function nextStep() {
  if (!game) return;
  if (game.idx >= game.prompts.length) {
    return finish();
  }
  startRound();
}

function finish() {
  if (game.mode === "daily") saveDaily();

  if (game.mode === "pack" && game.packId && game.chapter) {
    const pts = totalPoints();
    const prog = getPackProgress();
    const chData = prog[game.packId][game.chapter];

    chData.bestScore = Math.max(chData.bestScore, pts);
    if (pts >= CHAPTER_PASS_POINTS) {
      chData.passed = true;
      const nextCh = game.chapter + 1;
      if (prog[game.packId][nextCh]) {
        prog[game.packId][nextCh].unlocked = true;
      }
    }
    savePackProgress(prog);
  }

  renderFinal();
}

/* ---------- Tarjeta Final de Misión Compartible y Desglose ---------- */
function shareText() {
  const pts = totalPoints();
  const emojis = game.results.map((r) => TIERS[r.tier].emoji).join("");
  return `SPYLE #${game.day || dayNumber()} 🗂️\nAptitud de Infiltración: ${pts} pts\n${emojis}\nspyle.app`;
}

function renderFinal() {
  showScreen("final");
  const pts = totalPoints();
  const cover = totalCoverUnits();

  if (pts >= 500) {
    setJudgeSeal("trillion", { pts });
  } else if (pts >= 250) {
    setJudgeSeal("schooler", { pts });
  } else if (pts === 0) {
    setJudgeSeal("fail", { pts: 0 });
  } else {
    setJudgeSeal("tooclever", { pts });
  }

  updateTelemetry(pts, cover);

  if (game && game.mode === "daily" && game.day) {
    const history = store.get("daily_history", {}) || {};
    history[game.day] = {
      day: game.day,
      score: pts,
      emojis: game.results.map((r) => TIERS[r.tier]?.emoji || "⬛").join(""),
      done: true,
      timestamp: Date.now()
    };
    store.set("daily_history", history);
  }

  // --- EVALUACIÓN DE CONDECORACIONES TÁCTICAS AL FINALIZAR MISIÓN ---
  if (game && Array.isArray(game.results) && game.results.length >= ROUNDS) {
    // 1. logro_doble_centenario: Clava dos palabras de 100 puntos en una misma misión
    const count100 = game.results.filter((r) => TIERS[r.tier] && TIERS[r.tier].pts === 100).length;
    if (count100 >= 2) {
      unlockAchievement("logro_doble_centenario");
    }

    // 2. logro_umbral_500: Consigue 500 o más puntos en una sola misión
    if (pts >= 500) {
      unlockAchievement("logro_umbral_500");
    }

    // 3. logro_pleno_700: Pleno perfecto de 700 pts base (todas las rondas de 100 pts)
    const isPleno700 = game.results.length === ROUNDS && game.results.every((r) => TIERS[r.tier] && TIERS[r.tier].pts === 100);
    if (isPleno700 && pts >= 700) {
      unlockAchievement("logro_pleno_700");
    }

    // 4. logro_pleno_velocidad: Bonificación de velocidad en las 7 rondas de la misión
    const isPlenoVelocidad = game.results.length === ROUNDS && game.results.every((r) => Boolean(r.speedBonus));
    if (isPlenoVelocidad) {
      unlockAchievement("logro_pleno_velocidad");
    }

    // 5. logro_tiro_limpio: Completa las 7 rondas sin un solo intento fallido o no catalogado (efectividad 100% al primer intento)
    const isTiroLimpio = game.results.length === ROUNDS && game.results.every((r, idx) => {
      if (r.tier === "fail") return false;
      const unrec = Array.isArray(r.unrecognizedAttempts)
        ? r.unrecognizedAttempts
        : (Array.isArray(intentosNoReconocidosPorRonda[idx]) ? intentosNoReconocidosPorRonda[idx] : []);
      return unrec.length === 0;
    });
    if (isTiroLimpio) {
      unlockAchievement("logro_tiro_limpio");
    }

    // 6. Registro de estadísticas históricas acumuladas y marcador persistente
    const stats = store.get("player_stats", { completedMissions: 0, totalHistoricalPoints: 0 });
    let puntosHistoricosTotales = getPuntosHistoricosTotales();

    // Solo sumar si esta partida es una sesión completa recién terminada
    if (!game._historicalRecorded) {
      stats.completedMissions = (stats.completedMissions || 0) + 1;
      puntosHistoricosTotales = sumarPuntosHistoricos(pts);
      stats.totalHistoricalPoints = puntosHistoricosTotales;
      store.set("player_stats", stats);
      game._historicalRecorded = true;
    }

    // Vinculación directa de logro_veterano_red con spyle_puntos_totales
    if (stats.completedMissions >= 5 && puntosHistoricosTotales >= 2000) {
      unlockAchievement("logro_veterano_red");
    }
  }

  let title = game.label || "Informe de Misión";
  if (game.mode === "pack" && game.chapter) {
    title += pts >= CHAPTER_PASS_POINTS ? " — [CAPÍTULO AUTORIZADO]" : " — [ACCESO DENEGADO: <250 PTS]";
  }
  $("final-title").textContent = title;
  $("final-head").textContent = `SPYLE #${game.day || dayNumber()} 🗂️`;
  $("final-score").textContent = `${pts} pts`;
  $("final-emojis").textContent = game.results.map((r) => TIERS[r.tier].emoji).join("");
  $("final-depth").textContent = `Índice de Cobertura Operativa: ${fmt(cover)} uds.${cover > pts * COVER_UNITS_PER_POINT ? " · [Doble Fondo x2 aplicado]" : ""}`;
  $("copy-msg").textContent = "";

  const box = $("breakdown");
  box.innerHTML = "";

  game.prompts.forEach((p, i) => {
    const r = game.results[i];
    const t = TIERS[r.tier];
    const rPts = roundPoints(r);
    const isFail = r.tier === "fail" || rPts === 0;
    const unrecognized = Array.isArray(r.unrecognizedAttempts)
      ? r.unrecognizedAttempts
      : (Array.isArray(intentosNoReconocidosPorRonda[i]) ? intentosNoReconocidosPorRonda[i] : []);

    const row = document.createElement("div");
    row.className = `row stagger-in ${isFail ? "row-fail" : ""} ${r.wildcardDoubled ? "row-wildcard" : ""}`;
    row.style.setProperty("--i", i);

    const headWrap = document.createElement("div");
    headWrap.className = "row-top";

    const head = document.createElement("div");
    head.className = "row-header";
    const tags = [
      r.speedBonus ? "⚡ +20% velocidad" : "",
      r.wildcardDoubled ? "🃏 x2 Doble Fondo" : ""
    ].filter(Boolean).join(" · ");
    head.textContent = `${t.emoji} ${p.texto} — ${rPts} pts${tags ? ` [${tags}]` : ""}`;
    headWrap.appendChild(head);

    const mine = document.createElement("div");
    mine.className = "row-answer";
    if (isFail) {
      mine.append("Estado: ");
      const b = document.createElement("b");
      b.textContent = "⬛ Tapadera caída (tiempo agotado)";
      mine.append(b);
    } else {
      mine.append("Respuesta validada: ");
      const b = document.createElement("b");
      b.textContent = r.answer;
      mine.append(b);
    }

    const ex = document.createElement("div");
    ex.className = "row-example";
    ex.append("🎖️ Referencia Agente Durmiente (100 pts): ");
    const e = document.createElement("b");
    e.textContent = p.ejemplo;
    ex.append(e);

    row.append(headWrap, mine, ex);

    if (unrecognized.length > 0) {
      const unrecBlock = document.createElement("div");
      unrecBlock.className = "unrecognized-block";

      const unrecLabel = document.createElement("div");
      unrecLabel.className = "unrecognized-label";
      unrecLabel.textContent = "Intentos no reconocidos:";

      const unrecItems = document.createElement("div");
      unrecItems.className = "unrecognized-items";

      unrecognized.forEach((palabra) => {
        const chip = document.createElement("span");
        chip.className = "unrecognized-chip";

        const wordSpan = document.createElement("span");
        wordSpan.className = "unrecognized-word";
        wordSpan.textContent = `[${palabra}]`;

        const claimBtn = document.createElement("button");
        claimBtn.className = "btn-claim-inline";
        claimBtn.type = "button";
        claimBtn.textContent = "[ ✉️ Reclamar ]";
        claimBtn.addEventListener("click", () => openSuggestionModal(p, palabra, claimBtn));

        chip.append(wordSpan, claimBtn);
        unrecItems.appendChild(chip);
      });

      unrecBlock.append(unrecLabel, unrecItems);
      row.appendChild(unrecBlock);
    }

    box.appendChild(row);
  });
}

async function copyResult() {
  const text = shareText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* sin portapapeles */ }
    ta.remove();
  }
  $("copy-msg").textContent = "✔ Expediente copiado al portapapeles.";
}

/* ---------- Sistema Blindado de Transmisión de Inteligencia de Campo ---------- */
let currentSuggestingPrompt = null;
let currentClaimButton = null;
let suggestionCloseTimer = null;
let modalHideTimer = null;

function openSuggestionModal(prompt, initialWord = "", triggerBtn = null) {
  clearTimeout(suggestionCloseTimer);
  clearTimeout(modalHideTimer);
  $("modal-suggestion").classList.remove("closing");
  currentSuggestingPrompt = prompt;
  currentClaimButton = triggerBtn;

  const promptEl = $("modal-prompt-text");
  if ("value" in promptEl) {
    promptEl.value = prompt.texto;
  } else {
    promptEl.textContent = prompt.texto;
  }

  const wordInput = $("sug-word");
  wordInput.value = initialWord || "";
  wordInput.disabled = false;

  const submitBtn = $("btn-submit-sug");
  submitBtn.disabled = false;

  const statusEl = $("sug-status");
  statusEl.textContent = "";
  statusEl.classList.add("hidden");

  $("modal-suggestion").classList.remove("hidden");
  wordInput.focus();
  wordInput.setSelectionRange(wordInput.value.length, wordInput.value.length);
}

function closeSuggestionModal() {
  clearTimeout(suggestionCloseTimer);
  const modal = $("modal-suggestion");
  currentSuggestingPrompt = null;
  currentClaimButton = null;
  if (modal.classList.contains("hidden")) return;
  modal.classList.add("closing");
  clearTimeout(modalHideTimer);
  modalHideTimer = setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("closing");
  }, 180);
}

async function transmitirSugerencia(categoria, palabra) {
  const cleanWord = palabra.trim();
  if (!cleanWord) {
    $("sug-word").focus();
    return;
  }

  // Desactivar controles para impedir envíos dobles
  $("sug-word").disabled = true;
  $("btn-submit-sug").disabled = true;

  // Respaldo local opcional en localStorage
  const localLog = store.get("suggestions_log", []);
  localLog.push({
    promptTitle: categoria,
    suggestedWord: cleanWord,
    suggestedTier: "Sugerido por agente",
    ts: new Date().toISOString()
  });
  store.set("suggestions_log", localLog.slice(-100));

  if (WEBHOOK_URL && WEBHOOK_URL.trim() !== "") {
    try {
      await enviarSugerenciaAGoogle(categoria, cleanWord);
    } catch {
      /* Resiliencia ante modo offline o corte de red */
    }
  }

  if (currentClaimButton) {
    currentClaimButton.textContent = "[ ✓ Reclamada ]";
    currentClaimButton.disabled = true;
    currentClaimButton.classList.add("claimed");
  }

  const statusEl = $("sug-status");
  statusEl.textContent = "✓ INFORME TRANSMITIDO CON ÉXITO";
  statusEl.classList.remove("hidden");
  sound.playTone(760, "triangle", 0.08, 0.12);

  clearTimeout(suggestionCloseTimer);
  suggestionCloseTimer = setTimeout(() => {
    closeSuggestionModal();
  }, 1500);
}

/* ---------- Menú Principal ---------- */
function refreshMenu() {
  const d = store.get("daily", null);
  const day = dayNumber();
  $("daily-status").textContent = d && d.day === day
    ? (d.done ? `Expediente #${day} completado ✔ — ver informe` : `Interrogatorio en curso (${d.results.length}/${ROUNDS})`)
    : `Expediente #${day} — listo para evaluación`;

  updateAchievementsStatus();
}

function startDaily() {
  const day = dayNumber();
  const prompts = dailyPrompts(day);
  const saved = store.get("daily", null);
  const extra = { day, label: `Expediente Diario #${day}` };

  if (saved && saved.day === day) {
    intentosNoReconocidosPorRonda = Array.isArray(saved.unrecognizedByRound)
      ? prompts.map((_, idx) => Array.isArray(saved.unrecognizedByRound[idx]) ? saved.unrecognizedByRound[idx].slice() : [])
      : prompts.map((_, idx) => (saved.results[idx] && Array.isArray(saved.results[idx].unrecognizedAttempts)) ? saved.results[idx].unrecognizedAttempts.slice() : []);

    rondaLimpia = true;
    game = {
      mode: "daily",
      prompts,
      results: saved.results,
      idx: saved.idx,
      started: false,
      answered: false,
      wildcardUsed: Boolean(saved.wildcardUsed),
      wildcardActive: false,
      wildcardBurnedThisRound: false,
      ...extra
    };
    if (saved.done) return renderFinal();
    if (saved.started) {
      const prevUnrec = (intentosNoReconocidosPorRonda[game.idx] || []).slice();
      game.results.push({
        tier: "fail",
        answer: "",
        points: 0,
        speedBonus: false,
        meters: 0,
        wildcardDoubled: false,
        unrecognizedAttempts: prevUnrec
      });
      game.idx++;
      saveDaily();
      if (game.idx >= prompts.length) return renderFinal();
    }
    showScreen("game");
    $("mode-label").textContent = extra.label;
    return startRound();
  }
  startGame("daily", prompts, extra);
}


/* ---------- Sistema de Desbloqueo por Easter Egg ---------- */
function checkEasterEggUnlock(prompt, word) {
  if (!prompt || !word) return false;
  const clean = normalize(word);
  const cleanRaw = normalizeInput(word);
  const lowerWord = word.toLowerCase().trim();

  let isMatch = false;

  // 1. Metadatos directos del prompt
  if (prompt.easterEgg) {
    const eeNorm = normalize(prompt.easterEgg);
    if (clean === eeNorm || cleanRaw === eeNorm || lowerWord === prompt.easterEgg.toLowerCase().trim()) {
      isMatch = true;
    }
  }

  // 2. Metadatos de la misión del día
  if (!isMatch && typeof DAILY_MISSIONS !== "undefined" && game && game.day) {
    const mission = DAILY_MISSIONS[game.day] || DAILY_MISSIONS[`dia_${game.day}`] || DAILY_MISSIONS[dayNumber()];
    if (mission && mission.easterEgg && mission.easterEgg.promptId === prompt.id) {
      const eeNorm = normalize(mission.easterEgg.word);
      if (clean === eeNorm || cleanRaw === eeNorm || lowerWord === mission.easterEgg.word.toLowerCase().trim()) {
        isMatch = true;
      }
    }
  }

  if (isMatch) {
    triggerEasterEggUnlock();
    return true;
  }
  return false;
}

function triggerEasterEggUnlock() {
  localStorage.setItem("spyle_archivo_desbloqueado", "true");
  unlockAchievement("logro_criptografo");
  updateCalendarVisibility();

  const modal = $("modal-easter-egg");
  if (!modal) return;
  modal.classList.remove("hidden", "closing");

  // Alarma acústica táctica
  sound.playTone(340, "sawtooth", 0.12, 0.2);
  setTimeout(() => sound.playTone(520, "sawtooth", 0.12, 0.2), 140);
  setTimeout(() => sound.playTone(880, "sawtooth", 0.15, 0.22), 280);
  setTimeout(() => sound.playTone(1320, "triangle", 0.25, 0.25), 440);
}

function closeEasterEggModal() {
  const modal = $("modal-easter-egg");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
  }, 220);
}

function updateCalendarVisibility() {
  const isUnlocked = localStorage.getItem("spyle_archivo_desbloqueado") === "true" || localStorage.getItem("archivo_calendario_desbloqueado") === "true";
  const headerBtn = $("btn-header-calendar");
  const menuBtn = $("btn-calendar");

  if (headerBtn) {
    headerBtn.style.display = isUnlocked ? "inline-flex" : "none";
  }
  if (menuBtn) {
    menuBtn.style.display = isUnlocked ? "flex" : "none";
  }
}

/* ---------- Terminal y Cuadrícula del Calendario Histórico ---------- */
function renderCalendar() {
  const grid = $("calendar-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const today = dayNumber();
  const totalDays = Math.max(today, 3);
  const history = store.get("daily_history", {}) || {};
  const currentDaily = store.get("daily", null);

  // Sincronizar daily actual si ya está terminado
  if (currentDaily && currentDaily.day && currentDaily.done && !history[currentDaily.day]) {
    const pts = (currentDaily.results || []).reduce((acc, r) => acc + (roundPoints ? roundPoints(r) : (r.points || 0)), 0);
    const emojis = (currentDaily.results || []).map((r) => TIERS[r.tier]?.emoji || "⬛").join("");
    history[currentDaily.day] = {
      day: currentDaily.day,
      score: pts,
      emojis: emojis,
      done: true,
      timestamp: Date.now()
    };
    store.set("daily_history", history);
  }

  let completedCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const hist = history[d];
    const isDone = Boolean(hist && hist.done);
    if (isDone) completedCount++;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `calendar-day-card${d === today ? " current-day" : ""}`;

    const header = document.createElement("div");
    header.className = "cal-day-header";

    const num = document.createElement("span");
    num.className = "cal-day-num";
    num.textContent = `DÍA #${d < 10 ? "0" + d : d}${d === today ? " [HOY]" : ""}`;

    const dtSpan = document.createElement("span");
    dtSpan.className = "cal-day-date";
    dtSpan.textContent = dateForDay(d);

    header.append(num, dtSpan);

    const mission = (typeof DAILY_MISSIONS !== "undefined")
      ? (DAILY_MISSIONS[d] || DAILY_MISSIONS[`dia_${d}`] || DAILY_MISSIONS[((d - 1) % 3) + 1])
      : null;
    const titleDiv = document.createElement("div");
    titleDiv.className = "cal-day-title";
    titleDiv.textContent = mission ? mission.nombre : `Misión Clasificada #${d}`;

    const statusRow = document.createElement("div");
    statusRow.className = "cal-day-status-row";

    const badge = document.createElement("span");
    badge.className = `cal-badge ${isDone ? "completed" : "pending"}`;
    badge.textContent = isDone ? "COMPLETADO" : "PENDIENTE";

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "cal-day-score";
    scoreSpan.textContent = isDone ? `${hist.score || 0} pts` : "—";

    statusRow.append(badge, scoreSpan);

    const emojisDiv = document.createElement("div");
    emojisDiv.className = "cal-day-emojis";
    emojisDiv.textContent = isDone ? (hist.emojis || "") : "—";

    const footer = document.createElement("div");
    footer.className = "cal-day-footer";
    footer.innerHTML = `<span>7 consultas / 25s</span><span>${isDone ? "Rejugar misión →" : "Iniciar misión →"}</span>`;

    card.append(header, titleDiv, statusRow, emojisDiv, footer);

    card.addEventListener("click", () => {
      const dStr = dateForDay(d);
      openDeployModal(`EXPEDIENTE HISTÓRICO: DÍA #${d} (${dStr.toUpperCase()})`, () => {
        const prompts = dailyPrompts(d);
        startGame("daily", prompts, { day: d, label: `Expediente Diario #${d}` });
      });
    });

    grid.appendChild(card);
  }

  const summary = $("calendar-summary-text");
  if (summary) {
    summary.textContent = `${completedCount}/${totalDays} expedientes completados`;
  }
}

/* ---------- Eventos e Interacción ---------- */
function requestDailyStart() {
  const day = dayNumber();
  const saved = store.get("daily", null);
  if (saved && saved.day === day && saved.done) {
    return renderFinal();
  }
  openDeployModal("MODO DIARIO: OPERACIÓN ACTIVA", () => {
    startDaily();
  });
}

$("btn-daily").addEventListener("click", requestDailyStart);
$("btn-unlimited").addEventListener("click", () => {
  openDeployModal("ENTRENAMIENTO ILIMITADO", () => {
    startGame("unlimited", unlimitedPrompts(), { day: dayNumber(), label: "Simulacro Continuo" });
  }, true);
});
$("btn-packs").addEventListener("click", () => { renderPacks(); showScreen("packs"); });
$("btn-back-packs").addEventListener("click", () => { renderPacks(); showScreen("packs"); });
$("btn-bestiary").addEventListener("click", () => { renderArchives(); showScreen("bestiary"); });
$("btn-view-bestiary").addEventListener("click", () => { renderArchives(); showScreen("bestiary"); });
$("btn-mute").addEventListener("click", () => sound.toggleMute());
$("btn-wildcard").addEventListener("click", toggleWildcard);

$("answer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  submitAnswer(false);
});

// Avance rápido conservando foco del teclado móvil
const btnNext = $("btn-next");
const handleNext = (e) => {
  if (e && e.type === "touchend") e.preventDefault();
  nextStep();
  focusInput();
};
btnNext.addEventListener("click", handleNext);
btnNext.addEventListener("touchend", handleNext, { passive: false });

window.addEventListener("keydown", (e) => {
  const modalEE = $("modal-easter-egg");
  if (modalEE && !modalEE.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeEasterEggModal();
    }
    return;
  }

  const modalDeploy = $("modal-deploy");
  if (modalDeploy && !modalDeploy.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDeployModal();
    }
    return;
  }

  const modalAbort = $("modal-abort");
  if (modalAbort && !modalAbort.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeAbortModal();
    }
    return;
  }

  const modalRules = $("modal-rules");
  if (modalRules && !modalRules.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeRulesModal();
    }
    return;
  }

  const modal = $("modal-suggestion");
  if (modal && !modal.classList.contains("hidden")) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSuggestionModal();
    }
    return;
  }

  if (e.key === "Enter") {
    const res = $("result");
    if (res && !res.classList.contains("hidden") && performance.now() - roundEndedAt > 300) {
      e.preventDefault();
      handleNext();
    }
  }
});

$("btn-copy").addEventListener("click", copyResult);
document.querySelectorAll("[data-goto]").forEach((b) => {
  b.addEventListener("click", () => {
    clearInterval(timerId);
    clearRejectFeedback();
    clearLiveAttempts();
    showScreen(b.dataset.goto);
  });
});

// Botón de Retorno al Cuartel General y Modal de Aborto
const stampFrameBtn = $("stamp-frame");
if (stampFrameBtn) stampFrameBtn.addEventListener("click", handleHomeClick);

// Botón de interrogación [ ? ] (Directiva de Operaciones // Briefing)
const btnHelp = $("btn-help");
if (btnHelp) btnHelp.addEventListener("click", openRulesModal);

const btnCloseAbort = $("btn-close-abort");
if (btnCloseAbort) btnCloseAbort.addEventListener("click", closeAbortModal);

const btnCancelAbort = $("btn-cancel-abort");
if (btnCancelAbort) btnCancelAbort.addEventListener("click", closeAbortModal);

const btnConfirmAbort = $("btn-confirm-abort");
if (btnConfirmAbort) btnConfirmAbort.addEventListener("click", abortMissionAndReturnHome);

const modalAbortEl = $("modal-abort");
if (modalAbortEl) {
  modalAbortEl.addEventListener("click", (e) => {
    if (e.target === modalAbortEl) closeAbortModal();
  });
}

// Modal de Protocolo de Despliegue Operativo
const btnCloseDeploy = $("btn-close-deploy");
if (btnCloseDeploy) btnCloseDeploy.addEventListener("click", () => {
  sound.playTone(280, "sine", 0.08, 0.1);
  closeDeployModal();
});

const btnAbortDeploy = $("btn-abort-deploy");
if (btnAbortDeploy) btnAbortDeploy.addEventListener("click", () => {
  sound.playTone(280, "sine", 0.08, 0.1);
  closeDeployModal();
});

const btnConfirmDeploy = $("btn-confirm-deploy");
if (btnConfirmDeploy) btnConfirmDeploy.addEventListener("click", () => {
  const action = pendingDeployAction;
  closeDeployModal();
  sound.playTone(620, "triangle", 0.1, 0.16);
  if (typeof action === "function") {
    action();
  }
});

const modalDeployEl = $("modal-deploy");
if (modalDeployEl) {
  modalDeployEl.addEventListener("click", (e) => {
    if (e.target === modalDeployEl) {
      sound.playTone(280, "sine", 0.08, 0.1);
      closeDeployModal();
    }
  });
}

// Modal del Manual de Reglas / Briefing
const btnCloseRules = $("btn-close-rules");
if (btnCloseRules) btnCloseRules.addEventListener("click", closeRulesModal);
const btnAckRules = $("btn-ack-rules");
if (btnAckRules) btnAckRules.addEventListener("click", closeRulesModal);
const modalRulesEl = $("modal-rules");
if (modalRulesEl) {
  modalRulesEl.addEventListener("click", (e) => {
    if (e.target === modalRulesEl) closeRulesModal();
  });
}

// Modal táctico de transmisión de inteligencia de campo
$("btn-close-modal").addEventListener("click", closeSuggestionModal);
$("modal-suggestion").addEventListener("click", (e) => {
  if (e.target === $("modal-suggestion")) closeSuggestionModal();
});
$("suggestion-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentSuggestingPrompt) return;
  transmitirSugerencia(currentSuggestingPrompt.texto, $("sug-word").value);
});

/* ---------- Auditor de Densidad Oculto (EXCLUSIVO DESARROLLADOR) ---------- */
const DEV_TIERS = [10, 25, 45, 65, 85, 100];

function auditPrompts() {
  return PROMPTS.map((p) => {
    const values = Object.values(p.answers || {});
    const byTier = {};
    DEV_TIERS.forEach((t) => { byTier[t] = values.filter((v) => v === t).length; });
    const total = Object.keys(p.answers || {}).length;
    const light = total >= 130 ? "🟢" : total >= 70 ? "🟡" : "🔴";
    return { id: p.id, titulo: p.texto, total, byTier, light };
  });
}

function logAuditToConsole() {
  const table = {};
  auditPrompts().forEach((a) => {
    table[a.id] = { titulo: a.titulo, total: a.total, ...a.byTier, estado: a.light };
  });
  console.table(table);
}

function renderDevAudit() {
  const body = $("dev-audit-body");
  if (!body) return;
  body.innerHTML = "";
  const audit = auditPrompts();
  const count = (l) => audit.filter((a) => a.light === l).length;
  $("dev-audit-summary").textContent = `${audit.length} categorías · 🟢 ${count("🟢")} · 🟡 ${count("🟡")} · 🔴 ${count("🔴")}`;

  audit.forEach((a) => {
    const row = document.createElement("div");
    row.className = "dev-row";

    const head = document.createElement("div");
    head.className = "dev-row-head";
    head.textContent = `${a.light} ${a.id} — ${a.titulo}`;

    const stats = document.createElement("div");
    stats.className = "dev-row-stats";
    stats.textContent = `Total: ${a.total} | ` + DEV_TIERS.map((t) => `${t}: ${a.byTier[t]}`).join(" · ");

    row.append(head, stats);
    body.appendChild(row);
  });
}

function toggleDevAudit(force = null) {
  const panel = $("dev-audit-panel");
  if (!panel) return;
  const open = force !== null ? force : panel.classList.contains("hidden");
  if (open) {
    renderDevAudit();
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

window.addEventListener("keydown", (e) => {
  if (e.altKey && !e.ctrlKey && !e.metaKey && e.key && e.key.toLowerCase() === "d") {
    e.preventDefault();
    toggleDevAudit();
  } else if (e.key === "Escape" && !$("dev-audit-panel").classList.contains("hidden")) {
    toggleDevAudit(false);
  }
});
$("btn-close-dev-audit").addEventListener("click", () => toggleDevAudit(false));

if (new URLSearchParams(window.location.search).get("dev") === "1") {
  toggleDevAudit(true);
}
logAuditToConsole();

/* ---------- Inicialización ---------- */
initAmbientDust();
sound.updateButton();
setJudgeSeal("idle");
refreshMenu();
updateTelemetry(0, 0);

// Navegación al Calendario Histórico
const btnCalendar = $("btn-calendar");
if (btnCalendar) {
  btnCalendar.addEventListener("click", () => {
    renderCalendar();
    showScreen("calendar");
  });
}

const btnHeaderCalendar = $("btn-header-calendar");
if (btnHeaderCalendar) {
  btnHeaderCalendar.addEventListener("click", () => {
    renderCalendar();
    showScreen("calendar");
  });
}

// Modal de Desbloqueo Easter Egg
const btnAckEasterEgg = $("btn-ack-easter-egg");
if (btnAckEasterEgg) {
  btnAckEasterEgg.addEventListener("click", closeEasterEggModal);
}

const modalEasterEggEl = $("modal-easter-egg");
if (modalEasterEggEl) {
  modalEasterEggEl.addEventListener("click", (e) => {
    if (e.target === modalEasterEggEl) closeEasterEggModal();
  });
}

updateCalendarVisibility();
// Comprobación de desbloqueos previos (ej. Easter Egg ya activado)
if (localStorage.getItem("spyle_archivo_desbloqueado") === "true") {
  unlockAchievement("logro_criptografo");
}
// Sincronizar estadísticas iniciales y marcador persistente con historial previo
(function syncInitialPlayerStats() {
  const history = store.get("daily_history", {});
  const stats = store.get("player_stats", { completedMissions: 0, totalHistoricalPoints: 0 });
  let historyCount = 0;
  let historyPts = 0;
  Object.values(history).forEach((h) => {
    if (h && h.done) {
      historyCount++;
      historyPts += (h.score || 0);
    }
  });

  let currentSavedPoints = getPuntosHistoricosTotales();
  if (currentSavedPoints === 0 && historyPts > 0) {
    currentSavedPoints = historyPts;
    try {
      localStorage.setItem("spyle_puntos_totales", currentSavedPoints.toString());
    } catch { /* noop */ }
  }

  if (historyCount > stats.completedMissions) {
    stats.completedMissions = historyCount;
  }
  stats.totalHistoricalPoints = Math.max(stats.totalHistoricalPoints || 0, currentSavedPoints);
  store.set("player_stats", stats);

  actualizarMarcadorPuntosTotales(currentSavedPoints, false);

  if (stats.completedMissions >= 5 && currentSavedPoints >= 2000) {
    unlockAchievement("logro_veterano_red");
  }
})();
updateAchievementsStatus();
checkFirstVisitBriefing();
