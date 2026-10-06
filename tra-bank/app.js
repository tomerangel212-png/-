"use strict";
const KEY="traFinancialBankSimulatorV1",$=id=>document.getElementById(id);
let state;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.virtualOnly===true&&TRABank.audit(x).ok)return x}catch{}return TRABank.makeState()}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function render(){const a=TRABank.audit(state);$("balance").textContent=a.balance.toLocaleString()+" TRA";$("audit").textContent=a.ok?"✓ Ledger verified":"⚠ Ledger invalid";$("rows").replaceChildren(...state.ledger.slice().reverse().map(x=>{const tr=document.createElement("tr");[x.id,x.type,x.amount,x.before,x.after,x.note].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.append(td)});return tr}))}
$("tx").addEventListener("submit",e=>{e.preventDefault();$("status").textContent="";try{state=TRABank.post(state,$("type").value,Number($("amount").value),$("note").value);save();render();e.target.reset()}catch(err){$("status").textContent=err.message}});
$("reset").onclick=()=>{if(confirm("Reset the virtual simulator ledger?")){state=TRABank.makeState();save();render()}};
state=load();render();