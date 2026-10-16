(function (root) {
  'use strict';
  const subjects = ['exercise', 'piano', 'books'];
  const pad = n => String(n).padStart(2, '0');
  const key = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const date = k => new Date(`${k}T12:00:00`);
  const valid = k => /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(date(k)) && key(date(k)) === k;
  const shift = (k, n) => { const d = date(k); d.setDate(d.getDate()+n); return key(d); };
  const blank = () => ({exercise:false, piano:false, books:false});
  const count = r => subjects.reduce((n,s) => n + (r?.[s] === true ? 1 : 0), 0);
  function stats(records, today = key()) {
    const active = k => count(records[k]) > 0;
    let cursor = active(today) ? today : shift(today,-1), streak = 0;
    while (active(cursor)) { streak++; cursor = shift(cursor,-1); }
    return {streak, total:Object.keys(records).filter(k => valid(k) && k <= today && active(k)).length};
  }
  function validate(data, today = key()) {
    if (!data || data.app !== '1min-junior' || data.schemaVersion !== 1 || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) throw Error('このアプリのJSONバックアップを選んでください。');
    const records = {};
    for (const [k,r] of Object.entries(data.records)) {
      if (!valid(k) || k > today || !r || typeof r !== 'object' || Array.isArray(r) || subjects.some(s => typeof r[s] !== 'boolean') || Object.keys(r).some(s => !subjects.includes(s))) throw Error('日付や記録が正しくありません。未来の日付は復元できません。');
      if (count(r)) records[k] = Object.fromEntries(subjects.map(s => [s,r[s]]));
    }
    return {app:'1min-junior',schemaVersion:1,records};
  }
  const empty = () => ({app:'1min-junior',schemaVersion:1,records:{}});
  function csv(records) {
    return '\uFEFF日付,運動,ピアノ,絵本,達成数\r\n' + Object.keys(records).sort().map(k => [k,...subjects.map(s => records[k][s]?1:0),count(records[k])].join(',')).join('\r\n');
  }
  function monthCells(year, month) {
    const first = new Date(year,month,1,12), days = new Date(year,month+1,0,12).getDate();
    return Array.from({length:Math.ceil((first.getDay()+days)/7)*7}, (_,i) => {
      const day = i-first.getDay()+1;
      return day > 0 && day <= days ? key(new Date(year,month,day,12)) : null;
    });
  }
  const api = {subjects,key,date,valid,shift,blank,count,stats,validate,empty,csv,monthCells};
  if (typeof module !== 'undefined') module.exports = api;
  else root.Junior = api;
})(globalThis);
