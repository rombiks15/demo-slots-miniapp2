// Telegram WebApp Initialization
let tg = window.Telegram?.WebApp;
let userId = 'demo_user';
let username = 'Demo User';

const GEO_GROUPS = {
  // Edit these anytime
  EU: ['AT','BE','BG','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GR','HR','HU','IE','IS','IT','LT','LU','LV','MT','NL','NO','PL','PT','RO','SE','SI','SK'],
  CIS: ['AM','AZ','BY','GE','KZ','KG','MD','RU','TJ','TM','UA','UZ'],
  LATAM: ['AR','BO','BR','CL','CO','CR','DO','EC','GT','HN','MX','NI','PA','PE','PR','PY','SV','UY','VE'],
  MENA: ['AE','BH','DZ','EG','IL','IQ','JO','KW','LB','LY','MA','OM','PS','QA','SA','SD','SY','TN','YE'],
  ASIA: ['BD','CN','HK','ID','IN','JP','KR','LK','MM','MN','MY','NP','PH','PK','SG','TH','TW','VN'],
  AFRICA: ['AO','CM','DZ','EG','ET','GH','KE','MA','NG','SN','TN','TZ','UG','ZA']
};

// Simple helper: returns "LV" -> "EU", "KZ" -> "CIS", etc.
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

    // Optional: store for tracking
    window.__geo = { country, city, code: data?.country_code || '' };
  } catch (e) {
    geoEl.textContent = 'Unknown';
  }
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

// ===== UI helpers =====
function setAvatar(profileAvatarEl) {
  if (!profileAvatarEl) return;

  const tgUsername = tg?.initDataUnsafe?.user?.username;

  // Fallback: letter avatar
  const setLetter = () => {
    profileAvatarEl.innerHTML = '';
    profileAvatarEl.style.backgroundImage = '';
    profileAvatarEl.textContent = (username || 'U').charAt(0).toUpperCase();
  };

  // If we have a Telegram username, try Telegram userpic
  if (tgUsername) {
    const url = `https://t.me/i/userpic/320/${tgUsername}.jpg`;

    // Use background-image (more stable in Telegram WebView)
    profileAvatarEl.textContent = '';
    profileAvatarEl.style.backgroundImage = `url('${url}')`;
    profileAvatarEl.style.backgroundSize = 'cover';
    profileAvatarEl.style.backgroundPosition = 'center';
    profileAvatarEl.style.backgroundRepeat = 'no-repeat';

    // If it fails visually, fallback to letter
    const testImg = new Image();
    testImg.onload = () => {
      // keep background avatar
    };
    testImg.onerror = () => setLetter();
    testImg.src = url + `?v=${Date.now()}`; // cache bust
  } else {
    setLetter();
  }
}

// ===== Update user info in UI =====
document.addEventListener('DOMContentLoaded', () => {
  const userInfoEl = document.getElementById('userInfo');
  const profileUsername = document.getElementById('profileUsername');
  const profileSubid = document.getElementById('profileSubid');
  const profileAvatar = document.getElementById('profileAvatar'); // ✅ FIXED

  if (userInfoEl) {
    userInfoEl.textContent = `@${username} • ID: ${userId}`;
  }

  if (profileUsername) {
    profileUsername.textContent = username;
  }

  if (profileSubid) {
    profileSubid.textContent = userId;
  }

  // ✅ Set real avatar (or fallback letter)
  setAvatar(profileAvatar);

  // ✅ Detect GEO
  detectGeo();
});

// Close button handler
document.getElementById('closeBtn')?.addEventListener('click', () => {
  if (tg) tg.close();
  else alert('This would close the Telegram Mini App');
});

// Tab Navigation
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.dataset.tab;

    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(`${tabName}Tab`)?.classList.add('active');

    console.log('Switched to tab:', tabName);
  });
});

// Game Card Click Handler
const gameCards = document.querySelectorAll('.game-card');
const gameOverlay = document.getElementById('gameOverlay');
const overlayGameTitle = document.getElementById('overlayGameTitle');
const backBtn = document.getElementById('backBtn');
const playRealBtn = document.getElementById('playRealBtn');
const ctaLargeBtn = document.getElementById('ctaLargeBtn');

let currentGame = null;

gameCards.forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-play-free')) return;

    currentGame = {
      name: card.dataset.game,
      provider: card.dataset.provider
    };

    if (overlayGameTitle) overlayGameTitle.textContent = currentGame.name;
    gameOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('Opened game:', currentGame);
  });
});

// Play Free button handler
document.querySelectorAll('.btn-play-free').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = e.target.closest('.game-card');

    currentGame = {
      name: card?.dataset.game,
      provider: card?.dataset.provider
    };

    if (overlayGameTitle) overlayGameTitle.textContent = currentGame.name || 'Game';
    gameOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';

    console.log('Playing game:', currentGame);
  });
});

// Back button handler
backBtn?.addEventListener('click', () => {
  gameOverlay?.classList.remove('active');
  document.body.style.overflow = '';
  currentGame = null;
});

// Play for Real button handler
playRealBtn?.addEventListener('click', () => {
  redirectToAffiliate('games', currentGame?.name);
});

// CTA Large button handler
ctaLargeBtn?.addEventListener('click', () => {
  redirectToAffiliate('game_cta', currentGame?.name);
});

// Casino Play buttons
document.querySelectorAll('.btn-casino-play').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const card = e.target.closest('.casino-card');
    const casinoName = card?.dataset.casino;
    const placement = btn.dataset.placement || 'casinos';

    redirectToAffiliate(placement, null, casinoName);
  });
});

// Special banner buttons
document.querySelectorAll('.btn-special').forEach(btn => {
  btn.addEventListener('click', () => {
    const casinoName = btn.dataset.casino;
    const placement = btn.dataset.placement || 'special_banner';

    redirectToAffiliate(placement, null, casinoName);
  });
});

// Lucky Wheel functionality
const luckyWheelBtn = document.getElementById('luckyWheelBtn');
const wheelModal = document.getElementById('wheelModal');
const wheelCloseBtn = document.getElementById('wheelCloseBtn');
const spinBtn = document.getElementById('spinBtn');
const wheel = document.getElementById('wheel');
const winModal = document.getElementById('winModal');
const winPrize = document.getElementById('winPrize');
const claimBtn = document.getElementById('claimBtn');

const prizes = ['500 FS','200%','1000€','300 FS','150%','2000€','100 FS','250%'];

luckyWheelBtn?.addEventListener('click', () => {
  wheelModal?.classList.add('active');
  document.body.style.overflow = 'hidden';
  console.log('Opened Lucky Wheel');
});

wheelCloseBtn?.addEventListener('click', () => {
  wheelModal?.classList.remove('active');
  document.body.style.overflow = '';
});

spinBtn?.addEventListener('click', () => {
  if (spinBtn.disabled) return;

  spinBtn.disabled = true;
  spinBtn.textContent = 'SPINNING...';

  wheel?.classList.add('spinning');

  setTimeout(() => {
    wheel?.classList.remove('spinning');

    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    if (winPrize) winPrize.textContent = `You won ${randomPrize}!`;

    wheelModal?.classList.remove('active');
    winModal?.classList.add('active');

    spinBtn.disabled = false;
    spinBtn.textContent = 'SPIN NOW';

    console.log('Won prize:', randomPrize);
  }, 4000);
});

claimBtn?.addEventListener('click', () => {
  winModal?.classList.remove('active');
  document.body.style.overflow = '';
  redirectToAffiliate('lucky_wheel');
});

// Contact Manager button
document.getElementById('contactBtn')?.addEventListener('click', () => {
  const managerUsername = 'freakbetsroberts';
  const telegramUrl = `https://t.me/${managerUsername}`;

  if (tg) tg.openTelegramLink(telegramUrl);
  else window.open(telegramUrl, '_blank');

  console.log('Opening Telegram manager contact');
});

// Affiliate Redirect Function
function redirectToAffiliate(placement, gameName = null, casinoName = null) {
  const baseUrl = 'https://YOUR_TRACKING_DOMAIN/go'; // <-- replace this
  const params = new URLSearchParams({
    subid: userId,
    placement: placement,
    source: 'telegram_webapp'
  });

  if (window.__geo?.code) params.append('geo', window.__geo.code);
  if (gameName) params.append('game', gameName);
  if (casinoName) params.append('casino', casinoName);

  const trackingUrl = `${baseUrl}?${params.toString()}`;

  console.log('Affiliate redirect:', {
    url: trackingUrl,
    subid: userId,
    placement,
    game: gameName,
    casino: casinoName
  });

  if (tg) tg.openLink(trackingUrl);
  else window.open(trackingUrl, '_blank');
}

// Smooth scroll for horizontal game sections
document.querySelectorAll('.games-scroll').forEach(scroll => {
  let isDown = false;
  let startX;
  let scrollLeft;

  scroll.addEventListener('mousedown', (e) => {
    isDown = true;
    scroll.style.cursor = 'grabbing';
    startX = e.pageX - scroll.offsetLeft;
    scrollLeft = scroll.scrollLeft;
  });

  scroll.addEventListener('mouseleave', () => {
    isDown = false;
    scroll.style.cursor = 'grab';
  });

  scroll.addEventListener('mouseup', () => {
    isDown = false;
    scroll.style.cursor = 'grab';
  });

  scroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scroll.offsetLeft;
    const walk = (x - startX) * 2;
    scroll.scrollLeft = scrollLeft - walk;
  });
});

console.log('DEMO Slots Telegram Mini App initialized', {
  userId,
  username,
  isTelegram: !!tg,
  timestamp: new Date().toISOString()
});

// Handle back button in Telegram
if (tg) {
  tg.BackButton.onClick(() => {
    if (gameOverlay?.classList.contains('active')) {
      gameOverlay.classList.remove('active');
      document.body.style.overflow = '';
    } else if (wheelModal?.classList.contains('active')) {
      wheelModal.classList.remove('active');
      document.body.style.overflow = '';
    } else if (winModal?.classList.contains('active')) {
      winModal.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      tg.close();
    }
  });

  const observer = new MutationObserver(() => {
    const anyOpen =
      gameOverlay?.classList.contains('active') ||
      wheelModal?.classList.contains('active') ||
      winModal?.classList.contains('active');

    if (anyOpen) tg.BackButton.show();
    else tg.BackButton.hide();
  });

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class']
  });
}
