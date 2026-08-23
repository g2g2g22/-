// ========== ДАННЫЕ ==========
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
    achievements: {}
};

const STAT_KEYS = ['strength', 'health', 'defense', 'agility', 'intelligence', 'magic'];
const STAT_LABELS = {
    strength: '💪 Сила',
    health: '❤️ Здоровье',
    defense: '🛡️ Защита',
    agility: '💨 Ловкость',
    intelligence: '🧠 Интеллект',
    magic: '🔮 Магия'
};

// ========== ЗАГРУЗКА / СОХРАНЕНИЕ ==========
function loadState() {
    try {
        const saved = localStorage.getItem('fireStreakData');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = parsed;
            // Проверяем, не пропущен ли день
            if (state.lastDate) {
                const last = new Date(state.lastDate);
                const now = new Date();
                const diff = (now - last) / (1000 * 60 * 60 * 24);
                if (diff >= 2) {
                    state.streak = 0;
                }
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
    document.getElementById('expDisplay').textContent = state.exp;

    renderCalendar();
    renderAchievements();
    renderSpider();
}

// ========== КАЛЕНДАРЬ ==========
function renderCalendar() {
    const container = document.getElementById('calendar');
    container.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Сдвиг для Пн = 0
    let offset = (firstDay === 0) ? 6 : firstDay - 1;

    for (let i = 0; i < offset + daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'day';

        if (i < offset) {
            day.classList.add('future');
            day.textContent = '';
        } else {
            const dayNum = i - offset + 1;
            day.textContent = dayNum;
            const dateObj = new Date(year, month, dayNum);
            const today = new Date();
            const isToday = dateObj.toDateString() === today.toDateString();
            const isPast = dateObj < today && !isToday;

            if (isToday) {
                day.classList.add('today');
            } else if (isPast) {
                day.classList.add('past');
            } else {
                day.classList.add('future');
            }
        }
        container.appendChild(day);
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
            el.textContent = `${days}д ✅`;
        } else {
            el.classList.remove('unlocked');
            el.textContent = `${days}д`;
        }
    });
}

// ========== ПАУТИНКА (Canvas) ==========
function renderSpider() {
    const canvas = document.getElementById('spiderCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    const maxR = 110;

    ctx.clearRect(0, 0, W, H);

    // Рисуем внешний шестиугольник (серый)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const x = cx + maxR * Math.cos(angle);
        const y = cy + maxR * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Рисуем линии от центра
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = '#444';
        ctx.stroke();
    }

    // Считаем значения
    const values = STAT_KEYS.map(key => {
        const val = state.stats[key] || 1;
        return Math.min(val, 10) / 10; // 0..1
    });

    // Внутренний шестиугольник (белый)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const r = maxR * values[i];
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Точки на вершинах
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI/2;
        const r = maxR * values[i];
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff8800';
        ctx.fill();
    }
}

// ========== АКТИВАЦИЯ ОГОНЬКА ==========
function activateFire() {
    const now = new Date();
    const todayStr = now.toDateString();

    if (state.lastDate) {
        const last = new Date(state.lastDate);
        const diff = (now - last) / (1000 * 60 * 60 * 24);
        if (diff >= 1 && diff < 2) {
            // +1 день
            state.streak += 1;
            state.exp += 10;
        } else if (diff >= 2) {
            state.streak = 1;
            state.exp += 10;
        } else {
            // Сегодня уже активировали
            alert('Вы уже активировали сегодня!');
            return;
        }
    } else {
        state.streak = 1;
        state.exp += 10;
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
    if (state.exp < 10) {
        alert('Недостаточно опыта! Нужно 10.');
        return;
    }
    if (state.stats[statKey] >= 10) {
        alert('Максимальный уровень 10');
        return;
    }
    state.stats[statKey] += 1;
    state.exp -= 10;
    saveState();
    updateUI();
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    loadState();

    // Привязка кнопок
    document.getElementById('activateBtn').addEventListener('click', activateFire);

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

    document.getElementById('promoBtn').addEventListener('click', activatePromo);
    document.getElementById('promoInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') activatePromo();
    });

    // Кнопки повышения статов
    document.querySelectorAll('.up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            upgradeStat(stat);
        });
    });

    updateUI();

    // Настройка для Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}

document.addEventListener('DOMContentLoaded', init);
