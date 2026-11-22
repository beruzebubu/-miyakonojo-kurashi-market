const DATA_ROOT = '../../../shared-data/';
const CONTACT_EMAIL = 'weeds_skillup_0128@yahoo.co.jp';
const areaSelect = document.getElementById('areaSelect');
const categorySelect = document.getElementById('categorySelect');
const keywordInput = document.getElementById('keywordInput');
const guideCards = [...document.querySelectorAll('.guideCard')];
const liveResults = document.getElementById('liveResults');
const dataNotice = document.getElementById('dataNotice');
const emptyAction = document.getElementById('emptyAction');
const resultCount = document.getElementById('resultCount');
const noMatch = document.getElementById('noMatch');
const searchSummary = document.getElementById('searchSummary');
const searchChips = document.getElementById('searchChips');
const searchSummaryTitle = document.getElementById('searchSummaryTitle');
const searchSummaryDetail = document.getElementById('searchSummaryDetail');
const prepGuide = document.getElementById('prepGuide');
const prepGuideTitle = document.getElementById('prepGuideTitle');
const prepGuideList = document.getElementById('prepGuideList');
const inputProgressText = document.getElementById('inputProgressText');
const inputProgressNext = document.getElementById('inputProgressNext');
let liveCards = [];

const PREP_GUIDES = {
  'エアコン清掃': {
    title: 'エアコン清掃を相談するときの3つ',
    items: ['台数と設置場所（例：リビング1台）', 'におい・効き・水漏れなど気になる状態', '分かれば、お掃除機能の有無や機種名'],
    placeholder: '例：リビングのエアコン1台。においが気になる。お掃除機能の有無は分かりません。'
  },
  '草刈り・剪定': {
    title: '庭まわりを相談するときの3つ',
    items: ['草刈りか、木の剪定か', 'おおよその広さ・木の高さ', '車や作業道具を置ける場所があるか'],
    placeholder: '例：庭の草刈り。広さは車2台分くらい。家の前に車を置けます。'
  },
  '不用品・片付け': {
    title: '片付けを相談するときの3つ',
    items: ['片付けたい物と、おおよその数', '階段・エレベーター・搬出場所の状況', '希望時期と、残しておきたい物'],
    placeholder: '例：2階のタンス1点と椅子2点。階段のみ。1か月以内を希望。'
  },
  '水回り修理': {
    title: '水回りを相談するときの3つ',
    items: ['台所・浴室・トイレなど、困っている場所', '水漏れ・詰まり・異音などの状態', 'いつからか、水を止められる状態か'],
    placeholder: '例：台所の蛇口から水漏れ。昨夜から。元栓の場所は分かります。'
  },
  'ハウスクリーニング': {
    title: '家の清掃を相談するときの3つ',
    items: ['掃除してほしい場所', 'カビ・油汚れなど気になる状態', '家具や荷物の移動が必要か'],
    placeholder: '例：浴室のカビと水あか。洗面所も希望。荷物は事前に移動できます。'
  },
  'その他': {
    title: '相談するときに伝える3つ',
    items: ['困っている場所', 'いま起きていること', 'いつ頃までに解決したいか'],
    placeholder: '例：場所、困っている状態、希望時期を分かる範囲で書いてください。'
  }
};

function updatePrepGuide() {
  const service = consultForm.elements.service.value;
  const guide = PREP_GUIDES[service];
  if (!guide) {
    prepGuide.hidden = true;
    consultForm.elements.detail.placeholder = PREP_GUIDES['その他'].placeholder;
    return;
  }
  prepGuideTitle.textContent = guide.title;
  prepGuideList.innerHTML = guide.items.map(item => `<li>${text(item)}</li>`).join('');
  consultForm.elements.detail.placeholder = guide.placeholder;
  prepGuide.hidden = false;
}

function updateInputProgress() {
  const requiredFields = ['area', 'service', 'timing'];
  const fieldLabels = {area: '地域', service: '困りごと', timing: '希望時期'};
  let completed = 0;
  requiredFields.forEach(name => {
    const done = Boolean(consultForm.elements[name].value);
    const item = document.querySelector(`[data-progress-field="${name}"]`);
    item.classList.toggle('isDone', done);
    item.querySelector('strong').textContent = done ? consultForm.elements[name].value : '未選択';
    if (done) completed += 1;
  });
  inputProgressText.textContent = completed === requiredFields.length
    ? '3/3 入力完了'
    : `${completed}/3 選択済み`;
  const nextField = requiredFields.find(name => !consultForm.elements[name].value) || '';
  inputProgressNext.dataset.nextField = nextField;
  inputProgressNext.classList.toggle('isComplete', !nextField);
  inputProgressNext.textContent = nextField
    ? `次は「${fieldLabels[nextField]}」を選ぶ`
    : '入力内容を確認する';
  inputProgressNext.setAttribute('aria-label', nextField
    ? `次は${fieldLabels[nextField]}を選びます`
    : '入力内容の確認へ進みます');
}

function text(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function normalizeAreas(value) {
  return Array.isArray(value) ? value.join(' ') : String(value || '');
}

function serviceCard(service, provider) {
  const areas = normalizeAreas(service.areas || service.area || provider.area);
  const tags = Array.isArray(service.tags) ? service.tags : String(service.tags || '').split(',').filter(Boolean);
  const rating = service.rating ? `★ ${text(service.rating)}` : '口コミ準備中';
  const price = service.price || service.priceLabel || '要相談';
  const name = service.name || service.serviceName || service.category || '暮らしサービス';
  const href = provider.publicUrl || `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('みやこんじょ暮らし・' + name + '相談')}`;
  return `<article class="serviceCard guideCard" data-area="${text(areas)}" data-category="${text(service.category || name)}" data-keywords="${text(tags.join(' ') + ' ' + (service.description || ''))}">
    <div class="guideBody"><div class="cardTop"><span>${text(service.category || name)}</span><small>掲載中</small></div>
    <h3>${text(provider.name)}<br><small>${text(name)}</small></h3>
    <dl><div><dt>料金</dt><dd>${text(price)}</dd></div><div><dt>口コミ</dt><dd>${rating}</dd></div><div><dt>対応地域</dt><dd>${text(areas || '要確認')}</dd></div></dl>
    <a class="secondaryButton" href="${text(href)}">相談・依頼する</a></div></article>`;
}

async function loadPublicData() {
  try {
    const [providersResponse, servicesResponse] = await Promise.all([
      fetch(DATA_ROOT + 'providers.json', {cache: 'no-store'}),
      fetch(DATA_ROOT + 'services.json', {cache: 'no-store'})
    ]);
    if (!providersResponse.ok || !servicesResponse.ok) throw new Error('public data unavailable');
    const providersData = await providersResponse.json();
    const servicesData = await servicesResponse.json();
    const providers = (providersData.providers || []).filter(p => p.status === 'active' && p.serviceEnabled === true);
    const providerMap = new Map(providers.map(p => [p.providerId || p.provider_id, p]));
    const services = (servicesData.services || []).filter(s => {
      const provider = providerMap.get(s.providerId || s.provider_id);
      return provider && s.status === 'active';
    });
    if (!services.length) return;
    liveResults.innerHTML = services.map(s => serviceCard(s, providerMap.get(s.providerId || s.provider_id))).join('');
    liveCards = [...liveResults.querySelectorAll('.guideCard')];
    document.getElementById('guideResults').hidden = true;
    emptyAction.hidden = true;
    dataNotice.innerHTML = '<b>本人確認・公開設定済みの事業者だけを表示しています。</b><span>料金・対応地域・サービス内容を確認してご相談ください。</span>';
    resultCount.textContent = services.length + '件掲載中';
  } catch (error) {
    dataNotice.innerHTML = '<b>公開データを確認できませんでした。</b><span>見本表示のままです。実在事業者としての表示はしていません。</span>';
  }
}

function runSearch(scroll = true) {
  const area = areaSelect.value;
  const category = categorySelect.value;
  const keyword = keywordInput.value.trim().toLowerCase();
  const cards = liveCards.length ? liveCards : guideCards;
  let visible = 0;
  cards.forEach(card => {
    const haystack = `${card.dataset.keywords || ''} ${card.textContent}`.toLowerCase();
    const matches = (area === 'all' || (card.dataset.area || '').includes(area)) &&
      (category === 'all' || (card.dataset.category || '').includes(category)) &&
      (!keyword || haystack.includes(keyword));
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  noMatch.hidden = visible !== 0;
  updateSearchSummary(visible, area, category, keyword);
  resultCount.textContent = liveCards.length ? `${visible}件の事業者` : `${visible}件の比較見本（実在0件）`;
  if (scroll) document.getElementById('results').scrollIntoView({behavior: 'smooth'});
}

function selectedOptionText(select) {
  return select.options[select.selectedIndex]?.textContent || '';
}

function updateSearchSummary(visible, area, category, keyword) {
  const conditions = [];
  if (area !== 'all') conditions.push(`地域：${selectedOptionText(areaSelect)}`);
  if (category !== 'all') conditions.push(`サービス：${selectedOptionText(categorySelect)}`);
  if (keyword) conditions.push(`キーワード：${keywordInput.value.trim()}`);
  if (!conditions.length) conditions.push('すべての地域・サービス');

  searchChips.innerHTML = conditions.map(condition => `<span>${text(condition)}</span>`).join('');
  searchSummary.hidden = false;

  if (liveCards.length && visible > 0) {
    searchSummaryTitle.textContent = `実在する事業者が${visible}件見つかりました`;
    searchSummaryDetail.textContent = '料金・対応地域・サービス内容を確認し、相談・依頼へ進めます。';
    return;
  }

  if (liveCards.length) {
    searchSummaryTitle.textContent = 'この条件の実在事業者は0件です';
    searchSummaryDetail.textContent = '条件を変えるか、選んだ内容を相談メモへ引き継げます。';
    return;
  }

  searchSummaryTitle.textContent = '現在、実在事業者の掲載は0件です';
  searchSummaryDetail.textContent = visible > 0
    ? `${visible}件の比較見本を表示中です。見本は実在の事業者・料金・口コミではありません。`
    : '条件に合う比較見本もありません。条件を変えるか、相談メモへ進めます。';
}

document.getElementById('searchButton').addEventListener('click', () => {
  runSearch();
  transferSearchToConsult();
});
keywordInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    runSearch();
    transferSearchToConsult();
  }
});
document.querySelectorAll('.situationChoice').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.situationChoice').forEach(choice => {
    const selected = choice === button;
    choice.classList.toggle('isSelected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  categorySelect.value = button.dataset.category;
  keywordInput.value = '';
  runSearch();
  transferSearchToConsult();
}));
const consultForm = document.getElementById('consultForm');
const formStatus = document.getElementById('formStatus');
const consultReview = document.getElementById('consultReview');
const openConsultMail = document.getElementById('openConsultMail');

function transferSearchToConsult() {
  const transferred = [];
  const selectedArea = areaSelect.value;
  consultForm.elements.area.value = selectedArea !== 'all' ? selectedArea : '';
  if (selectedArea !== 'all') transferred.push('地域');

  const serviceMap = {
    'エアコン': 'エアコン清掃',
    '草刈り': '草刈り・剪定',
    '片付け': '不用品・片付け',
    '水回り': '水回り修理',
    '清掃': 'ハウスクリーニング'
  };
  const selectedService = serviceMap[categorySelect.value] || '';
  consultForm.elements.service.value = selectedService;
  if (selectedService) transferred.push('困りごと');
  updatePrepGuide();
  updateInputProgress();

  const message = transferred.length
    ? transferred.join('と') + 'を相談メモへ引き継ぎました。'
    : '地域やサービスを選ぶと、相談メモへ引き継げます。';
  hideReview(message);

  const title = document.getElementById('consultHandoffTitle');
  const link = document.getElementById('consultHandoffLink');
  if (title && link) {
    title.textContent = transferred.length
      ? '選んだ条件を相談メモに反映しました。'
      : '掲載準備中の今も、相談内容を整理できます。';
    link.textContent = transferred.length
      ? 'この条件で相談内容をまとめる'
      : '相談内容をまとめる';
  }
}

emptyAction.addEventListener('click', transferSearchToConsult);
document.getElementById('searchSummaryConsult').addEventListener('click', transferSearchToConsult);

function consultText() {
  const data = new FormData(consultForm);
  return `地域：${data.get('area') || '未選択'}\n困りごと：${data.get('service') || '未選択'}\n希望時期：${data.get('timing') || '未選択'}\n\n内容：\n${String(data.get('detail') || '').trim() || '未入力（相談時に確認）'}`;
}

function consultMailHref() {
  const subject = `みやこんじょ暮らし・${consultForm.elements.service.value}の相談`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(consultText())}`;
}

function hideReview(message = '') {
  consultReview.hidden = true;
  if (message) formStatus.textContent = message;
}

function showReview() {
  const fields = [
    ['reviewArea', 'area'],
    ['reviewService', 'service'],
    ['reviewTiming', 'timing'],
    ['reviewDetail', 'detail']
  ];
  fields.forEach(([id, name]) => {
    const value = consultForm.elements[name].value.trim();
    document.getElementById(id).textContent = value || (name === 'detail' ? '未入力（相談時に確認）' : '未選択');
  });
  openConsultMail.href = consultMailHref();
  consultReview.hidden = false;
  formStatus.textContent = '入力内容を確認してください。まだ運営には送信されていません。';
  consultReview.scrollIntoView({behavior: 'smooth', block: 'start'});
  consultReview.focus({preventScroll: true});
}

document.querySelectorAll('.consultButton').forEach(button => button.addEventListener('click', () => {
  const service = button.dataset.service || '';
  const serviceField = consultForm.elements.service;
  serviceField.value = [...serviceField.options].some(option => option.value === service) ? service : service.includes('エアコン') ? 'エアコン清掃' : service.includes('草刈り') ? '草刈り・剪定' : service.includes('片付け') ? '不用品・片付け' : 'その他';
  const selectedArea = areaSelect.value;
  if (selectedArea !== 'all') consultForm.elements.area.value = selectedArea;
  hideReview('サービスを相談メモへ引き継ぎました。');
  updatePrepGuide();
  document.getElementById('consult').scrollIntoView({behavior: 'smooth'});
}));

consultForm.elements.service.addEventListener('change', updatePrepGuide);
consultForm.addEventListener('change', updateInputProgress);
inputProgressNext.addEventListener('click', () => {
  const nextField = inputProgressNext.dataset.nextField;
  if (nextField) {
    const field = consultForm.elements[nextField];
    field.scrollIntoView({behavior: 'smooth', block: 'center'});
    field.focus({preventScroll: true});
    return;
  }
  consultForm.requestSubmit();
});

consultForm.addEventListener('input', () => {
  if (!consultReview.hidden) hideReview('内容が変わりました。もう一度「入力内容を確認する」を押してください。');
});

consultForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!consultForm.reportValidity()) return;
  showReview();
});

document.getElementById('editConsult').addEventListener('click', () => {
  hideReview('入力欄へ戻りました。修正後にもう一度確認してください。');
  consultForm.elements.area.focus();
  consultForm.scrollIntoView({behavior: 'smooth', block: 'center'});
});

document.getElementById('copyConsult').addEventListener('click', async () => {
  if (!consultForm.reportValidity()) return;
  try {
    await navigator.clipboard.writeText(consultText());
    formStatus.textContent = '相談メモをコピーしました。メールや電話の準備に使えます。';
  } catch (error) {
    formStatus.textContent = 'コピーできませんでした。「メールアプリを開く」をご利用ください。';
  }
});

loadPublicData();
updatePrepGuide();
updateInputProgress();

