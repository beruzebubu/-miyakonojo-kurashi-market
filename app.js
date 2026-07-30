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
  const reachedAdStage=searchNumber>FREE_SEARCHES;
  const scheduledAd=reachedAdStage&&((searchNumber-(FREE_SEARCHES+1))%AD_INTERVAL===0);
  const shouldShow=hasResults&&scheduledAd&&state.adsToday<DAILY_AD_LIMIT;
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
    label.textContent='占いスポンサー';
    message.textContent='今日の占い結果を見る前に、スポンサー広告を1回表示しています。ゲームは任意です。';
    nextButton.textContent='占い結果を見る';
  }else{
    label.textContent=`3秒スポンサー・検索${searchNumber}回目`;
    message.textContent='無料検索を支えるスポンサーです。ゲームは任意で、すぐ検索結果へ進めます。';
    nextButton.textContent='検索結果を見る';
  }
  $('#sponsorOverlay').hidden=false;
  lockPage(true);
}

function closeSponsor(){
  $('#sponsorOverlay').hidden=true;
  lockPage(false);
}

function continuePending(){
  closeSponsor();
  const action=pendingAction;
  pendingAction=null;
  if(action)action();
}

function openSponsorGame(){
  $('#sponsorOverlay').hidden=true;
  const frame=$('#shiftTetrisFrame');
  frame.src=`${GAME_URL}?t=${Date.now()}`;
  $('#gameOverlay').hidden=false;
  $('#gameToResults').textContent=pendingKind==='fortune'?'ゲームを閉じて占い結果を見る':'ゲームを閉じて検索結果を見る';
  lockPage(true);
}

function stopSponsorGame(){
  const frame=$('#shiftTetrisFrame');
  frame.src='about:blank';
}

function closeSponsorGame(runPending){
  stopSponsorGame();
  $('#gameOverlay').hidden=true;
  lockPage(false);
  if(runPending){
    const action=pendingAction;
    pendingAction=null;
    if(action)action();
  }else{
    pendingAction=null;
  }
}

function displayResults(results){
  $('#resultCount').textContent=results.length?`${results.length}件の事業者が見つかりました`:'条件に合う事業者はまだ掲載されていません';
  $('#resultCards').innerHTML=results.map(vendorCard).join('');
  $('#searchResults').hidden=false;
  $('#searchResults').scrollIntoView({behavior:'smooth',block:'start'});
}

function startSearch(){
  const results=getSearchResults();
  const adDecision=registerSearchAndShouldShowAd(results.length>0);
  const action=()=>displayResults(results);
  if(adDecision.shouldShow)showSponsor(action,'search',adDecision.searchNumber);else action();
}

function setQuickSearch(word){
  $('#searchService').value=[...$('#searchService').options].some(o=>o.value===word)?word:'all';
  $('#searchKeyword').value=word==='all'?'':word.replace('清掃','');
  $('#search').scrollIntoView({behavior:'smooth'});
  window.setTimeout(startSearch,250);
}

const fortuneTexts={
  '総合運':['焦らず順番を整えると、思った以上に物事が進む日です。','人との会話から小さな好機が見つかりそうです。','今日は新しいことより、途中のことを仕上げると運気が整います。'],
  '仕事運':['面倒に感じる仕事を先に片付けると、午後が軽くなります。','一人で抱えず、早めに相談することで結果が良くなります。','数字や期限をもう一度確認すると、見落としを防げます。'],
  '金運':['大きく増やすより、無駄を一つ減らすことが金運につながります。','予定外の買い物は一晩置いて考えると正解に近づきます。','身近な人からお得な情報が入る可能性があります。'],
  '恋愛運':['気の利いた言葉より、素直な一言が伝わる日です。','相手の話を最後まで聞くことで距離が縮まります。','昔の思い込みを手放すと、新しい見方ができます。'],
  '健康運':['今日は頑張りすぎず、睡眠と水分を優先してください。','肩や首を軽く動かすだけでも、気分が切り替わります。','食事の時間を整えることが、体調の安定につながります。']
};

function fortuneSeed(birthday,theme){
  const key=`${birthday}-${theme}-${todayKey()}`;
  let n=0;
  for(let i=0;i<key.length;i++)n=(n*31+key.charCodeAt(i))>>>0;
  return n;
}

function displayFortune(){
  const birthday=$('#fortuneBirthday').value;
  const theme=$('#fortuneTheme').value;
  const seed=fortuneSeed(birthday,theme);
  const stars=3+(seed%3);
  const text=fortuneTexts[theme][seed%fortuneTexts[theme].length];
  const luckyColors=['緑','白','青','ベージュ','オレンジ'];
  const luckyItems=['ハンカチ','温かい飲み物','腕時計','メモ帳','小銭入れ'];
  $('#fortuneResult').innerHTML=`<span class="fortune-result-label">${theme}</span><div class="fortune-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div><h3>${text}</h3><div class="fortune-lucky"><span>ラッキーカラー：<b>${luckyColors[seed%luckyColors.length]}</b></span><span>ラッキーアイテム：<b>${luckyItems[(seed>>3)%luckyItems.length]}</b></span></div><small>占いは娯楽としてお楽しみください。</small>`;
  $('#fortuneResult').hidden=false;
  $('#fortuneResult').scrollIntoView({behavior:'smooth',block:'center'});
}

function startFortune(){
  const birthday=$('#fortuneBirthday').value;
  if(!birthday){alert('生年月日を入力してください。');return}
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