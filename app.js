(() => {
  'use strict';
  const C = Junior, KEY = 'oneMinJunior.v1';
  const labels = ['運動','ピアノ','絵本'], emoji = ['💃','🎹','📚'];
  const $ = id => document.getElementById(id);
  const status = text => { $('status').textContent = text; };
  let state = C.empty(), blocked = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = C.validate(JSON.parse(raw));
  } catch {
    blocked = true;
    status('記録を読み込めませんでした。端末の保存設定を確認するか、JSONバックアップから復元してください。元の記録は上書きしていません。');
  }
  let today = C.key(), displayed = C.date(today), editing = null, draft = null;
  displayed.setDate(1);
  function persist(next, restoring = false) {
    if (blocked && !restoring) { status('保存を再開するには、端末の保存設定を確認して再起動するか、JSONから復元してください。'); return false; }
    try { localStorage.setItem(KEY,JSON.stringify(next)); state = next; blocked = false; status(''); return true; }
    catch { status('保存できませんでした。変更は保存していません。端末の空き容量やブラウザの設定を確認してください。'); return false; }
  }
  function saveRecord(k, r) {
    if (k > C.key()) return false;
    const next = {...state,records:{...state.records}};
    if (C.count(r)) next.records[k] = {...r}; else delete next.records[k];
    return persist(next);
  }
  function mark(n) {
    if (n === 3) { const img = document.createElement('img'); img.src = './assets/tiara.png'; img.alt = 'ティアラ'; img.className = 'tiara'; return img; }
    const span = document.createElement('span'); span.textContent = ['', '⭐','🌸'][n] || ''; return span;
  }
  const pretty = k => `${C.date(k).getMonth()+1}月${C.date(k).getDate()}日（${'日月火水木金土'[C.date(k).getDay()]}）`;
  C.subjects.forEach((s,i) => {
    const b = document.createElement('button'); b.className='activity'; b.type='button'; b.dataset.subject=s;
    b.innerHTML=`<span class="emoji" aria-hidden="true">${emoji[i]}</span><span class="label">${labels[i]}</span><span class="check"></span>`;
    b.addEventListener('click', () => {
      const k = C.key(), r = {...C.blank(),...state.records[k]}; r[s] = !r[s];
      if (saveRecord(k,r)) render();
    });
    $('activities').append(b);
    const label = document.createElement('label');
    label.innerHTML=`<span aria-hidden="true">${emoji[i]}</span> ${labels[i]}<input type="checkbox" data-subject="${s}">`;
    label.querySelector('input').addEventListener('change', e => { draft[s] = e.target.checked; });
    $('edit-activities').append(label);
  });
  function render() {
    today = C.key();
    $('today-label').textContent = `きょうは ${pretty(today)}`;
    const r = state.records[today] || C.blank(), n = C.count(r);
    document.querySelectorAll('.activity').forEach(b => {
      const done = r[b.dataset.subject]; b.setAttribute('aria-pressed',String(done));
      b.querySelector('.check').textContent = done ? '✓ できた！' : 'タップして記録';
    });
    const messages = ['すこしだけ、やってみよう。','ひとつできた！ 今日もはなまる。','ふたつできた！ いい感じ。','みっつできた！ 特別な一日。'];
    $('encouragement').replaceChildren();
    if (n) $('encouragement').append(mark(n));
    $('encouragement').append(document.createTextNode(messages[n]));
    const stats = C.stats(state.records,today);
    $('streak').textContent = stats.streak ? `${stats.streak}日つづいてる！` : '0日・今日の1分から！';
    $('total').innerHTML = `これまで <strong>${stats.total}日</strong> できたよ`;
    renderCalendar();
  }
  function renderCalendar() {
    const y = displayed.getFullYear(), m = displayed.getMonth();
    $('month-title').textContent = `${y}年 ${m+1}月`;
    $('calendar').replaceChildren();
    C.monthCells(y,m).forEach(k => {
      if (!k) { const empty = document.createElement('div'); empty.setAttribute('aria-hidden','true'); $('calendar').append(empty); return; }
      const b = document.createElement('button'), n = C.count(state.records[k]);
      b.className = 'day' + (k===today ? ' today' : ''); b.type='button'; b.dataset.date=k;
      b.disabled = k > today;
      if (k===today) b.setAttribute('aria-current','date');
      b.setAttribute('aria-label',`${pretty(k)}、${n}項目できた${k > today ? '、未来の日付' : '、編集'}`);
      const number = document.createElement('span'); number.className='number'; number.textContent=String(C.date(k).getDate());
      const badge = document.createElement('span'); badge.className='mark'; badge.setAttribute('aria-hidden','true'); badge.append(mark(n));
      b.append(number,badge); b.addEventListener('click',()=>openEdit(k)); $('calendar').append(b);
    });
  }
  function openEdit(k) {
    if (k > C.key()) return;
    editing=k; draft={...C.blank(),...state.records[k]};
    $('edit-title').textContent=pretty(k);
    $('edit-activities').querySelectorAll('input').forEach(input => { input.checked=draft[input.dataset.subject]; });
    $('edit-dialog').showModal();
  }
  $('save-edit').addEventListener('click', () => {
    if (editing && saveRecord(editing,draft)) { $('edit-dialog').close(); render(); }
    else { $('edit-dialog').close(); }
  });
  $('edit-dialog').addEventListener('close', () => { editing=null; draft=null; });
  function changeMonth(delta) { displayed.setMonth(displayed.getMonth()+delta); renderCalendar(); }
  $('prev').addEventListener('click',()=>changeMonth(-1));
  $('next').addEventListener('click',()=>changeMonth(1));
  let touch=null;
  $('calendar-swipe').addEventListener('touchstart',e=>{ touch=e.touches.length===1 ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : null; },{passive:true});
  $('calendar-swipe').addEventListener('touchend',e=>{
    if (!touch) return;
    const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y; touch=null;
    if (Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5) changeMonth(dx>0?-1:1);
  },{passive:true});
  $('calendar-swipe').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  async function exportFile(text,filename,type) {
    if (blocked) { status('記録を読み込めていないため、書き出しできません。'); return; }
    const file = new File([text],filename,{type});
    try {
      if (navigator.share && navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file],title:filename}); status('共有先で保存を確認してください。'); return;
      }
    } catch(e) { if(e.name==='AbortError') return; }
    const url = URL.createObjectURL(file), a = document.createElement('a'); a.href=url; a.download=filename;
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    status('書き出しました。ダウンロード先を確認してください。');
  }
  $('backup').addEventListener('click',()=>exportFile(JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),`1min-junior-backup-${C.key()}.json`,'application/json'));
  $('csv').addEventListener('click',()=>exportFile(C.csv(state.records),`1min-junior-records-${C.key()}.csv`,'text/csv;charset=utf-8'));
  $('restore').addEventListener('click',()=>$('restore-file').click());
  $('restore-file').addEventListener('change',async e=>{
    const file=e.target.files[0]; e.target.value=''; if(!file)return;
    try {
      if(file.size>5*1024*1024) throw Error('ファイルが大きすぎます。5MB以下のJSONを選んでください。');
      const next=C.validate(JSON.parse(await file.text()));
      if(!confirm(`バックアップの${C.stats(next.records).total}日分の記録で、現在の記録を置き換えます。よろしいですか？\n必要なら先に今の記録をバックアップしてください。`))return;
      if(persist(next,true)){render();status('記録を復元しました。');}
    } catch(e){status(e instanceof SyntaxError ? 'JSONを読み込めませんでした。記録は変更していません。' : e.message);}
  });
  function refreshDate(){ if(today!==C.key()){ displayed=C.date(C.key()); displayed.setDate(1); if($('edit-dialog').open)$('edit-dialog').close(); render(); } }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});
  window.addEventListener('focus',refreshDate);setInterval(refreshDate,30000);
  window.addEventListener('storage',e=>{
    if(e.key!==KEY)return;
    try{state=e.newValue?C.validate(JSON.parse(e.newValue)):C.empty();blocked=false;if($('edit-dialog').open)$('edit-dialog').close();render();}catch{blocked=true;status('別の画面の記録を読み込めません。再起動してください。');}
  });
  render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>status('オフラインの準備ができませんでした。オンラインで開き直してください。'));
})();
