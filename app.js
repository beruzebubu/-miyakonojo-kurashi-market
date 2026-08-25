const DATA_ROOT = 'shared-data/';
const CONTACT_EMAIL = 'weeds_skillup_0128@yahoo.co.jp';
const areaSelect = document.getElementById('areaSelect');
const categorySelect = document.getElementById('categorySelect');
const keywordInput = document.getElementById('keywordInput');
const guideCards = [...document.querySelectorAll('.guideCard')];
const liveResults = document.getElementById('liveResults');
const dataNotice = document.getElementById('dataNotice');
const resultCount = document.getElementById('resultCount');
const noMatch = document.getElementById('noMatch');
let liveCards = [];

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
  resultCount.textContent = liveCards.length ? `${visible}件表示` : `${visible}件の比較見本`;
  if (scroll) document.getElementById('results').scrollIntoView({behavior: 'smooth'});
}

document.getElementById('searchButton').addEventListener('click', () => runSearch());
keywordInput.addEventListener('keydown', event => { if (event.key === 'Enter') runSearch(); });
document.querySelectorAll('.quickLinks [data-category]').forEach(button => button.addEventListener('click', () => {
  categorySelect.value = button.dataset.category;
  runSearch();
}));
const consultForm = document.getElementById('consultForm');
const formStatus = document.getElementById('formStatus');
const consultReview = document.getElementById('consultReview');
const openConsultMail = document.getElementById('openConsultMail');

function consultText() {
  const data = new FormData(consultForm);
  return `地域：${data.get('area') || '未選択'}\n困りごと：${data.get('service') || '未選択'}\n希望時期：${data.get('timing') || '未選択'}\n\n内容：\n${data.get('detail') || ''}`;
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
    document.getElementById(id).textContent = consultForm.elements[name].value;
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
  document.getElementById('consult').scrollIntoView({behavior: 'smooth'});
}));

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
