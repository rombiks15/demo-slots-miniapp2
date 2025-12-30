// Telegram WebApp Initialization
let tg = window.Telegram?.WebApp;
let userId = 'demo_user';
let username = 'Demo User';

// ===== GEO GROUPS (you can edit anytime) =====
const GEO_GROUPS = {
  EU: ['AT','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GR','HR','HU','IE','IS','IT','LT','LU','LV','MT','NL','NO','PL','PT','RO','SE','SI','SK'],
  CIS: ['AM','AZ','BY','GE','KZ','KG','MD','RU','TJ','TM','UA','UZ'],
  LATAM: ['AR','BO','BR','CL','CO','CR','DO','EC','GT','HN','MX','NI','PA','PE','PR','PY','SV','UY','VE'],
  MENA: ['AE','BH','DZ','EG','IL','IQ','JO','KW','LB','LY','MA','OM','PS','QA','SA','SD','SY','TN','YE'],
  ASIA: ['BD','CN','HK','ID','IN','JP','KR','LK','MM','MN','MY','NP','PH','PK','SG','TH','TW','VN'],
  AFRICA: ['AO','CM','DZ','EG','ET','GH','KE','MA','NG','SN','TN','TZ','UG','ZA']
};

function getGeoGroup(code) {
  const c = (code || '').toUpperCase();
  for (const [group, list] of Object.entries(GEO_GROUPS)) {
    if (list.includes(c)) return group;
  }
  return 'DEFAULT';
}

// ===== GEO detection (IP based) =====
async function detectGeo() {
  const geoEl = document.getElementById('profileGeo') || document.getElementById('geo');
  if (!geoEl) return;

  geoEl.textContent = 'Detecting...';

  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();

    const country = data?.country_name || data?.country || 'Unknown';
    const city = data?.city || '';
    geoEl.textContent = city ? `${country} (${city})` : country;

    window.__geo = { country, city, code: data?.country_code || '' };
    window.__geo.group = getGeoGroup(window.__geo.code);
  } catch (e) {
    geoEl.textContent = 'Unknown';
  }
}

// ===== DEMO LOADER (stable) =====
function loadDemo(game) {
  const iframe = document.getElementById('demoFrame');
  const fallback = document.getElementById('demoFallback');
  const openBtn = document.getElementById('openDemoExternalBtn');

  if (!iframe || !fallback || !openBtn || !game?.demoUrl) return;

  // reset
  fallback.style.display = 'none';
  iframe.style.display = 'block';

  // cache bust
  const demoUrl = game.demoUrl + (game.demoUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
  iframe.src = demoUrl;

  // Always allow external open (Telegram often blocks iframe)
  openBtn.onclick = () => {
    if (tg) tg.openLink(game.demoUrl);
    else window.open(game.demoUrl, '_blank');
  };

  // Show fallback after 2s (Telegram webview iframe issues)
  setTimeout(() => {
    fallback.style.display = 'block';
  }, 2000);
}

// ===== Telegram init =====
if (tg) {
  tg.ready();
  tg.expand();

  if (tg.initDataUnsafe?.user) {
    userId = tg.initDataUnsafe.user.id || 'demo_user';
    username =
      tg.initDataUnsafe.user.username ||
      tg.initDataUnsafe.user.first_name ||
      'Demo User';
  }

  if (!userId) userId = 'TEST_SUBID';
  console.log('Telegram WebApp initialized:', { userId, username });
} else {
  console.log('Running in browser mode (not Telegram)');
}

// ===== Avatar helper =====
function setAvatar(profileAvatarEl) {
  if (!profileAvatarEl) return;

  const tgUsername = tg?.initDataUnsafe?.user?.username;

  const setLetter = () => {
    profileAvatarEl.innerHTML = '';
    profileAvatarEl.style.backgroundImage = '';
    profileAvatarEl.textContent = (username || 'U').charAt(0).toUpperCase();
  };

  if (tgUsername) {
    const url = `https://t.me/i/userpic/320/${tgUsername}.jpg`;

    profileAvatarEl.textContent = '';
    profileAvatarEl.style.backgroundImage = `url('${url}')`;
    profileAvatarEl.style.backgroundSize = 'cover';
    profileAvatarEl.style.backgroundPosition = 'center';
    profileAvatarEl.style.backgroundRepeat = 'no-repeat';

    const testImg = new Image();
    testImg.onerror = () => setLetter();
    testImg.src = url + `?v=${Date.now()}`;
  } else {
    setLetter();
  }
}

// ===== UI init =====
document.addEventListener('DOMContentLoaded', () => {
  const userInfoEl = document.getElementById('userInfo');
  const profileUsername = document.getElementById('profileUsername');
  const profileSubid = document.getElementById('profileSubid');
  const profileAvatar = document.getElementById('profileAvatar');

  if (userInfoEl) userInfoEl.textContent = `@${username} • ID: ${userId}`;
  if (profileUsername) profileUsername.textContent = username;
  if (profileSubid) profileSubid.textContent = userId;

  setAvatar(profileAvatar);
  detectGeo();
});

// Close button
document.getElementById('closeBtn')?.addEventListener('click', () => {
  if (tg) tg.close();
  else alert('This would close the Telegram Mini App');
});

// Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.dataset.tab;

    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
  });
});

// ===== Overlay / Game open logic =====
const gameCards = document.querySelectorAll('.game-card');
const gameOverlay = document.getElementById('gameOverlay');
const overlayGameTitle = document.getElementById('overlayGameTitle');
const backBtn = document.getElementById('backBtn');
const playRealBtn = document.getElementById('playRealBtn');
const ctaLargeBtn = document.getElementById('ctaLargeBtn');

let currentGame = null;

function openGameOverlayFromCard(card) {
  if (!card) return;

  currentGame = {
    name: card.dataset.game,
    provider: card.dataset.provider,
    hasDemo: card.dataset.demo === '1',
    demoUrl: card.dataset.demoUrl || ''
  };

  if (overlayGameTitle) overlayGameTitle.textContent = currentGame.name || 'Game';
  gameOverlay?.classList.add('active');
  document.body.style.overflow = 'hidden';

  // ✅ Load demo for Zeus
  if (currentGame.hasDemo && currentGame.demoUrl) {
    loadDemo({ demoUrl: currentGame.demoUrl });
  } else {
    const iframe = document.getElementById('demoFrame');
    const fallback = document.getElementById('demoFallback');
    if (iframe) iframe.src = '';
    if (fallback) fallback.style.display = 'none';
  }
}

gameCards.forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-play-free')) return;
    openGameOverlayFromCard(card);
  });
});

document.querySelectorAll('.btn-play-free').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = e.target.closest('.game-card');
    openGameOverlayFromCard(card);
  });
});

backBtn?.addEventListener('click', () => {
  gameOverlay?.classList.remove('active');
  document.body.style.overflow = '';
  currentGame = null;

  // stop demo
  const iframe = document.getElementById('demoFrame');
  if (iframe) iframe.src = '';
});

// ===== Affiliate redirect =====
function redirectToAffiliate(placement, gameName = null, casinoName = null) {
  const baseUrl = 'https://YOUR_TRACKING_DOMAIN/go'; // TODO replace
  const params = new URLSearchParams({
    subid: userId,
    placement,
    source: 'telegram_webapp'
  });

  if (window.__geo?.code) params.append('geo', window.__geo.code);
  if (window.__geo?.group) params.append('geo_group', window.__geo.group);
  if (gameName) params.append('game', gameName);
  if (casinoName) params.append('casino', casinoName);

  const trackingUrl = `${baseUrl}?${params.toString()}`;

  if (tg) tg.openLink(trackingUrl);
  else window.open(trackingUrl, '_blank');
}

playRealBtn?.addEventListener('click', () => {
  redirectToAffiliate('games', currentGame?.name);
});

ctaLargeBtn?.addEventListener('click', () => {
  redirectToAffiliate('game_cta', currentGame?.name);
});

// Contact manager
document.getElementById('contactBtn')?.addEventListener('click', () => {
  const managerUsername = 'freakbetsroberts';
  const telegramUrl = `https://t.me/${managerUsername}`;
  if (tg) tg.openTelegramLink(telegramUrl);
  else window.open(telegramUrl, '_blank');
});

// Telegram back button
if (tg) {
  tg.BackButton.onClick(() => {
    if (gameOverlay?.classList.contains('active')) {
      gameOverlay.classList.remove('active');
      document.body.style.overflow = '';
      const iframe = document.getElementById('demoFrame');
      if (iframe) iframe.src = '';
    } else {
      tg.close();
    }
  });

  const observer = new MutationObserver(() => {
    const anyOpen = gameOverlay?.classList.contains('active');
    if (anyOpen) tg.BackButton.show();
    else tg.BackButton.hide();
  });

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class']
  });
}
