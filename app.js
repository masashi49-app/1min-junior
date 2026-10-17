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
  const PROFILE_KEY = 'oneMinJunior.profile.v1';
  let profile = {name:'',configured:false}, profileUnreadable = false;
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if(stored) {
      const parsed = JSON.parse(stored);
      if(!parsed || typeof parsed.name !== 'string' || typeof parsed.configured !== 'boolean') throw Error('invalid profile');
      profile = {name:parsed.name.slice(0,20),configured:parsed.configured};
    }
  } catch { profileUnreadable=true; }
  let previousGiftCount = C.giftProgress(C.stats(state.records).total).unlocked;
  function saveProfile(name) {
    const next={name:name.trim().slice(0,20),configured:true};
    try {localStorage.setItem(PROFILE_KEY,JSON.stringify(next));profile=next;profileUnreadable=false;return true;}
    catch {$('name-error').textContent='名前を保存できませんでした。端末の保存設定を確認してね。';return false;}
  }
  function openName() {
    $('display-name').value=profile.name;$('name-error').textContent='';$('name-dialog').showModal();
  }
  $('name-button').addEventListener('click',openName);
  $('name-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(saveProfile($('display-name').value)){$('name-dialog').close();render();}
  });
  $('skip-name').addEventListener('click',()=>{
    if(!profile.configured && !profileUnreadable && !saveProfile(''))return;
    $('name-dialog').close();
  });
  function showGift(index,celebrating=false) {
    if(index<0 || index>=C.giftProgress(C.stats(state.records).total).unlocked)return;
    const [title,message]=C.gifts[index];
    $('gift-days').textContent=celebrating ? `${(index+1)*10}日できたね！` : `${(index+1)*10}日のたからもの`;
    $('gift-title').textContent=title;$('gift-message').textContent=message;
    $('gift-art').innerHTML=C.giftArt(index);
    if(!$('gift-dialog').open)$('gift-dialog').showModal();
  }
  function renderGifts(total) {
    const progress=C.giftProgress(total);
    $('next-gift').textContent=total>=100 ? '10このたからものが集まったよ！' : `あと${progress.remaining}日でプレゼント 🎁`;
    $('gift-meter').value=total>=100?10:total%10;
    $('gift-meter').setAttribute('aria-valuetext',total>=100?'100日達成':`あと${progress.remaining}日`);
    $('gift-count').textContent=`${progress.unlocked} / 10`;
    $('gift-grid').replaceChildren();
    C.gifts.forEach(([title],i)=>{
      const unlocked=i<progress.unlocked,b=document.createElement('button');
      b.type='button';b.className='gift-tile';b.disabled=!unlocked;
      b.setAttribute('aria-label',unlocked?`${(i+1)*10}日 ${title}`:`${(i+1)*10}日で開くカード`);
      b.innerHTML=(unlocked?C.giftArt(i):'<span class="card-back" aria-hidden="true">✧</span>')+`<span class="gift-day">${(i+1)*10}日</span><span class="gift-label">${unlocked?title:'おたのしみ'}</span>`;
      b.addEventListener('click',()=>showGift(i));$('gift-grid').append(b);
    });
    if(progress.unlocked>previousGiftCount && !document.querySelector('dialog[open]'))showGift(progress.unlocked-1,true);
    previousGiftCount=progress.unlocked;
  }
  $('open-collection').addEventListener('click',()=>$('collection-dialog').showModal());
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
    $('greeting').textContent=profile.name ? `${profile.name}さん、今日も1分から！` : '今日も、あなたのペースで。';
    $('name-button').textContent=profile.name ? '名前をかえる' : '名前をつける';
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
    renderGifts(stats.total);
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
    if(e.key===PROFILE_KEY){try{const p=e.newValue?JSON.parse(e.newValue):{name:'',configured:false};if(typeof p.name==='string' && typeof p.configured==='boolean'){profile={name:p.name.slice(0,20),configured:p.configured};render();}}catch{}return;}
    if(e.key!==KEY)return;
    try{state=e.newValue?C.validate(JSON.parse(e.newValue)):C.empty();blocked=false;if($('edit-dialog').open)$('edit-dialog').close();render();}catch{blocked=true;status('別の画面の記録を読み込めません。再起動してください。');}
  });
  render();
  if(!profile.configured && !profileUnreadable && !blocked)openName();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>status('オフラインの準備ができませんでした。オンラインで開き直してください。'));
})();
