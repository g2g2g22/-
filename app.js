// ========================================
// КОНФИГ ГЕНЕРАТОРОВ
// ========================================
const GENERATORS = [
    { id: 'farm', name: 'Кубо-ферма', icon: '🏭', basePrice: 100, baseIncome: 10 },
    { id: 'reactor', name: 'Энерго-куб', icon: '⚡', basePrice: 500, baseIncome: 50 },
    { id: 'mine', name: 'Кубо-шахта', icon: '⛏️', basePrice: 3000, baseIncome: 300 },
    { id: 'factory', name: 'Кубо-завод', icon: '🏗️', basePrice: 15000, baseIncome: 1500 },
    { id: 'satellite', name: 'Куб-спутник', icon: '🛰️', basePrice: 80000, baseIncome: 8000 },
    { id: 'singularity', name: 'Сингулярность', icon: '🌀', basePrice: 500000, baseIncome: 50000 },
];

// ========================================
// СОСТОЯНИЕ
// ========================================
let game = {
    coins: 0,
    totalClicks: 0,
    totalEarned: 0,
    clickPower: 1,
    generators: {},
    boosters: [],
    lastClaim: Date.now(),
};

// Инициализация генераторов
GENERATORS.forEach(g => {
    if (!(g.id in game.generators)) {
        game.generators[g.id] = 0;
    }
});

// ========================================
= ЗАГРУЗКА/СОХРАНЕНИЕ
// ========================================
function loadGame() {
    try {
        const saved = localStorage.getItem('cubeClicker');
        if (saved) {
            const parsed = JSON.parse(saved);
            game = { ...game, ...parsed };
            // Проверяем генераторы
            GENERATORS.forEach(g => {
                if (!(g.id in game.generators)) {
                    game.generators[g.id] = 0;
                }
            });
        }
    } catch (e) {
        console.log('Новая игра');
    }
    saveGame();
}

function saveGame() {
    try {
        localStorage.setItem('cubeClicker', JSON.stringify(game));
    } catch (e) {}
}

// ========================================
= ВСПОМОГАТЕЛЬНЫЕ
// ========================================
function formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
}

function getIncome() {
    let total = 0;
    GENERATORS.forEach(g => {
        const level = game.generators[g.id] || 0;
        if (level > 0) {
            total += g.baseIncome * Math.pow(1.3, level - 1);
        }
    });
    // Бустеры
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    let bonus = 1;
    game.boosters.forEach(b => {
        if (b.type === 'x2') bonus = Math.max(bonus, 2);
        if (b.type === 'x5') bonus = Math.max(bonus, 5);
    });
    return Math.floor(total * bonus);
}

function getPrice(genId) {
    const config = GENERATORS.find(g => g.id === genId);
    const level = game.generators[genId] || 0;
    return Math.floor(config.basePrice * Math.pow(1.5, level));
}

function getGenIncome(genId) {
    const config = GENERATORS.find(g => g.id === genId);
    const level = game.generators[genId] || 0;
    if (level === 0) return 0;
    return Math.floor(config.baseIncome * Math.pow(1.3, level - 1));
}

// ========================================
= ОБНОВЛЕНИЕ UI
// ========================================
function updateUI() {
    document.getElementById('coins').textContent = formatNum(game.coins);
    document.getElementById('clickPower').textContent = game.clickPower;
    document.getElementById('totalClicks').textContent = formatNum(game.totalClicks);
    
    const income = getIncome();
    document.getElementById('incomePerHour').textContent = formatNum(income);
    
    // Генераторы
    const container = document.getElementById('generatorsList');
    container.innerHTML = '';
    
    GENERATORS.forEach(g => {
        const level = game.generators[g.id] || 0;
        const price = getPrice(g.id);
        const income2 = getGenIncome(g.id);
        const canAfford = game.coins >= price;
        
        const card = document.createElement('div');
        card.className = 'generator-card';
        card.innerHTML = `
            <div class="icon">${g.icon}</div>
            <div class="info">
                <div class="name">${g.name}</div>
                <div class="details">
                    Уровень <span class="level">${level}</span>
                    ${level > 0 ? `· <span class="price">${formatNum(income2)}/час</span>` : ''}
                </div>
            </div>
            <button class="buy-btn" ${!canAfford ? 'disabled' : ''} data-id="${g.id}">
                ${level === 0 ? 'Куп' : '⬆'}
                <small>${formatNum(price)}</small>
            </button>
        `;
        
        card.querySelector('.buy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            buyGenerator(g.id);
        });
        
        container.appendChild(card);
    });
    
    // Статистика
    document.getElementById('statClicks').textContent = formatNum(game.totalClicks);
    document.getElementById('statEarned').textContent = formatNum(game.totalEarned);
    document.getElementById('statIncome').textContent = formatNum(income);
    let totalLevels = 0;
    Object.values(game.generators).forEach(v => totalLevels += v);
    document.getElementById('statGenerators').textContent = totalLevels;
    
    // Бустеры
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    const boostContainer = document.getElementById('activeBoosters');
    if (game.boosters.length === 0) {
        boostContainer.innerHTML = '<span style="color:#666;">Нет активных бустеров</span>';
    } else {
        boostContainer.innerHTML = game.boosters.map(b => {
            const left = Math.ceil((b.expiresAt - now) / 1000);
            const m = Math.floor(left / 60);
            const s = left % 60;
            const emoji = b.type === 'x2' ? '⚡' : b.type === 'x5' ? '🔥' : '🤖';
            return `<span class="active-booster">${emoji} ${b.type} ${m}:${String(s).padStart(2,'0')}</span>`;
        }).join('');
    }
    
    // Кнопка сбора
    const btn = document.getElementById('claimBtn');
    if (income === 0) {
        btn.textContent = '📥 Купи генераторы';
        btn.disabled = true;
    } else {
        btn.textContent = '📥 Собрать пассивку';
        btn.disabled = false;
    }
}

// ========================================
= КЛИК
// ========================================
function clickCube() {
    const cube = document.getElementById('cube');
    cube.classList.remove('rotate');
    void cube.offsetWidth;
    cube.classList.add('rotate');
    
    let earn = game.clickPower;
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    let bonus = 1;
    game.boosters.forEach(b => {
        if (b.type === 'x2') bonus = Math.max(bonus, 2);
        if (b.type === 'x5') bonus = Math.max(bonus, 5);
    });
    earn *= bonus;
    
    game.coins += earn;
    game.totalClicks++;
    game.totalEarned += earn;
    
    // Всплывашка
    const el = document.createElement('div');
    el.textContent = `+${formatNum(earn)} 🪙`;
    el.style.cssText = `
        position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
        font-size: 30px; font-weight: 700; color: #ffd700;
        text-shadow: 0 0 20px rgba(255,215,0,0.5);
        pointer-events: none; z-index: 999;
        animation: floatUp 0.7s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
    
    saveGame();
    updateUI();
}

// Добавляем анимацию
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 0; transform: translate(-50%, -150%) scale(1.4); }
    }
`;
document.head.appendChild(style);

// ========================================
= ПОКУПКА ГЕНЕРАТОРА
// ========================================
function buyGenerator(genId) {
    const price = getPrice(genId);
    if (game.coins < price) return;
    
    game.coins -= price;
    game.generators[genId] = (game.generators[genId] || 0) + 1;
    
    saveGame();
    updateUI();
}

// ========================================
= СБОР ПАССИВКИ
// ========================================
function claimPassive() {
    const now = Date.now();
    const diff = (now - game.lastClaim) / 1000;
    const income = getIncome();
    const earned = Math.floor(diff * (income / 3600));
    
    if (earned <= 0) {
        const el = document.createElement('div');
        el.textContent = '⏳ Подожди';
        el.style.cssText = `
            position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%);
            font-size: 24px; color: #aaa; pointer-events: none; z-index: 999;
            animation: floatUp 0.7s ease-out forwards;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 700);
        return;
    }
    
    game.coins += earned;
    game.totalEarned += earned;
    game.lastClaim = now;
    
    saveGame();
    updateUI();
    
    const el = document.createElement('div');
    el.textContent = `+${formatNum(earned)} 🪙`;
    el.style.cssText = `
        position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
        font-size: 30px; font-weight: 700; color: #4ecdc4;
        text-shadow: 0 0 20px rgba(78,205,196,0.5);
        pointer-events: none; z-index: 999;
        animation: floatUp 0.7s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

// ========================================
= БУСТЕРЫ
// ========================================
function buyBooster(type) {
    const prices = { x2: 500, x5: 2000, auto: 5000 };
    const durations = { x2: 300, x5: 120, auto: 60 };
    
    if (game.coins < prices[type]) return;
    
    game.coins -= prices[type];
    game.boosters.push({
        type: type,
        expiresAt: Date.now() + durations[type] * 1000
    });
    
    saveGame();
    updateUI();
}

// ========================================
= СОБЫТИЯ
// ========================================
// Куб
document.getElementById('cubeWrapper').addEventListener('click', clickCube);
document.getElementById('cubeWrapper').addEventListener('touchstart', (e) => {
    e.preventDefault();
    clickCube();
}, { passive: false });

// Сбор
document.getElementById('claimBtn').addEventListener('click', claimPassive);

// Бустеры
document.querySelectorAll('.buy-booster').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.closest('.booster-card').dataset.booster;
        buyBooster(type);
    });
});

// Вкладки
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ========================================
= ТИКЕР
// ========================================
setInterval(() => {
    const income = getIncome();
    if (income > 0) {
        game.coins += income / 3600;
        saveGame();
        updateUI();
    }
}, 1000);

// Авто-кликер
setInterval(() => {
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    const hasAuto = game.boosters.some(b => b.type === 'auto');
    if (hasAuto) {
        clickCube();
    }
}, 2000);

// ========================================
= СТАРТ
// ========================================
loadGame();
updateUI();
console.log('🎲 Куб-кликер готов!');
