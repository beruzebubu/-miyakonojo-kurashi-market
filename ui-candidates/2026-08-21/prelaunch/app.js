const DATA_ROOT = '../../../shared-data/';
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function normalizeAreas(value) { return Array.isArray(value) ? value.join(' ') : String(value || ''); }
function safeHref(value, fallback) {
  const url = String(value || '').trim();
  if (/^https:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  return fallback;
}
function mailto(subject, body) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function serviceCard(service, provider) {
  const areas = normalizeAreas(service.areas || service.area || provider.area);
  const tags = Array.isArray(service.tags) ? service.tags : String(service.tags || '').split(',').filter(Boolean);
  const rating = service.rating ? `★ ${escapeHtml(service.rating)}` : '口コミ準備中';
  const price = service.price || service.priceLabel || '要相談';
  const name = service.name || service.serviceName || service.category || '暮らしサービス';
  const fallback = mailto(`みやこんじょ暮らし・${name}相談`, `事業者：${provider.name}\nサービス：${name}\n相談内容：`);
  const href = safeHref(provider.publicUrl, fallback);
  return `<article class="serviceCard guideCard" data-area="${escapeHtml(areas)}" data-category="${escapeHtml(service.category || name)}" data-keywords="${escapeHtml(tags.join(' ') + ' ' + (service.description || ''))}">
    <div class="guideBody"><div class="cardTop"><span>${escapeHtml(service.category || name)}</span><small>掲載中</small></div>
    <h3>${escapeHtml(provider.name)}<br><small>${escapeHtml(name)}</small></h3>
    <dl><div><dt>料金</dt><dd>${escapeHtml(price)}</dd></div><div><dt>口コミ</dt><dd>${rating}</dd></div><div><dt>対応地域</dt><dd>${escapeHtml(areas || '要確認')}</dd></div></dl>
    <a class="secondaryButton" href="${escapeHtml(href)}">相談・依頼する</a></div></article>`;
}
async function loadPublicData() {
  try {
    const [providersResponse, servicesResponse] = await Promise.all([
      fetch(DATA_ROOT + 'providers.json', {cache:'no-store'}), fetch(DATA_ROOT + 'services.json', {cache:'no-store'})
    ]);
    if (!providersResponse.ok || !servicesResponse.ok) throw new Error('public data unavailable');
    const providersData = await providersResponse.json();
    const servicesData = await servicesResponse.json();
    const providers = (providersData.providers || []).filter(p => p.status === 'active' && p.serviceEnabled === true);
    const providerMap = new Map(providers.map(p => [p.providerId || p.provider_id, p]));
    const services = (servicesData.services || []).filter(s => providerMap.has(s.providerId || s.provider_id) && s.status === 'active');
    if (!services.length) {
      resultCount.textContent = '掲載準備中';
      return;
    }
    liveResults.innerHTML = services.map(s => serviceCard(s, providerMap.get(s.providerId || s.provider_id))).join('');
    liveCards = [...liveResults.querySelectorAll('.guideCard')];
    document.getElementById('guideResults').hidden = true;
    dataNotice.innerHTML = '<b>公開設定済みの事業者だけを表示しています。</b><span>料金・対応地域・サービス内容を確認してご相談ください。</span>';
    resultCount.textContent = services.length + '件掲載中';
  } catch (error) {
    dataNotice.innerHTML = '<b>公開データを確認できませんでした。</b><span>見本表示のままです。実在事業者としての表示はしていません。</span>';
  }
}
function runSearch(scroll=true) {
  const area = areaSelect.value;
  const category = categorySelect.value;
  const keyword = keywordInput.value.trim().toLowerCase();
  const cards = liveCards.length ? liveCards : guideCards;
  let visible = 0;
  cards.forEach(card => {
    const haystack = `${card.dataset.keywords || ''} ${card.textContent}`.toLowerCase();
    const matches = (area === 'all' || (card.dataset.area || '').includes(area)) && (category === 'all' || (card.dataset.category || '').includes(category)) && (!keyword || haystack.includes(keyword));
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  noMatch.hidden = visible !== 0;
  resultCount.textContent = liveCards.length ? `${visible}件表示` : `${visible}件の比較見本`;
  if (scroll) document.getElementById('results').scrollIntoView({behavior:'smooth'});
}
document.getElementById('searchButton').addEventListener('click', () => runSearch());
keywordInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
document.querySelectorAll('.quickLinks [data-category]').forEach(button => button.addEventListener('click', () => { categorySelect.value = button.dataset.category; runSearch(); }));
document.querySelectorAll('.consultButton').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#consultForm [name="service"]').value = button.dataset.service.includes('エアコン') ? 'エアコン' : button.dataset.service.includes('草刈り') ? '草刈り・剪定' : button.dataset.service.includes('片付け') ? '不用品・片付け' : 'その他';
  document.getElementById('consult').scrollIntoView({behavior:'smooth'});
}));
document.getElementById('consultForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.currentTarget);
  const body = `お名前：${f.get('name')}\n地域：${f.get('area')}\n困りごと：${f.get('service')}\nメール：${f.get('email')}\n\n内容：\n${f.get('detail')}`;
  location.href = mailto('みやこんじょ暮らし・困りごと相談', body);
});
document.getElementById('providerForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.currentTarget);
  const body = `事業者名：${f.get('businessName')}\n担当者名：${f.get('contactName')}\n対応地域：${f.get('businessArea')}\n提供サービス：${f.get('businessService')}\n連絡用メール：${f.get('businessEmail')}`;
  location.href = mailto('みやこんじょ暮らし・事業者掲載相談', body);
});
loadPublicData();
