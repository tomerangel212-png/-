"use strict";
(function (root) {
  function normalize(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f\u0591-\u05c7]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }
  function validateSongs(songs) {
    if (!Array.isArray(songs) || songs.length !== 5) return "הוסיפו בדיוק חמישה שירים.";
    var seen = new Set();
    for (var song of songs) {
      if (!song || !normalize(song.title) || song.title.length > 180 || String(song.artist || "").length > 180) return "לכל שיר צריך להיות שם תקין.";
      var key = normalize(song.title);
      if (seen.has(key)) return "בחרו חמישה שירים שונים.";
      seen.add(key);
    }
    return "";
  }
  function musicLink(value, provider) {
    if (!String(value || "").trim()) return "";
    var url;
    try { url = new URL(value); } catch (error) { throw new Error("הדביקו קישור שיתוף מלא."); }
    var domains = provider === "spotify" ? ["open.spotify.com", "spotify.link"] : ["music.apple.com"];
    if (url.protocol !== "https:" || !domains.includes(url.hostname) || url.username || url.password || url.port) throw new Error("הקישור אינו שייך לשירות המוזיקה שנבחר.");
    url.hash = "";
    return url.href;
  }
  function scoreChange(scores, team, amount) {
    if (!Object.prototype.hasOwnProperty.call(scores, team) || ![1, -1].includes(amount)) throw new Error("Invalid score change");
    return Object.assign({}, scores, { [team]: Math.max(-9999, Math.min(9999, Number(scores[team] || 0) + amount)) });
  }
  function isBlocked(artist) { return /michael jackson|eyal golan|אייל גולן/i.test(artist || ""); }
  function catalogCard(item) {
    var year = Number(String(item.releaseDate || "").slice(0, 4));
    if (!item.trackId || !item.trackName || !item.artistName || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() || isBlocked(item.artistName)) return null;
    return { id: "catalog-" + item.trackId, title: item.trackName, artist: item.artistName, chartYear: year, chartRank: 0, yearBasis: "catalog-release", source: "Apple Music / iTunes · שנת הגרסה בקטלוג", sourceUrl: item.trackViewUrl || "", previewUrl: item.previewUrl || "" };
  }
  function matchSong(song, items) {
    var title = normalize(song.title), artist = normalize(song.artist);
    return items.filter(function (item) {
      var candidate = normalize(item.trackName), candidateArtist = normalize(item.artistName);
      return candidate === title && (!artist || candidateArtist === artist || candidateArtist.includes(artist)) && !isBlocked(item.artistName);
    }).sort(function (a, b) { return Number(Boolean(b.previewUrl)) - Number(Boolean(a.previewUrl)) || String(a.releaseDate).localeCompare(String(b.releaseDate)); })[0] || null;
  }
  var api = { normalize, validateSongs, musicLink, scoreChange, catalogCard, matchSong };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TRAPersonal = api;
}(typeof window !== "undefined" ? window : globalThis));
