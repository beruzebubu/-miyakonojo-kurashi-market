(() => {
  const shop = {
    name: '酒と食 人人',
    reading: 'さけとしょく とと',
    category: '居酒屋',
    address: '宮崎県都城市中町2-4 町田ビル1F',
    phone: '0986-36-7067',
    station: '西都城駅から約619m（徒歩約9分）',
    instagram: 'https://www.instagram.com/saketosyoku_toto/',
    map: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('酒と食 人人 宮崎県都城市中町2-4'),
    description: 'おでん、串揚げ、一品料理をお酒と一緒に楽しめる中町の居酒屋。冷えた生ビールや季節の料理を、明るく親しみやすい雰囲気で味わえます。',
    features: ['おでん', '串揚げ', '一品料理', '生ビール', '中町・牟田町エリア']
  };

  const section = document.createElement('section');
  section.className = 'section toto-section';
  section.id = 'gourmet';
  section.innerHTML = `
    <div class="shell">
      <div class="section-heading">
        <span>LOCAL GOURMET</span>
        <h2>都城で飲む・食べる</h2>
        <p>お店から掲載許可をいただいた、地元の飲食店をご紹介します。</p>
      </div>
      <article class="toto-card">
        <div class="toto-visual" aria-label="酒と食 人人の写真案内">
          <div class="toto-sign"><small>酒と食</small><strong>人人</strong><span>SAKE TO SHOKU TOTO</span></div>
          <a class="toto-photo-link" href="${shop.instagram}" target="_blank" rel="noopener noreferrer">
            <span>公式写真・最新メニュー</span><strong>Instagramで見る ↗</strong>
          </a>
        </div>
        <div class="toto-content">
          <div class="toto-labels"><span>掲載許可取得済み</span><span>${shop.category}</span></div>
          <p class="toto-kicker">都城市中町</p>
          <h3>${shop.name}<small>${shop.reading}</small></h3>
          <p class="toto-description">${shop.description}</p>
          <div class="toto-tags">${shop.features.map(item => `<span>${item}</span>`).join('')}</div>
          <dl class="toto-info">
            <div><dt>住所</dt><dd>${shop.address}</dd></div>
            <div><dt>アクセス</dt><dd>${shop.station}</dd></div>
            <div><dt>電話</dt><dd><a href="tel:${shop.phone.replace(/-/g, '')}">${shop.phone}</a></dd></div>
            <div><dt>設備</dt><dd>個室なし／専用駐車場なし</dd></div>
          </dl>
          <p class="toto-note">営業時間・定休日・メニューは変更される場合があります。予約時に店舗へ直接ご確認ください。</p>
          <div class="toto-actions">
            <a class="button primary" href="tel:${shop.phone.replace(/-/g, '')}">電話で予約・確認</a>
            <a class="button secondary" href="${shop.map}" target="_blank" rel="noopener noreferrer">地図を見る</a>
            <a class="button secondary" href="${shop.instagram}" target="_blank" rel="noopener noreferrer">公式Instagram</a>
          </div>
        </div>
      </article>
    </div>`;

  const recommended = document.querySelector('#recommended');
  if (recommended) recommended.before(section);
  else document.querySelector('main')?.append(section);

  const desktopNav = document.querySelector('.desktop-nav');
  if (desktopNav && !desktopNav.querySelector('a[href="#gourmet"]')) {
    const link = document.createElement('a');
    link.href = '#gourmet';
    link.textContent = 'グルメ';
    desktopNav.insertBefore(link, desktopNav.querySelector('a[href="#fortune"]'));
  }
})();
