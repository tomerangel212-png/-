// Executes the real loader patches and game startup with the real chess.js engine.
// DOM/timers are test doubles; this does not replace real-device/browser testing.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function environment(Chess, gameSource, failFetch = false) {
  const ids = new Map(), timers = new Map(), events = [];
  let nextTimer = 1;
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.dataset = {};
      this.className = ''; this.disabled = false; this.listeners = {};
      this.attributes = {}; this.textContent = ''; this.value = '';
      this.classList = {
        add: (...names) => { this.className = [...new Set([...this.className.split(' ').filter(Boolean), ...names])].join(' '); },
        remove: (...names) => { this.className = this.className.split(' ').filter(x => !names.includes(x)).join(' '); },
        toggle: (name, enabled) => { if (enabled) this.classList.add(name); else this.classList.remove(name); }
      };
    }
    set id(value) { this._id = value; ids.set(value, this); }
    get id() { return this._id; }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
    dispatch(name, event = {}) { for (const fn of this.listeners[name] || []) fn({ target: this, ...event }); }
    click() { if (!this.disabled) { this.dispatch('click'); this.onclick?.({target: this}); } }
    querySelectorAll(selector) {
      const all = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
      if (selector === '*') return all;
      if (selector === '.square .piece') return all.filter(el => el.className.split(' ').includes('piece'));
      if (selector === '.square' || selector === '.piece') return all.filter(el => el.className.split(' ').includes(selector.slice(1)));
      if (selector === 'button') return all.filter(el => el.tagName === 'button');
      return [];
    }
    querySelector(selector) {
      if (selector.startsWith('#')) return ids.get(selector.slice(1)) || null;
      if (selector === 'strong') return this.children.find(el => el.tagName === 'strong') || null;
      const match = selector.match(/data-square="([a-h][1-8])"/);
      return match ? this.querySelectorAll('.square').find(el => el.dataset.square === match[1]) || null : null;
    }
  }
  const shell = new Element(); shell.id = 'chess';
  for (const id of ['board','status','white-clock','black-clock','undo-move','claim-draw','bot-select','bot-profile','new-game','flip-board']) {
    const el = new Element(id.includes('clock') || id.includes('move') || id.includes('game') || id.includes('draw') || id === 'flip-board' ? 'button' : 'div');
    el.id = id; shell.append(el);
    if (id.includes('clock')) el.append(new Element('strong'));
  }
  ids.get('bot-select').value = 'local';
  const document = {
    getElementById: id => ids.get(id) || null,
    querySelector: selector => selector.startsWith('#') ? ids.get(selector.slice(1)) || null : null,
    querySelectorAll: selector => shell.querySelectorAll(selector),
    createElement: tag => new Element(tag)
  };
  const window = { posthog: { capture: (name, data) => events.push({name, data}) }, prompt: () => 'Q', location: { reload() {} } };
  const context = vm.createContext({
    __Chess: Chess, document, window,
    console: { log: console.log, error() {} },
    AbortController,
    fetch: async () => failFetch ? {ok:false,status:503} : {ok:true,text:async()=>gameSource},
    setTimeout: (fn, ms) => { const id=nextTimer++; timers.set(id,{fn,ms}); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval: () => nextTimer++, clearInterval() {}
  });
  return {context, ids, timers, events, window};
}

export async function runChessBootRegression(Chess) {
  const loader = fs.readFileSync('games-loader.js','utf8');
  const game = fs.readFileSync('games.js','utf8');
  let passed = 0;
  const check = (name, condition) => { assert.ok(condition, name); passed++; console.log('PASS - boot: '+name); };
  const env = environment(Chess, game);
  const marker = 'const ratingLabels = ';
  assert.ok(loader.includes(marker), 'loader assembly boundary exists');
  // Run the actual loader up through all patch applications, not a reimplementation.
  const assembly = loader.slice(0,loader.indexOf(marker)) + '\nreturn source;\n}\nbootChess();';
  const compiled = await vm.runInContext(assembly,env.context,{timeout:5000});
  check('all runtime patches construct and match the current games.js', typeof compiled === 'string');
  const syntax = spawnSync(process.execPath,['--input-type=module','--check'],{input:compiled,encoding:'utf8',timeout:10000});
  assert.equal(syntax.status,0,syntax.stderr);
  check('generated runtime passes JavaScript syntax validation',true);
  const engineImport = 'import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";';
  assert.ok(compiled.includes(engineImport));
  vm.runInContext(compiled.replace(engineImport,'const Chess = __Chess;'),env.context,{timeout:20000});
  const board = env.ids.get('board');
  const api = env.window.TRA_CHESS_API;
  check('startup creates 64 interactive squares',board.children.length===64);
  check('starting position renders 32 pieces',board.querySelectorAll('.piece').length===32);
  const report=env.events.find(e=>e.name==='chess_rules_regression');
  check('embedded runtime rules regression passes',report && report.data.passed===report.data.total);
  const tap = sq => { const node=board.querySelector(`.square[data-square="${sq}"]`); assert.ok(node,sq); node.click(); };
  tap('e2');tap('e4');tap('e7');tap('e5');
  check('click-to-move accepts e4 and e5',api.history().join(' ')==='e4 e5');
  const before=api.fen();tap('e4');tap('e6');
  check('illegal pawn move does not alter the board',api.fen()===before);
  const hint=api.suggest();
  check('hint preserves the current position',hint && api.fen()===before);
  // The harness stops before the loader's final control re-enable; invoke actual handlers.
  env.ids.get('new-game').disabled=false;env.ids.get('new-game').click();
  check('new game restores the starting position',api.history().length===0 && board.querySelectorAll('.piece').length===32);
  env.ids.get('flip-board').disabled=false;env.ids.get('flip-board').click();
  check('flip board changes orientation',board.children[0].dataset.square==='h1');
  env.ids.get('bot-select').value='shaked';env.ids.get('bot-select').dispatch('change');
  tap('e2');tap('e4');
  const task=[...env.timers.values()].find(timer=>timer.ms===850);
  assert.ok(task,'bot move is scheduled');task.fn();
  check('bot replies with a legal move',api.history().length===2);
  vm.runInContext('chess=new Chess("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1");render();',env.context);
  check('checkmate ends play and disables the board',api.review().gameOver && board.children.every(el=>el.disabled));
  // Test the complete error boundary with an unavailable runtime file.
  const failed=environment(Chess,game,true);
  vm.runInContext(loader,failed.context,{timeout:5000});
  await failed.window.TRA_CHESS_READY;
  check('failed download produces a visible error and retry button',Boolean(failed.window.TRA_CHESS_BOOT_ERROR && failed.ids.get('chess-retry')));
  console.log(`TRA Chess executable boot regression: ${passed}/${passed}`);
}
