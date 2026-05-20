const fs = require('fs');
const f = 'D:/codex ai/ghana-appliances/src/components/admin/visitors-tab.tsx';
let txt = fs.readFileSync(f, 'utf8');
txt = txt.replace(/name\.split\('/g, "(name||'').split('");
fs.writeFileSync(f, txt);
console.log('fixed visitors-tab');