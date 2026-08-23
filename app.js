// ========== СОСТОЯНИЕ ==========
let state = {
    streak: 0,
    lastDate: null,
    exp: 0,
    stats: {
        strength: 1,
        health: 1,
        defense: 1,
        agility: 1,
        intelligence: 1,
        magic: 1
    },
    spent: {
        strength: 0,
        health: 0,
        defense: 0,
        agility: 0,
        intelligence: 0,
        magic: 0
    }
};

const STAT_KEYS = ['strength', 'health', 'defense', 'agility', 'intelligence', 'magic'];
const STAT_EMOJIS = ['💪', '❤️', '🛡', '💨', '🧠', '🔮'];

// ========== ЗАГРУЗКА / СОХРАНЕНИЕ ==========
function loadState() {
    try {
        const saved = localStorage.getItem('fireStreakData');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = parsed;
            if (!state.spent) {
                state.spent = {};
                STAT_KEYS.forEach(k => state.spent[k] = 0);
            }
            if (state.lastDate) {
                const last = new Date(state.lastDate);
                const now = new Date();
                const diff = (now - last) / (1000 * 60 * 60 * 24);
                if (diff >= 2) state.streak = 0;
            }
        }
    } catch (e) { console.warn('Load error', e); }
}

function saveState() {
    try {
        localStorage.setItem('fireStreakData', JSON.stringify(state));
    } catch (e) { console.warn('Save error', e); }
}

// ========== ИСКРЫ ==========
function createSparkles() {
    const container = document.getElementById('sparkles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 90;
        sparkle.style.setProperty('--tx', distance * Math.cos(angle) + 'px');
        sparkle.style.setProperty('--ty', distance * Math.sin(angle) + 'px');
        sparkle.style.left = '50%';
        sparkle.style.top = '50%';
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        sparkle.style.animationDuration = (1 + Math.random() * 1.5) + 's';
        const size = 2 + Math.random() * 4;
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        container.appendChild(sparkle);
    }
}

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    document.getElementById('dayCount').textContent = state.streak;
    document.getElementById('expDisplay').textContent = state.exp === Infinity ? '∞' : state.exp;
    renderCalendar();
    renderSpider();
    renderStatsSpent();
}

// ========== КАЛЕНДАРЬ ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = (currentDay === 0) ? -6 : 1 - currentDay;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dayNum = date.getDate();

        const el = document.createElement('div');
        el.className = 'day';
        el.textContent = dayNum;

        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;

        if (isToday) {
            el.classList.add('today');
        } else if (isPast) {
            el.classList.add('past');
        } else {
            el.classList.add('future');
        }

        container.appendChild(el);
    }
}

// ========== ПАУТИНКА ==========
function renderSpider() {
    const canvas = document.getElementById('spiderCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2 + 8;
    const maxR = 110;

    ctx.clearRect(0, 0, W, H);

    // Внешний шестиугольник
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const x = cx + maxR * Math.cos(angle);
        const y = cy + maxR * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Линии от центра
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.stroke();
    }

    // Значения
    const values = STAT_KEYS.map(key => {
        const val = state.stats[key] || 1;
        return Math.min(val, 10) / 10;
    });

    // Внутренний шестиугольник
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const r = maxR * values[i];
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(180, 80, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 80, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Точки и эмодзи на углах
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const r = maxR * values[i];
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(180, 80, 255, 0.5)';
        ctx.fill();

        const labelR = maxR + 24;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        ctx.font = '17px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#888';
        ctx.fillText(STAT_EMOJIS[i], lx, ly);
    }
}

// ========== ОТОБРАЖЕНИЕ ПОТРАЧЕННЫХ ОЧКОВ ==========
function renderStatsSpent() {
    STAT_KEYS.forEach(key => {
        const el = document.querySelector(`.stat-spent[data-stat="${key}"]`);
        if (el) {
            el.textContent = state.spent[key] || 0;
        }
    });
}

// ========== АКТИВАЦИЯ ==========
function activateFire() {
    const now = new Date();

    if (state.lastDate) {
        const last = new Date(state.lastDate);
        const diff = (now - last) / (1000 * 60 * 60 * 24);
        if (diff >= 1 && diff < 2) {
            state.streak += 1;
            state.exp = state.exp === Infinity ? Infinity : state.exp + 10;
            // Проверка достижений каждые 5 дней
            if (state.streak % 5 === 0 && state.exp !== Infinity) {
                state.exp += 50;
                alert(`🎉 Достижение ${state.streak} дней! +50 опыта!`);
            }
        } else if (diff >= 2) {
            state.streak = 1;
            state.exp = state.exp === Infinity ? Infinity : state.exp + 10;
        } else {
            alert('✅ Сегодня уже активировано!');
            return;
        }
    } else {
        state.streak = 1;
        state.exp = state.exp === Infinity ? Infinity : state.exp + 10;
    }

    state.lastDate = now.toISOString();
    saveState();
    updateUI();
    createSparkles();
}

// ========== ПРОМОКОД ==========
function activatePromo() {
    const input = document.getElementById('promoInput');
    if (input.value.trim() === 'DEV2026') {
        state.exp = Infinity;
        saveState();
        updateUI();
        alert('🚀 Промокод активирован! Опыт бесконечен.');
        input.value = '';
    } else {
        alert('❌ Неверный промокод');
    }
}

// ========== ПОВЫШЕНИЕ СТАТА ==========
function upgradeStat(statKey) {
    const cost = 1;
    if (state.exp === Infinity) {
        // Бесконечный опыт
    } else if (state.exp < cost) {
        alert(`⚠️ Нужно ${cost} опыта!`);
        return;
    }
    state.stats[statKey] += 1;
    state.spent[statKey] = (state.spent[statKey] || 0) + 1;
    if (state.exp !== Infinity) state.exp -= cost;
    saveState();
    updateUI();
}

// ========== КУБИКИ ==========
let diceCount = 1;

function rollDice() {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const container = document.getElementById('diceContainer');
    const diceElements = container.querySelectorAll('.dice');

    diceElements.forEach((el, i) => {
        if (i < diceCount) {
            el.style.display = 'inline-block';
            el.classList.remove('rolling');
            void el.offsetWidth;
            el.classList.add('rolling');
            const result = Math.floor(Math.random() * 6);
            setTimeout(() => {
                el.textContent = diceEmojis[result];
                el.classList.remove('rolling');
            }, 700);
        } else {
            el.style.display = 'none';
        }
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    loadState();

    // Искры
    createSparkles();

    // Активация
    document.getElementById('activateBtn').addEventListener('click', activateFire);

    // Характеристики
    document.getElementById('spiderBtn').addEventListener('click', () => {
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('spider-screen').classList.add('active');
        renderSpider();
        renderStatsSpent();
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('spider-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        updateUI();
    });

    // Промокод
    document.getElementById('promoBtn').addEventListener('click', activatePromo);
    document.getElementById('promoInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') activatePromo();
    });

    // Повышение статов
    document.querySelectorAll('.up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            upgradeStat(stat);
        });
    });

    // Кубики
    document.getElementById('diceBtn').addEventListener('click', () => {
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('dice-screen').classList.add('active');
    });

    document.getElementById('diceBackBtn').addEventListener('click', () => {
        document.getElementById('dice-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
    });

    document.getElementById('rollBtn').addEventListener('click', rollDice);

    document.querySelectorAll('.dice-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dice-count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            diceCount = parseInt(btn.dataset.count);
        });
    });

    // Карты и оружие (заглушки)
    document.getElementById('cardsBtn').addEventListener('click', () => {
        alert('🃏 Карты — в разработке!');
    });

    document.getElementById('weaponBtn').addEventListener('click', () => {
        alert('🗡 Оружие — в разработке!');
    });

    updateUI();

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}

document.addEventListener('DOMContentLoaded', init);
