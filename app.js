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
    }
};

const STAT_KEYS = ['strength', 'health', 'defense', 'agility', 'intelligence', 'magic'];
const STAT_LABELS = ['💪 Сила', '❤️ Здоровье', '🛡 Защита', '💨 Ловкость', '🧠 Интеллект', '🔮 Магия'];

// ========== ЗАГРУЗКА / СОХРАНЕНИЕ ==========
function loadState() {
    try {
        const saved = localStorage.getItem('fireStreakData');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = parsed;
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

// ========== ОБНОВЛЕНИЕ UI ==========
function updateUI() {
    document.getElementById('dayCount').textContent = state.streak;
    document.getElementById('expDisplay').textContent = state.exp === Infinity ? '∞' : state.exp;
    renderCalendar();
    renderAchievements();
    renderSpider();
}

// ========== КАЛЕНДАРЬ (текущая неделя) ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    const now = new Date();
    const currentDay = now.getDay(); // 0=воскресенье
    const mondayOffset = (currentDay === 0) ? -6 : 1 - currentDay; // сдвиг до понедельника

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

// ========== ДОСТИЖЕНИЯ ==========
function renderAchievements() {
    const milestones = [3, 5, 10, 20, 30];
    const items = document.querySelectorAll('.achieve');
    items.forEach((el, idx) => {
        const days = milestones[idx];
        if (state.streak >= days) {
            el.classList.add('unlocked');
        } else {
            el.classList.remove('unlocked');
        }
    });
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
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Линии от центра
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
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
    ctx.fillStyle = 'rgba(180, 80, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 80, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Точки и эмодзи на углах
    const emojis = ['💪', '❤️', '🛡', '💨', '🧠', '🔮'];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const r = maxR * values[i];
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        // Точка
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(180, 80, 255, 0.6)';
        ctx.fill();

        // Эмодзи снаружи
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#aaa';
        ctx.fillText(emojis[i], lx, ly);
    }

    // Центр
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('🕸', cx, cy);
}

// ========== АКТИВАЦИЯ ==========
function activateFire() {
    const now = new Date();
    const todayStr = now.toDateString();

    if (state.lastDate) {
        const last = new Date(state.lastDate);
        const diff = (now - last) / (1000 * 60 * 60 * 24);
        if (diff >= 1 && diff < 2) {
            state.streak += 1;
            state.exp = state.exp === Infinity ? Infinity : state.exp + 10;
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
    if (state.stats[statKey] >= 10) {
        alert('Максимум — 10');
        return;
    }
    state.stats[statKey] += 1;
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
            // Принудительный рефлоу для перезапуска анимации
            void el.offsetWidth;
            el.classList.add('rolling');
            const result = Math.floor(Math.random() * 6);
            setTimeout(() => {
                el.textContent = diceEmojis[result];
                el.classList.remove('rolling');
            }, 500);
        } else {
            el.style.display = 'none';
        }
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    loadState();

    // Активация
    document.getElementById('activateBtn').addEventListener('click', activateFire);

    // Характеристики
    document.getElementById('spiderBtn').addEventListener('click', () => {
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('spider-screen').classList.add('active');
        renderSpider();
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
