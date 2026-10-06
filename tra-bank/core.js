(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TRABank=api})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const VERSION="0.1.0",TOKEN="TRA";
function makeState(opening=9999){if(!Number.isSafeInteger(opening)||opening<0)throw Error("invalid opening balance");return{version:VERSION,currency:TOKEN,virtualOnly:true,ledger:[entry("genesis","OPENING",opening,0,opening,"Opening virtual balance")]}}
function entry(id,type,amount,before,after,note){return{id,type,amount,before,after,note,at:new Date().toISOString()}}
function balance(s){return s.ledger.length?s.ledger[s.ledger.length-1].after:0}
function post(s,type,amount,note=""){if(!["CREDIT","DEBIT"].includes(type))throw Error("invalid transaction type");if(!Number.isSafeInteger(amount)||amount<=0)throw Error("amount must be a positive integer");const before=balance(s),delta=type==="CREDIT"?amount:-amount,after=before+delta;if(after<0)throw Error("insufficient virtual tokens");const id="tx-"+String(s.ledger.length).padStart(6,"0");return{...s,ledger:[...s.ledger,entry(id,type,amount,before,after,String(note).slice(0,120))]}}
function audit(s){let expected=0;for(let i=0;i<s.ledger.length;i++){const x=s.ledger[i];if(x.before!==expected)return{ok:false,index:i,reason:"before mismatch"};const d=x.type==="DEBIT"?-x.amount:x.amount;if(x.after!==x.before+d)return{ok:false,index:i,reason:"after mismatch"};expected=x.after}return{ok:true,balance:expected,count:s.ledger.length}}
return{VERSION,TOKEN,makeState,balance,post,audit};
});