const vendors=[
  {name:'みやこのエアコンクリーン',area:'都城市',service:'エアコン清掃',price:'8,800円〜',rating:'4.9',emoji:'🧼',meta:'損害保険加入／写真確認対応',tags:['明朗会計','追加前に確認','即日相談'],email:'weeds_skillup_0128@yahoo.co.jp'},
  {name:'みまた庭しごと',area:'三股町',service:'草刈り・剪定',price:'7,700円〜',rating:'4.8',emoji:'🌳',meta:'草刈り・剪定／処分対応',tags:['面積別料金','写真見積もり','空き地対応'],email:'weeds_skillup_0128@yahoo.co.jp'},
  {name:'そお片付けサポート',area:'曽於市',service:'不用品回収',price:'13,200円〜',rating:'4.7',emoji:'🚛',meta:'不用品回収／写真確認対応',tags:['車両別料金','明細発行','土日相談'],email:'weeds_skillup_0128@yahoo.co.jp'},
  {name:'みやこんじょ住まい清掃',area:'都城市',service:'ハウス清掃',price:'19,800円〜',rating:'4.8',emoji:'🧹',meta:'空室・入居中／水回り対応',tags:['事前見積もり','女性在宅相談','セット料金'],email:'weeds_skillup_0128@yahoo.co.jp'},
  {name:'南九州水まわり相談室',area:'都城市',service:'水回り修理',price:'8,800円〜',rating:'4.7',emoji:'🔧',meta:'水漏れ・軽度つまり対応',tags:['出張費明記','作業前確認','緊急相談'],email:'weeds_skillup_0128@yahoo.co.jp'}
];

const $=selector=>document.querySelector(selector);
const STORAGE_KEY='mkn_kurashi_ad_state_v1';
const FREE_SEARCHES=3;
const AD_INTERVAL=3;
const DAILY_AD_LIMIT=3;
const GAME_URL='https://beruzebubu.github.io/shift-tetris/';
let pendingAction=null;
let pendingKind='search';
let deferredPrompt=null;

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function defaultAdState(){return {totalSearches:0,adDate:todayKey(),adsToday:0}}
function loadAdState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    const state={...defaultAdState(),...saved};
    if(state.adDate!==todayKey()){state.adDate=todayKey();state.adsToday=0}
    return state;
  }catch{return defaultAdState()}
}
function saveAdState(state){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
function registerSearchAndShouldShowAd(hasResults){
  const state=loadAdState();
  state.totalSearches+=1;
  const searchNumber=state.totalSearches;
  const scheduled=searchNumber>FREE_SEARCHES&&((searchNumber-(FREE_SEARCHES+1))%AD_INTERVAL===0);
  const shouldShow=hasResults&&scheduled&&state.adsToday<DAILY_AD_LIMIT;
  if(shouldShow)state.adsToday+=1;
  saveAdState(state);
  return {shouldShow,searchNumber};
}

function vendorCard(v){
  const subject=encodeURIComponent(`${v.name}への相談`);
  const body=encodeURIComponent(`相談したいサービス：${v.service}\n氏名：\n電話番号：\n相談内容：`);
  return `<article class="vendor-card"><div class="vendor-visual">${v.emoji}</div><div class="vendor-body"><div class="vendor-top"><span class="verified">運営確認済み</span><span class="rating">★★★★★ ${v.rating}</span></div><h3>${v.name}</h3><p class="vendor-meta">${v.area}／${v.meta}</p><div class="tags">${v.tags.map(tag=>`<span class="tag">${tag}</span>`).join('')}</div><div class="price-box"><small>${v.service}</small><strong>${v.price}</strong></div><div class="vendor-actions"><a href="mailto:${v.email}?subject=${subject}&body=${body}">相談する</a><button type="button" data-detail="${v.name}">詳しく見る</button></div></div></article>`;
}
function renderAll(){$('#vendorCards').innerHTML=vendors.map(vendorCard).join('')}

function getSearchResults(){
  const area=$('#searchArea').value;
  const service=$('#searchService').value;
  const keyword=$('#searchKeyword').value.trim().toLowerCase();
  return vendors.filter(v=>{
    const text=`${v.name} ${v.area} ${v.service} ${v.meta} ${v.tags.join(' ')}`.toLowerCase();
    return (area==='all'||v.area===area)&&(service==='all'||v.service===service)&&(!keyword||text.includes(keyword));
  });
}

function lockPage(locked){document.body.classList.toggle('modal-open',locked)}
function showSponsor(action,kind='search',searchNumber=null){
  pendingAction=action;
  pendingKind=kind;
  const label=$('#sponsorOverlay .sponsor-label');
  const message=$('#sponsorMessage');
  const nextButton=$('#continueSearch');
  if(kind==='fortune'){
    label.textContent='指紋占いスポンサー';
    message.textContent='占い結果を見る前にスポンサー広告を1回表示しています。ゲームは任意です。';
    nextButton.textContent='占い結果を見る';
  }else{
    label.textContent=`3秒スポンサー・検索${searchNumber}回目`;
    message.textContent='無料検索を支えるスポンサーです。ゲームは任意で、すぐ検索結果へ進めます。';
    nextButton.textContent='検索結果を見る';
  }
  $('#sponsorOverlay').hidden=false;
  lockPage(true);
}
function closeSponsor(){$('#sponsorOverlay').hidden=true;lockPage(false)}
function continuePending(){
  closeSponsor();
  const action=pendingAction;
  pendingAction=null;
  if(action)action();
}
function openSponsorGame(){
  $('#sponsorOverlay').hidden=true;
  $('#shiftTetrisFrame').src=`${GAME_URL}?t=${Date.now()}`;
  $('#gameOverlay').hidden=false;
  $('#gameToResults').textContent=pendingKind==='fortune'?'ゲームを閉じて占い結果を見る':'ゲームを閉じて検索結果を見る';
  lockPage(true);
}
function stopSponsorGame(){$('#shiftTetrisFrame').src='about:blank'}
function closeSponsorGame(runPending){
  stopSponsorGame();
  $('#gameOverlay').hidden=true;
  lockPage(false);
  const action=pendingAction;
  pendingAction=null;
  if(runPending&&action)action();
}

function displayResults(results){
  $('#resultCount').textContent=results.length?`${results.length}件の事業者が見つかりました`:'条件に合う事業者はまだ掲載されていません';
  $('#resultCards').innerHTML=results.map(vendorCard).join('');
  $('#searchResults').hidden=false;
  $('#searchResults').scrollIntoView({behavior:'smooth',block:'start'});
}
function startSearch(){
  const results=getSearchResults();
  const ad=registerSearchAndShouldShowAd(results.length>0);
  const action=()=>displayResults(results);
  if(ad.shouldShow)showSponsor(action,'search',ad.searchNumber);else action();
}
function setQuickSearch(word){
  $('#searchService').value=[...$('#searchService').options].some(o=>o.value===word)?word:'all';
  $('#searchKeyword').value=word==='all'?'':word.replace('清掃','');
  $('#search').scrollIntoView({behavior:'smooth'});
  window.setTimeout(startSearch,250);
}

const fortuneMessages=[
  '今日は、いつもより少しだけ大胆で大丈夫。最初の一歩が流れを変えます。',
  '急がない方がうまくいく日。ひと呼吸おいてから決めると正解に近づきます。',
  '小さな親切が、思わぬ形で返ってきそう。周りをよく見てみて。',
  '今日は直感が冴えています。最初に「これだ」と思った方を選んでみて。',
  '忘れていたことを一つ片付けると、気持ちまで軽くなります。',
  '誰かとの何気ない会話にヒントあり。今日は聞き役が吉。',
  '無理に頑張るより、好きなことを一つ楽しむと運気が上向きます。',
  '今日は寄り道が当たりの日。予定外の場所や情報に注目してみて。',
  '迷ったらシンプルな方へ。考えすぎないことが今日の開運ポイント。',
  'ちょっとした笑顔が流れを変えます。自分から空気を明るくしてみて。'
];
const luckyColors=['ミントグリーン','白','空色','ベージュ','オレンジ','紫','ネイビー'];
const luckyItems=['ハンカチ','温かい飲み物','イヤホン','メモ帳','小銭','鍵','いつもの靴'];

function randomItem(list){return list[Math.floor(Math.random()*list.length)]}
function displayFortune(){
  const stars=2+Math.floor(Math.random()*4);
  const message=randomItem(fortuneMessages);
  $('#fortuneResult').innerHTML=`<span class="fortune-result-label">今日のあなた</span><div class="fortune-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div><h3>${message}</h3><div class="fortune-lucky"><span>ラッキーカラー：<b>${randomItem(luckyColors)}</b></span><span>ラッキーアイテム：<b>${randomItem(luckyItems)}</b></span></div><button id="retryFortune" class="retry-fortune" type="button">もう一度タップする</button><small>指紋は演出です。占いは娯楽としてお楽しみください。</small>`;
  $('#fortuneResult').hidden=false;
  $('#fortuneResult').scrollIntoView({behavior:'smooth',block:'center'});
  $('#retryFortune').addEventListener('click',startFortune);
}
function startFortune(){
  const button=$('#fortuneButton');
  button.classList.add('scanning');
  window.setTimeout(()=>button.classList.remove('scanning'),500);
  showSponsor(displayFortune,'fortune');
}

$('#searchButton').addEventListener('click',startSearch);
$('#searchKeyword').addEventListener('keydown',e=>{if(e.key==='Enter')startSearch()});
$('#continueSearch').addEventListener('click',continuePending);
$('#playSponsorGame').addEventListener('click',openSponsorGame);
$('#closeSponsorGame').addEventListener('click',()=>closeSponsorGame(false));
$('#gameToResults').addEventListener('click',()=>closeSponsorGame(true));
$('#fortuneButton').addEventListener('click',startFortune);
$('#clearSearch').addEventListener('click',()=>{$('#searchArea').value='all';$('#searchService').value='all';$('#searchKeyword').value='';$('#searchResults').hidden=true});
document.querySelectorAll('[data-quick]').forEach(button=>button.addEventListener('click',()=>setQuickSearch(button.dataset.quick)));
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>setQuickSearch(button.dataset.category)));
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-detail]');
  if(!button)return;
  const vendor=vendors.find(v=>v.name===button.dataset.detail);
  alert(`${vendor.name}\n\n対応地域：${vendor.area}\nサービス：${vendor.service}\n料金目安：${vendor.price}\n\n正式公開時は、写真・スタッフ紹介・料金詳細・対応できない作業まで掲載します。`);
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(!$('#gameOverlay').hidden)closeSponsorGame(false);
  else if(!$('#sponsorOverlay').hidden){closeSponsor();pendingAction=null}
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installButton').hidden=false});
$('#installButton').addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installButton').hidden=true});
window.addEventListener('appinstalled',()=>{$('#installButton').hidden=true});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
renderAll();