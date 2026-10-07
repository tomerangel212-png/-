"use strict";

// Exercise the shipped inline script with an isolated DOM/storage harness.
// This is a behavior regression, not a real-browser or real-money integration test.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const html = fs.readFileSync(path.join(__dirname, "tra-bank-212.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, "Load the bank's actual inline application script");
const KEY = "tra-bank-212-v1";

function openBank(storage = new Map()) {
  class Element {
    constructor() { this.children = []; this.value = ""; this.hidden = false; this.text = ""; }
    set textContent(value) { this.text = String(value); this.children = []; }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(""); }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); return child; }
  }
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, new Element()]));
  const alerts = [], confirmations = [];
  let confirmReset = false;
  vm.runInNewContext(scripts[0][1], {
    document: {
      getElementById: id => nodes.get(id) || null,
      createElement: () => new Element(),
      createTextNode: text => ({ textContent: text })
    },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
      clear: () => storage.clear()
    },
    alert: message => alerts.push(message),
    confirm: message => { confirmations.push(message); return confirmReset; }
  }, { filename: "tra-bank-212.html", timeout: 1000 });
  return {
    nodes, alerts, confirmations, storage,
    balance: () => nodes.get("balance").textContent,
    saved() {
      assert.ok(storage.has(KEY), "Transactions save under the bank's local storage key");
      return JSON.parse(storage.get(KEY));
    },
    transact(kind, amount, reason = "Regression test") {
      nodes.get(kind).value = String(amount);
      nodes.get(kind + "Reason").value = reason;
      nodes.get(kind + "Btn").onclick();
    },
    reset(confirmed) { confirmReset = confirmed; nodes.get("resetBtn").onclick(); }
  };
}

// Keep the visible virtual-only / no-real-money / no-cash-out boundary explicit.
const copy = html.replace(/[\u0591-\u05c7]/g, "");
for (const notice of ["Virtual tokens only", "לא בנק אמתי", "אין ערך כספי", "אין cash-out", "אין הפקדת כסף אמתי"]) {
  assert.ok(copy.includes(notice), "Preserve disclaimer: " + notice);
}

let bank = openBank(new Map([["unrelated-app", "keep me"]]));
assert.equal(bank.balance(), "9,999 TRA", "A fresh bank opens with 9,999 virtual tokens");
assert.equal(bank.nodes.get("ledger").children.length, 0);
assert.equal(bank.nodes.get("empty").hidden, false);

function rejectSpend(amount) {
  const before = [...bank.storage];
  const balance = bank.balance();
  const ledger = bank.nodes.get("ledger").textContent;
  const alertCount = bank.alerts.length;
  bank.transact("spend", amount);
  assert.equal(bank.alerts.length, alertCount + 1, "Rejected spending explains the failure");
  assert.equal(bank.balance(), balance, "Rejected spending leaves the balance unchanged");
  assert.equal(bank.nodes.get("ledger").textContent, ledger, "Rejected spending adds no entry");
  assert.deepEqual([...bank.storage], before, "Rejected spending does not change local storage");
}

rejectSpend(10000);
bank.transact("earn", 25, "Earn test");
assert.equal(bank.balance(), "10,024 TRA");
bank.transact("spend", 24, "Spend test");
assert.equal(bank.balance(), "10,000 TRA");
assert.equal(bank.saved().opening, 9999);
assert.deepEqual(bank.saved().entries.map(({ delta, reason }) => ({ delta, reason })), [
  { delta: 25, reason: "Earn test" }, { delta: -24, reason: "Spend test" }
], "Both transaction directions persist under the bank storage key");
assert.ok(bank.saved().entries.every(entry => Number.isFinite(Date.parse(entry.at))));
const persisted = bank.storage.get(KEY);
bank = openBank(bank.storage);
assert.equal(bank.balance(), "10,000 TRA", "Reload restores the saved balance");
assert.equal(bank.storage.get(KEY), persisted, "Reload preserves saved entries");
assert.deepEqual(bank.nodes.get("ledger").children.map(row => row.textContent), [
  "-24 TRA · Spend test", "+25 TRA · Earn test"
], "Reload renders the saved ledger newest first");
assert.equal(bank.nodes.get("empty").hidden, true);

bank.transact("spend", 10000);
assert.equal(bank.balance(), "0 TRA", "Spending exactly the balance is allowed");
bank = openBank(bank.storage);
assert.equal(bank.balance(), "0 TRA", "A saved zero balance survives reload");
rejectSpend(1);
for (const amount of [0, -1, 1.5, "invalid"]) {
  for (const kind of ["earn", "spend"]) {
    const before = [...bank.storage], alerts = bank.alerts.length;
    bank.transact(kind, amount);
    assert.equal(bank.alerts.length, alerts + 1, "Only positive integer token amounts are accepted");
    assert.deepEqual([...bank.storage], before);
    assert.equal(bank.balance(), "0 TRA");
  }
}

const beforeCancel = bank.storage.get(KEY);
const ledgerBeforeCancel = bank.nodes.get("ledger").textContent;
bank.reset(false);
assert.equal(bank.confirmations.length, 1, "Reset asks for confirmation");
assert.equal(bank.balance(), "0 TRA", "Canceling reset preserves the balance");
assert.equal(bank.nodes.get("ledger").textContent, ledgerBeforeCancel);
assert.equal(bank.storage.get(KEY), beforeCancel, "Canceling reset preserves the saved ledger");
bank.reset(true);
assert.equal(bank.confirmations.length, 2);
assert.equal(bank.balance(), "9,999 TRA", "Confirmed reset restores the opening balance");
assert.deepEqual(bank.saved(), { opening: 9999, entries: [] }, "Reset persists an empty local ledger");
assert.equal(bank.nodes.get("ledger").children.length, 0);
assert.equal(bank.nodes.get("empty").hidden, false);
assert.equal(bank.storage.get("unrelated-app"), "keep me", "Reset affects only this bank");
bank = openBank(bank.storage);
assert.equal(bank.balance(), "9,999 TRA", "Reset survives reload");
assert.equal(bank.nodes.get("ledger").children.length, 0);
assert.equal(bank.nodes.get("empty").hidden, false);

console.log("PASS: TRA BANK 212 opening balance, earn/spend, overdraft rejection, local save/reload/reset, and virtual-only notices.");
