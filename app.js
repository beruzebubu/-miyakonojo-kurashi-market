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

const fortuneFlows=[
  '今日はゆっくり始めるほど、後半の流れが良くなります。',
  '思いついたことを一つだけ行動に移すと、空気が変わります。',
  '人との会話から、次に進むきっかけが見つかりそうです。',
  '予定通りより、少し寄り道した方が面白い発見があります。',
  '小さな達成感を積み重ねると、気分よく一日を終えられます。',
  '今日は直感が働く日。最初に気になった方を選んでみて。',
  '後回しにしていたことへ手をつけると、流れが整います。',
  '周りを急かさず、自分のペースを守るとうまく進みます。',
  'いつもの選択を少し変えると、良い刺激が入りそうです。',
  '今日は人に頼ることが、結果的に一番の近道になります。',
  '朝より夕方に運気が上向きます。焦らず構えて大丈夫。',
  '身近な場所に小さなチャンスがあります。遠くを探しすぎないで。',
  '気になっていた求人をもう一度見ると、意外な魅力に気づきそうです。',
  '応募するか迷っているなら、今日は情報を集めるだけでも前進です。',
  '新しい仕事や役割に目を向けると、自分の得意が見えやすい日です。',
  '完璧な準備より、まず一歩。動いた後に必要なものが見えてきます。',
  '誰かに自分の希望を話すことで、思わぬ紹介につながるかもしれません。',
  '今日の小さな行動が、数週間後の大きな変化につながります。',
  '興味のある仕事を一つ保存しておくと、次の選択肢が広がります。',
  '自分には無理と思っていたことに、挑戦できる余地が見つかりそうです。',
  'これまでの経験を言葉にすると、自分の強みがはっきりしてきます。',
  '連絡を一本入れるだけで、止まっていた話が動き始めそうです。',
  '今日は「やってみたい」を優先していい日。理由は後からついてきます。',
  '小さな応募、小さな相談、小さな投稿が次の扉を開きます。',
  '迷っている時間より、試してみる時間の方が答えに近づきます。',
  '今の場所を変える準備を始めると、気持ちが前向きになります。',
  '誰かの募集や誘いに、少しだけ前向きに反応してみて。',
  '履歴書やプロフィールを一行だけ直すと、自信が戻ってきます。',
  '自分の希望条件を整理すると、選ぶべき仕事が見えやすくなります。',
  '今日は「できるか」より「やってみたいか」で考えると良い流れです。',
  '見送っていた話に再挑戦するなら、今日がちょうどいいタイミングです。',
  '新しい環境を想像すると、今必要な行動が一つ見えてきます。',
  '小さな勇気を出した分だけ、運気も動きます。',
  '今日は自分を売り込むより、まず知ってもらうことを意識して。',
  '質問を一つするだけで、不安が期待に変わるかもしれません。',
  '行動した人にだけ見える情報が、今日はありそうです。',
  '一歩進んで違うと思ったら戻れば大丈夫。まず試す価値があります。',
  '新しい働き方や副業の情報に、良いヒントが隠れています。',
  '自分の時間を増やせる選択肢に目を向けると、気持ちが軽くなります。',
  '今まで断っていたことの中に、意外な可能性がありそうです。'
];

const fortuneCautions=[
  'ただし、勢いだけで返事をするのは少し待って。',
  '考えすぎると動けなくなるので、結論はシンプルに。',
  '今日は余計な一言に注意。短く伝える方がうまくいきます。',
  '疲れを感じたら無理せず休憩を。頑張りすぎは逆効果です。',
  '予定を詰め込みすぎると気持ちが散らかりそうです。',
  '値段だけで決めず、納得できるかも一度考えて。',
  '人の機嫌を気にしすぎず、自分の判断も大切に。',
  '忘れ物が起きやすい日。出発前に一度確認して。',
  '急な誘いには即答せず、予定を見てから決めましょう。',
  'SNSや噂話をそのまま信じず、一度立ち止まって。',
  '今日は勝ち負けにこだわりすぎない方が気楽です。',
  '財布のひもが緩みやすいので、衝動買いだけ注意。',
  '求人票の良い部分だけで決めず、勤務時間や休日も確認して。',
  '応募条件を全部満たしていなくても、最初から諦めないで。',
  '他人の経歴と比べすぎると、自分の良さを見失います。',
  '不安を理由に何もしないより、質問だけでもしてみて。',
  '完璧な文章を作ろうとして、応募を先延ばしにしないで。',
  '一度断られたことを、自分の価値と結びつけないように。',
  '焦って条件を下げすぎると、あとで苦しくなりそうです。',
  '転職や応募は勢いだけでなく、生活との相性も忘れずに。',
  'やる気がある日に詰め込みすぎると、翌日に疲れが残ります。',
  '知らないことを恥ずかしがらず、早めに聞く方がうまくいきます。',
  '相手に合わせすぎず、自分が大切にしたい条件も残して。',
  'うまく見せようとするより、できることを正直に伝えて。',
  '返事が遅いからといって、悪い結果だと決めつけないで。',
  '今の不満だけで飛び出さず、次に欲しいものも整理して。',
  '忙しさを理由に、自分の将来を後回しにしすぎないで。',
  '大きな決断ほど、今日中に全部決めなくても大丈夫。',
  '無料や好条件だけで飛びつかず、長く続けられるかも見て。',
  '周囲の反対だけで諦めず、自分で一度確かめてみて。',
  '挑戦するときほど、睡眠と食事を削らないように。',
  '一人で抱え込むより、経験者に一度相談した方が早いです。',
  '結果が出る前に、自分で可能性を閉じないで。',
  '何社も同時に見すぎると迷うので、今日は三つまでに絞って。',
  '条件が曖昧な募集は、遠慮せず確認してから進んで。',
  '新しいことを始めるなら、今の予定に入る余白も作って。',
  '自分を安く見積もりすぎないこと。経験は思った以上に価値があります。',
  '最初から長期の正解を探さず、次の一歩として考えて。',
  '応募後に不安になっても、それは行動した証拠です。',
  '迷ったときは、怖くない方ではなく納得できる方を選んで。'
];

const fortuneActions=[
  '机の上を1分だけ片付ける',
  'いつもより少し早く返信する',
  '温かい飲み物をゆっくり飲む',
  '普段話さない人へ挨拶する',
  '靴をきれいにして出かける',
  '気になっていた場所へ寄ってみる',
  '写真を1枚撮って残す',
  '今日やることを3つだけ書く',
  '財布の中を整理する',
  '5分だけ外の空気を吸う',
  '好きな曲を1曲聴く',
  '鏡を見て笑ってみる',
  '誰かを一つ褒める',
  'スマホを10分だけ置く',
  'いつもと違う道を通る',
  '気になる求人を一つ保存する',
  '応募先へ質問を一つ送る',
  '履歴書を一行だけ更新する',
  '自分の得意を三つ書き出す',
  '働きたい時間帯をメモする',
  '気になる会社の口コミを確認する',
  '知人に仕事情報を聞いてみる',
  '求人サイトを5分だけ見る',
  '応募ボタンの手前まで進めてみる',
  '今の仕事で得た経験を書き出す',
  '新しいことを一つ検索する',
  'やってみたい仕事を声に出す',
  '明日の予定に30分の行動時間を入れる',
  '迷っている相手へ短い連絡を送る',
  '自分の希望条件を三つに絞る'
];

const luckyColors=['ミントグリーン','白','空色','ベージュ','オレンジ','紫','ネイビー','黄色','カーキ','グレー','赤','ピンク','水色','茶色','黒'];
const luckyItems=['ハンカチ','温かい飲み物','イヤホン','メモ帳','小銭','鍵','いつもの靴','腕時計','ボールペン','折りたたみ傘','ガム','タオル','帽子','スマホケース','名刺','エコバッグ','鏡','お菓子','水筒','本'];

function randomItem(list){return list[Math.floor(Math.random()*list.length)]}
function weightedStars(){
  const n=Math.random()*100;
  if(n<10)return 1;
  if(n<30)return 2;
  if(n<60)return 3;
  if(n<90)return 4;
  return 5;
}
function displayFortune(){
  const stars=weightedStars();
  const flow=randomItem(fortuneFlows);
  const caution=randomItem(fortuneCautions);
  const action=randomItem(fortuneActions);
  $('#fortuneResult').innerHTML=`<span class="fortune-result-label">今日のあなた</span><div class="fortune-stars">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div><h3>${flow}</h3><p class="fortune-caution">${caution}</p><div class="fortune-action"><small>今日のラッキー行動</small><strong>${action}</strong></div><div class="fortune-lucky"><span>ラッキーカラー：<b>${randomItem(luckyColors)}</b></span><span>ラッキーアイテム：<b>${randomItem(luckyItems)}</b></span></div><button id="retryFortune" class="retry-fortune" type="button">もう一度タップする</button><small>指紋は演出です。占いは娯楽としてお楽しみください。</small>`;
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