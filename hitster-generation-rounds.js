"use strict";

const GENERATION_STAGES = Object.freeze([
  Object.freeze({ id: "children", label: "דרגה 1 · שירי ילדים", eligibleLabel: "ילדים בלבד" }),
  Object.freeze({ id: "adults", label: "דרגה 2 · שירי מבוגרים", eligibleLabel: "מבוגרים בלבד" }),
  Object.freeze({ id: "elders", label: "דרגה 3 · שירי ותיקים", eligibleLabel: "ותיקים בלבד" }),
]);

const AUDIENCE_ALIASES = Object.freeze({
  child: "children", children: "children", kids: "children", "ילד": "children", "ילדים": "children",
  adult: "adults", adults: "adults", "מבוגר": "adults", "מבוגרים": "adults",
  elder: "elders", elders: "elders", seniors: "elders", "זקן": "elders", "זקנים": "elders", "ותיק": "elders", "ותיקים": "elders",
});

function normalizeAudience(value) {
  return AUDIENCE_ALIASES[String(value || "").trim().toLowerCase()] || null;
}

function cardKey(card) {
  if (card.id) return String(card.id);
  return [card.title, card.artist, card.year].map(value => String(value || "").trim().toLowerCase()).join("|");
}

function validateGenerationDeck(cards) {
  const errors = [];
  const seen = new Set();
  (Array.isArray(cards) ? cards : []).forEach((card, index) => {
    if (!card || typeof card !== "object") { errors.push(`card ${index + 1}: invalid object`); return; }
    if (!card.title || !card.artist || !Number.isInteger(card.year)) errors.push(`card ${index + 1}: missing title, artist or year`);
    if (!normalizeAudience(card.audience)) errors.push(`card ${index + 1}: audience must be children, adults or elders`);
    const key = cardKey(card);
    if (seen.has(key)) errors.push(`card ${index + 1}: duplicate ${key}`);
    seen.add(key);
  });
  return { ok: errors.length === 0, errors };
}

function createGenerationRounds({ cards, quotaPerStage = 10, restoredState = null } = {}) {
  const validation = validateGenerationDeck(cards);
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  if (!Number.isInteger(quotaPerStage) || quotaPerStage < 1) throw new Error("quotaPerStage must be a positive integer");

  const state = {
    stageIndex: 0,
    completedByStage: { children: 0, adults: 0, elders: 0 },
    used: new Set(),
  };

  if (restoredState && typeof restoredState === "object") {
    state.stageIndex = Math.max(0, Math.min(GENERATION_STAGES.length - 1, Number(restoredState.stageIndex) || 0));
    GENERATION_STAGES.forEach(({ id }) => {
      state.completedByStage[id] = Math.max(0, Number(restoredState.completedByStage?.[id]) || 0);
    });
    state.used = new Set(Array.isArray(restoredState.used) ? restoredState.used.map(String) : []);
  }

  const currentStage = () => GENERATION_STAGES[state.stageIndex];
  const isFinished = () => state.stageIndex === GENERATION_STAGES.length - 1 && state.completedByStage.elders >= quotaPerStage;
  const canAnswer = responderAudience => !isFinished() && normalizeAudience(responderAudience) === currentStage().id;
  const availableCards = () => cards.filter(card => normalizeAudience(card.audience) === currentStage().id && !state.used.has(cardKey(card)));

  function draw(random = Math.random) {
    if (isFinished()) return { ok: false, reason: "game-finished" };
    const pool = availableCards();
    if (!pool.length) return { ok: false, reason: "stage-deck-empty", stage: currentStage() };
    const card = pool[Math.floor(random() * pool.length)];
    state.used.add(cardKey(card));
    return { ok: true, card, stage: currentStage() };
  }

  function acceptAnswer({ responderAudience, correct }) {
    const stage = currentStage();
    if (!canAnswer(responderAudience)) {
      return { ok: false, counted: false, reason: "wrong-generation", message: `בדרגה זו רק ${stage.eligibleLabel} יכולים לענות.` };
    }
    if (!correct) return { ok: true, counted: false, stage, advanced: false, finished: false };

    state.completedByStage[stage.id] += 1;
    let advanced = false;
    if (state.completedByStage[stage.id] >= quotaPerStage && state.stageIndex < GENERATION_STAGES.length - 1) {
      state.stageIndex += 1;
      advanced = true;
    }
    return { ok: true, counted: true, stage, advanced, nextStage: currentStage(), finished: isFinished() };
  }

  function serialize() {
    return {
      stageIndex: state.stageIndex,
      completedByStage: { ...state.completedByStage },
      used: [...state.used],
      quotaPerStage,
    };
  }

  return { currentStage, canAnswer, availableCards, draw, acceptAnswer, isFinished, serialize };
}

const api = { GENERATION_STAGES, normalizeAudience, cardKey, validateGenerationDeck, createGenerationRounds };
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.HitsterGenerationRounds = api;

