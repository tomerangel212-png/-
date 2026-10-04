/* TRA Kfar Blum 2026. Copyright 2026 Tomer Rafael Angel. All rights reserved. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TRAStarLedger = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Identifiers are not quantities or scores. Unapproved proposals are never scored.
  var RULES = Object.freeze([
    {id: 1, value: 10}, {id: 2, value: 20}, {id: 3, value: 50},
    {id: 4, value: null, proposal: 100}, {id: 5, value: 500},
    {id: 6, value: null, proposal: 1000}, {id: 7, value: null, proposal: 5000},
    {id: 8, value: null, proposal: 10000},
    // Latest correction interpreted as Star 9's value, not 999 star types.
    {id: 9, value: 999, interpretation: "latest-star-9-correction"},
    {id: 10, value: null, proposal: 100000}
  ].map(function (rule) { return Object.freeze(rule); }));
  var KEY = "tra:kfar-blum-2026:star-ledger:v1";
  var MAX_COUNT = 1000000;
  function ruleFor(id) {
    if (!Number.isInteger(id) || id < 1 || id > RULES.length) throw new RangeError("Unknown star type");
    return RULES[id - 1];
  }
  function countValue(value) {
    if (!Number.isInteger(value) || value < 0 || value > MAX_COUNT) throw new RangeError("Invalid star count");
    return value;
  }
  function total(counts) {
    return RULES.reduce(function (sum, rule) {
      var count = countValue(Object.prototype.hasOwnProperty.call(counts || {}, rule.id) ? counts[rule.id] : 0);
      if (count && rule.value === null) throw new RangeError("Star value not approved");
      var result = sum + count * (rule.value === null ? 0 : rule.value);
      if (!Number.isSafeInteger(result)) throw new RangeError("Unsafe points total");
      return result;
    }, 0);
  }
  function sanitize(raw, teams) {
    var result = {version: 1, teams: Object.create(null)};
    teams.forEach(function (team) {
      var row = Object.create(null), old = raw && raw.version === 1 && raw.teams && raw.teams[team.id];
      RULES.forEach(function (rule) {
        var value = old && old[rule.id];
        row[rule.id] = rule.value !== null && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT ? value : 0;
      });
      result.teams[team.id] = row;
    });
    return result;
  }
  function setCount(state, teamId, starId, quantity) {
    var rule = ruleFor(starId);
    if (!Object.prototype.hasOwnProperty.call(state.teams, teamId)) throw new RangeError("Unknown team");
    quantity = countValue(quantity);
    if (quantity && rule.value === null) throw new RangeError("Star value not approved");
    var row = Object.assign({}, state.teams[teamId]);
    row[starId] = quantity;
    total(row); // Validate before mutating anything.
    state.teams[teamId] = row;
    return total(row);
  }
  function mount(doc) {
    if (!doc || doc.getElementById("tra-star-ledger")) return false;
    var source = doc.getElementById("team-select"), main = doc.querySelector("main");
    if (!source || !main) return false;
    var win = doc.defaultView, he = doc.documentElement.lang !== "en";
    var teams = Array.prototype.map.call(source.options, function (o) { return {id: o.value, name: o.textContent}; });
    if (!teams.length) return false;
    var storage = null, saved = null;
    try { storage = win.localStorage; saved = JSON.parse(storage.getItem(KEY) || "null"); } catch (ignore) {}
    var state = sanitize(saved, teams);
    var active = teams[0].id;
    function node(tag, text, cls) { var n = doc.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; }
    function number(n) { return n.toLocaleString(he ? "he-IL" : "en-US"); }
    var style = node("style");
    style.textContent = "#tra-star-ledger{margin:20px 0;padding:16px;border:1px solid #365064;border-radius:16px;background:#102435;color:#f5f8ff}#tra-star-ledger summary{cursor:pointer;font-weight:800;min-height:44px}#tra-star-ledger p{line-height:1.65}#tra-star-ledger .star-scroll{overflow-x:auto}#tra-star-ledger table{border-collapse:collapse;width:100%}#tra-star-ledger th,#tra-star-ledger td{text-align:start;padding:10px 8px;border-bottom:1px solid #365064}#tra-star-ledger input{width:6em;max-width:100%;min-height:44px;box-sizing:border-box}#tra-star-ledger select,#tra-star-ledger button{min-height:44px;padding:8px;font:inherit}#tra-star-ledger :focus-visible{outline:3px solid #ffd56b;outline-offset:2px}#tra-star-ledger .star-note{font-size:.9rem;color:#c1d5e2}#tra-star-ledger output{font-weight:900;display:block;margin-top:12px}#tra-star-ledger [disabled]{opacity:.6}";
    doc.head.appendChild(style);
    var box = node("details"); box.id = "tra-star-ledger";
    box.appendChild(node("summary", he ? "⭐ עשרת סוגי הכוכבים — לוח נקודות" : "⭐ Ten star types — points ledger"));
    box.appendChild(node("p", he ? "כוכב 9 = 999 נקודות, לפי הפירוש לתיקון האחרון. יתר הערכים שאושרו: 1=10, 2=20, 3=50, 5=500. זהו סולם מותאם, לא סדרה מעריכית קבועה." : "Star 9 = 999 points, interpreting the latest correction. Other approved values: 1=10, 2=20, 3=50, 5=500. This is a custom scale, not a constant exponential progression."));
    box.appendChild(node("p", he ? "רישום ידני למנחה, במכשיר הזה בלבד. הלוח נפרד מאסימוני ההחלפה ומחוקי הניצחון של HITSTER; תגובה לשיר אינה מעניקה כוכב אוטומטית. סוג שטרם אושר אינו נספר." : "Manual host ledger, on this device only. Separate from HITSTER spending tokens and victory rules; reacting to a song never awards a star automatically. Unapproved types are not scored.", "star-note"));
    var label = node("label", he ? "קבוצה: " : "Team: ");
    var select = node("select"); select.setAttribute("aria-label", he ? "קבוצה לרישום כוכבים" : "Team for star ledger");
    teams.forEach(function (team) { var o = node("option", team.name); o.value = team.id; select.appendChild(o); });
    label.appendChild(select); box.appendChild(label);
    var scroll = node("div", undefined, "star-scroll"), table = node("table"), head = node("thead"), hr = node("tr");
    (he ? ["סוג", "ערך", "כמות", "נקודות"] : ["Type", "Value", "Count", "Points"]).forEach(function (text) { var th = node("th", text); th.scope = "col"; hr.appendChild(th); });
    head.appendChild(hr); table.appendChild(head);
    var body = node("tbody"); table.appendChild(body); scroll.appendChild(table); box.appendChild(scroll);
    var output = node("output"); output.id = "tra-star-total"; output.setAttribute("aria-live", "polite"); box.appendChild(output);
    var message = node("p", "", "star-note"); message.setAttribute("role", "status"); box.appendChild(message);
    var reset = node("button", he ? "איפוס כוכבי הקבוצה" : "Reset this team's ledger"); reset.type = "button"; box.appendChild(reset);
    var clearAll = node("button", he ? "איפוס כל לוח הכוכבים" : "Reset entire star ledger"); clearAll.type = "button"; box.appendChild(clearAll);
    function write() {
      try {
        if (!storage) throw new Error("No local storage");
        storage.setItem(KEY, JSON.stringify(state));
        message.textContent = he ? "נשמר במכשיר הזה בלבד." : "Saved on this device only.";
      } catch (ignore) { message.textContent = he ? "השמירה אינה זמינה. השינוי תקף רק עד סגירת העמוד." : "Storage unavailable. Changes last only for this page session."; }
    }
    function updateTotal() { output.textContent = (he ? "סך נקודות הכוכבים: " : "Total star points: ") + number(total(state.teams[active])); }
    function render() {
      body.replaceChildren();
      RULES.forEach(function (rule) {
        var row = node("tr"); row.dataset.starType = String(rule.id);
        row.appendChild(node("td", (he ? "כוכב " : "Star ") + rule.id));
        row.appendChild(node("td", rule.value === null ? (he ? "טרם אושר" : "Not approved") : number(rule.value)));
        var cell = node("td"), input = node("input"); input.type = "number"; input.min = "0"; input.max = String(MAX_COUNT); input.step = "1";
        input.value = String(state.teams[active][rule.id]); input.disabled = rule.value === null;
        input.setAttribute("aria-label", (he ? "כמות כוכבים מסוג " : "Count for star type ") + rule.id);
        cell.appendChild(input); row.appendChild(cell);
        var subtotal = node("td", number((rule.value || 0) * state.teams[active][rule.id])); row.appendChild(subtotal);
        input.addEventListener("change", function () {
          try {
            if (input.value.trim() === "") throw new RangeError("Empty count");
            setCount(state, active, rule.id, Number(input.value));
            input.removeAttribute("aria-invalid");
            subtotal.textContent = number((rule.value || 0) * state.teams[active][rule.id]);
            updateTotal(); write();
          } catch (error) {
            input.setAttribute("aria-invalid", "true"); input.value = String(state.teams[active][rule.id]);
            message.textContent = he ? "יש להזין כמות שלמה ולא שלילית, עד מיליון." : "Enter a non-negative whole count, up to one million.";
          }
        });
        body.appendChild(row);
      });
      updateTotal();
    }
    select.addEventListener("change", function () { active = select.value; render(); });
    reset.addEventListener("click", function () {
      if (!win.confirm(he ? "לאפס רק את כוכבי הקבוצה בלוח הזה?" : "Reset only this team's star ledger?")) return;
      state.teams[active] = sanitize(null, [{id: active}]).teams[active]; write(); render();
    });
    clearAll.addEventListener("click", function () {
      if (!win.confirm(he ? "למחוק את כוכבי כל הקבוצות בלוח הזה? המשחק עצמו לא יתאפס." : "Clear every team's star ledger? The game itself will not be reset.")) return;
      state = sanitize(null, teams); write(); render();
    });
    // A self-contained extension: never touches the game's score, answers, audio, or analytics.
    main.appendChild(box); render();
    if (!storage) message.textContent = he ? "שמירה מקומית אינה זמינה במכשיר הזה." : "Local saving is unavailable on this device.";
    return true;
  }
  return Object.freeze({rules: RULES, storageKey: KEY, ruleFor: ruleFor, total: total, sanitize: sanitize, setCount: setCount, mount: mount});
}));
