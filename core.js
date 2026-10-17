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
  const gifts = [
    ['はじまりのリボン','小さな「できた！」が10日分。'],
    ['さくらの花かざり','あなたのペースで、咲いているよ。'],
    ['星のチャーム','今日の1分が、きらり。'],
    ['にじいろの貝がら','ひとつずつ、たからものがふえたね。'],
    ['きらめく宝石','50日分の「できた！」が光ってる。'],
    ['ちょうちょのブローチ','好きなことが、少しずつ広がるね。'],
    ['月のペンダント','ひと休みしても、またここから。'],
    ['チューリップの花束','いろんな日の1分が、花束になったよ。'],
    ['金色のかぎ','100日のたからばこまで、あと少し。'],
    ['たからものボックス','100日分の「できた！」は、あなたのたからもの。']
  ];
  const giftProgress = total => ({unlocked:Math.min(10,Math.floor(total/10)),remaining:total>=100?0:10-total%10});
  // Original vector illustrations: bundled with the code, no network images.
  const motifs = [
    '<path d="M48 51 31 84 50 78 61 57M69 51 90 84 70 79 60 57" fill="#dca5b8"/><path d="M60 49C13 4 11 76 54 59M60 49C107 4 109 76 66 59" fill="#f0bacb"/><circle cx="60" cy="52" r="10" fill="#e7bb72"/>',
    '<path d="M60 57Q36 87 24 62Q12 39 44 40Q23 16 49 13Q70 9 68 37Q95 17 103 42Q107 64 79 61Q96 89 70 96Q46 97 60 57" fill="#f0bacb"/><circle cx="61" cy="53" r="12" fill="#f7dc9d"/><circle cx="61" cy="53" r="4" fill="#c99857"/>',
    '<path d="M60 18 73 43 101 48 80 69 84 98 60 84 35 98 40 69 19 48 47 43Z" fill="#f5d697"/><path d="m60 33 7 17 18 3-13 13 2 17-14-9-15 9 3-17-13-13 18-3Z" fill="#fff1cb"/><circle cx="60" cy="12" r="7" fill="none"/>',
    '<path d="M22 73C-2 38 27 19 39 34C41 3 77 4 81 33C103 17 125 48 98 75L73 99H47Z" fill="#d5c7e9"/><path d="M39 34 52 87M60 26V88M81 33 69 87M25 54 46 87M97 54 75 87" fill="none" stroke="#fff7ed"/><path d="M44 89H77L72 102H49Z" fill="#efbfd0"/>',
    '<path d="M20 40 40 18H80L100 40 60 103Z" fill="#d7c6e9"/><path d="M20 40H100M40 18 43 40 60 103 77 40 80 18M43 40 60 18 77 40" fill="none" stroke="#fff9f0"/><path d="m99 4 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#e7bb72" stroke="none"/>',
    '<path d="M57 56C29 7 3 25 18 53Q24 66 43 64C7 67 25 108 56 75M63 56C91 7 117 25 102 53Q96 66 77 64C113 67 95 108 64 75" fill="#cdbce3"/><path d="M26 37Q41 33 51 56M94 37Q79 33 69 56" fill="none" stroke="#fff2f4"/><path d="M58 41Q42 24 46 20M62 41Q78 24 74 20" fill="none"/><ellipse cx="60" cy="62" rx="6" ry="22" fill="#e7bb72"/>',
    '<path d="M67 24C11 6 4 96 62 99Q95 98 99 66C67 93 35 49 67 24Z" fill="#f5d697"/><circle cx="61" cy="15" r="7" fill="none"/><path d="m87 23 5 12 13 5-13 5-5 12-5-12-13-5 13-5Z" fill="#d5c7e9"/>',
    '<path d="M36 55 60 94 84 55M60 45V96" fill="none" stroke="#a6b495"/><path d="M44 65Q18 54 23 78L57 94M76 65Q102 54 97 78L63 94" fill="#b8c7a6"/><path d="M24 23 36 34 48 23V47Q36 70 24 47Z" fill="#efbfd0"/><path d="M48 9 60 20 72 9V35Q60 58 48 35Z" fill="#d5c7e9"/><path d="M72 23 84 34 96 23V47Q84 70 72 47Z" fill="#efbfd0"/><path d="M46 86 60 92 74 86 71 104 60 98 49 104Z" fill="#e7bb72"/>',
    '<circle cx="44" cy="35" r="23" fill="#f5d697"/><circle cx="44" cy="35" r="11" fill="#fffaf3"/><path d="m56 53 12-8 39 43-9 9-9-10-9 8-7-9 9-7Z" fill="#e7bb72"/><path d="m20 82 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#efbfd0" stroke="none"/>'
  ];
  function giftArt(index) {
    let content = motifs[index];
    if(index===9) {
      content = '<path d="M25 58H95V103H25Z" fill="#efbfd0"/><path d="M20 48H100V64H20Z" fill="#d5c7e9"/><path d="M54 49H66V103H54Z" fill="#f5d697"/>';
      motifs.forEach((m,i)=>{ const x=6+(i%3)*37, y=-3+Math.floor(i/3)*19;content+=`<g transform="translate(${x} ${y}) scale(.27)">${m}</g>`; });
    }
    return `<svg viewBox="0 0 120 120" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g stroke="#bf996b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${content}</g></svg>`;
  }
  const api = {gifts,giftProgress,giftArt,subjects,key,date,valid,shift,blank,count,stats,validate,empty,csv,monthCells};
  if (typeof module !== 'undefined') module.exports = api;
  else root.Junior = api;
})(globalThis);
