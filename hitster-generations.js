"use strict";
(function () {
  var labels = ["ילדים", "מבוגרים", "הדור הוותיק"];
  var eligible = ["רק הילדים יכולים לענות", "רק המבוגרים יכולים לענות", "רק הוותיקים יכולים לענות"];
  var lists = [[], [], []], stage = 0, index = 0, scores = [0, 0, 0], revealed = false, answered = false, url = null, timer = null;
  var $ = function (id) { return document.getElementById(id); }, audio = $("clip");
  function stop() { clearTimeout(timer); timer = null; audio.pause(); audio.currentTime = 0; }
  function release() { stop(); audio.removeAttribute("src"); audio.load(); if (url) URL.revokeObjectURL(url); url = null; }
  function steps() {
    $("steps").replaceChildren();
    labels.forEach(function (label, i) { var node = document.createElement("span"); node.textContent = (i + 1) + " · " + label; if (i === stage) node.className = "active"; $("steps").append(node); });
  }
  function render() {
    release(); revealed = false; answered = false; steps();
    $("stage-title").textContent = "דרגה " + (stage + 1) + " · שירי " + labels[stage];
    $("eligible").textContent = eligible[stage];
    $("progress").textContent = "שיר " + (index + 1) + " מתוך " + lists[stage].length;
    $("solution").hidden = true; $("solution").textContent = "";
    $("correct").textContent = "נכון — נקודה ל" + labels[stage];
    $("correct").disabled = true; $("incorrect").disabled = true; $("reveal").disabled = false;
    $("status").textContent = eligible[stage] + ". לחצו לניגון.";
    url = URL.createObjectURL(lists[stage][index]); audio.src = url; audio.load();
  }
  function start() {
    if (lists.some(function (list) { return !list.length; })) return;
    var seen = new Set();
    for (var list of lists) for (var file of list) {
      var identity = file.name + "|" + file.size + "|" + file.lastModified;
      if (seen.has(identity)) { $("status").textContent = "אותו קובץ נבחר יותר מפעם אחת. בחרו שירים שונים לכל דרגה."; return; }
      seen.add(identity);
    }
    stage = 0; index = 0; scores = [0, 0, 0]; $("setup").hidden = true; $("results").hidden = true; $("game").hidden = false; render();
  }
  function answer(correct) {
    if (!revealed || answered) return;
    answered = true; if (correct) scores[stage]++;
    index++;
    if (index >= lists[stage].length) { stage++; index = 0; }
    if (stage < 3) { render(); return; }
    release(); steps(); $("game").hidden = true; $("results").hidden = false; $("scores").replaceChildren();
    labels.forEach(function (label, i) { var p = document.createElement("p"); p.textContent = label + ": " + scores[i] + " מתוך " + lists[i].length; $("scores").append(p); });
    $("status").textContent = "כל הקבוצות קיבלו את דרגת השירים שלהן.";
  }
  labels.forEach(function (_, i) { $("files-" + i).addEventListener("change", function () { lists[i] = Array.from(this.files).filter(function (file) { return file.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name); }); $("start").disabled = lists.some(function (list) { return !list.length; }); }); });
  $("start").onclick = start; $("restart").onclick = start;
  $("play").onclick = async function () {
    if (!audio.paused) { audio.pause(); clearTimeout(timer); return; }
    if (audio.currentTime >= 30) audio.currentTime = 0;
    try { await audio.play(); timer = setTimeout(stop, Math.max(0, (30 - audio.currentTime) * 1000)); }
    catch (_) { $("status").textContent = "לא ניתן לנגן את הקובץ הזה. אפשר להמשיך ללא ניקוד או לבחור קובץ שמע אחר."; }
  };
  $("stop").onclick = stop;
  audio.addEventListener("timeupdate", function () { if (audio.currentTime >= 30) stop(); });
  audio.addEventListener("ended", function () { clearTimeout(timer); });
  audio.addEventListener("error", function () { $("status").textContent = "הקובץ לא ניתן להשמעה. בחרו קובץ אחר או המשיכו ללא ניקוד."; });
  $("reveal").onclick = function () { revealed = true; $("solution").textContent = lists[stage][index].name.replace(/\.[^.]+$/, ""); $("solution").hidden = false; $("correct").disabled = false; $("incorrect").disabled = false; $("reveal").disabled = true; };
  $("correct").onclick = function () { answer(true); }; $("incorrect").onclick = function () { answer(false); };
  $("reset").onclick = function () { if (!$("game").hidden && !window.confirm("לחזור לבחירת שירים? הניקוד הנוכחי יתאפס.")) return; release(); stage = 0; scores = [0, 0, 0]; $("setup").hidden = false; $("game").hidden = true; $("results").hidden = true; $("status").textContent = "בחרו שירים לכל דרגה."; steps(); };
  window.addEventListener("pagehide", release); steps();
}());
