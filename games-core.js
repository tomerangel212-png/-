"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TRA_GAMES_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SYMBOLS = [
    "♟️", "🎵", "⭐", "🌿", "🏀", "🎭", "🌊", "🔑", "🐉", "🍎", "🎹", "🧩", "🚗", "☀️",
    "🌙", "🚪", "🎤", "🎲", "🎨", "🏆", "🌳", "🎧", "🕯️", "📚", "⚽", "🦋", "🚲", "🍋",
    "🪁", "🎸", "🧸", "🪴", "🛶", "🧭", "🎺", "🪇", "🦉", "🐢", "🌻", "🍉", "🪐", "💎",
    "🧁", "🛎️", "🪄", "🧵", "🧲", "🛟", "🎻", "🧤", "🌈", "🪷", "🪺", "🪵", "🧃", "🎷", "🫧"
  ];

  function createDobbleDeck() {
    const deck = [];
    // 49 affine lines y = mx + b in GF(7), each with its point at infinity.
    for (let m = 0; m < 7; m += 1) {
      for (let b = 0; b < 7; b += 1) {
        const card = [];
        for (let x = 0; x < 7; x += 1) card.push(x * 7 + ((m * x + b) % 7));
        card.push(49 + m);
        deck.push(card);
      }
    }
    // Seven vertical lines and the line at infinity complete PG(2, 7).
    for (let x = 0; x < 7; x += 1) {
      const card = [];
      for (let y = 0; y < 7; y += 1) card.push(x * 7 + y);
      card.push(56);
      deck.push(card);
    }
    deck.push(Array.from({ length: 8 }, (_, index) => 49 + index));
    return deck;
  }

  function validateDobbleDeck(deck) {
    if (!Array.isArray(deck) || deck.length !== 57) return false;
    if (deck.some(card => !Array.isArray(card) || card.length !== 8 || new Set(card).size !== 8 || card.some(symbol => !Number.isInteger(symbol) || symbol < 0 || symbol >= 57))) return false;
    const uniqueCards = new Set(deck.map(card => card.slice().sort((a, b) => a - b).join(",")));
    if (uniqueCards.size !== 57) return false;
    for (let a = 0; a < deck.length; a += 1) {
      for (let b = a + 1; b < deck.length; b += 1) {
        let shared = 0;
        const symbols = new Set(deck[a]);
        for (const symbol of deck[b]) if (symbols.has(symbol)) shared += 1;
        if (shared !== 1) return false;
      }
    }
    return true;
  }

  function createAlchemyState() {
    return { version: 1, score: 0, guesses: 0, currentIndex: 0, discoveries: {} };
  }

  function sanitizeAlchemyState(value, combinationCount) {
    const clean = createAlchemyState();
    if (!value || value.version !== 1 || typeof value !== "object") return clean;
    clean.score = Number.isSafeInteger(value.score) && value.score >= 0 ? value.score : 0;
    clean.guesses = Number.isSafeInteger(value.guesses) && value.guesses >= 0 ? value.guesses : 0;
    clean.currentIndex = Number.isInteger(value.currentIndex) && value.currentIndex >= 0 && value.currentIndex < combinationCount ? value.currentIndex : 0;
    if (value.discoveries && typeof value.discoveries === "object" && !Array.isArray(value.discoveries)) {
      for (const [id, item] of Object.entries(value.discoveries)) {
        if (!/^\d+$/.test(id) || Number(id) >= combinationCount || !item || typeof item.prompt !== "string" || typeof item.answer !== "string") continue;
        clean.discoveries[id] = { prompt: item.prompt, answer: item.answer, method: item.method === "guess" ? "guess" : "reveal" };
      }
    }
    return clean;
  }

  function loadAlchemyState(storage, key, combinationCount) {
    try { return sanitizeAlchemyState(JSON.parse(storage.getItem(key)), combinationCount); }
    catch (error) { return createAlchemyState(); }
  }

  function saveAlchemyState(storage, key, state, combinationCount) {
    try {
      storage.setItem(key, JSON.stringify(sanitizeAlchemyState(state, combinationCount)));
      return true;
    } catch (error) { return false; }
  }

  return { SYMBOLS, createDobbleDeck, validateDobbleDeck, createAlchemyState, sanitizeAlchemyState, loadAlchemyState, saveAlchemyState };
});
