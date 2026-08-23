// ========================================
// КОНФИГУРАЦИЯ ГЕНЕРАТОРОВ
// ========================================
const GENERATORS_CONFIG = [
    { id: 'farm', name: 'Кубо-ферма', icon: '🏭', basePrice: 100, baseIncome: 10, description: 'Штампует маленькие кубики' },
    { id: 'reactor', name: 'Энерго-куб', icon: '⚡', basePrice: 500, baseIncome: 50, description: 'Вырабатывает энергию' },
    { id: 'mine', name: 'Кубо-шахта', icon: '⛏️', basePrice: 3000, baseIncome: 300, description: 'Добывает редкие кубы' },
    { id: 'factory', name: 'Кубо-завод', icon: '🏗️', basePrice: 15000, baseIncome: 1500, description: 'Автоматизированное производство' },
    { id: 'satellite', name: 'Куб-спутник', icon: '🛰️', basePrice: 80000, baseIncome: 8000, description: 'Добыча в космосе' },
    { id: 'singularity', name: 'Кубическая сингулярность', icon: '🌀', basePrice: 500000, baseIncome: 50000, description: 'Чёрная дыра из кубов' },
];

// ========================================
= СОСТОЯНИЕ ИГРЫ
// ========================================
let game = {
    coins: 0,
    totalClicks: 0,
    totalEarned: 0,
    clickPower: 1,
    generators: {}, // { id: level }
    boosters: [],   // [{ type, expiresAt }]
    lastClaim: null,
    dailyBonus: null,
};

// ========================================
= ИНИЦИАЛИЗАЦИЯ
// ========================================
function loadGame() {
    const saved = localStorage.getItem('cubeClicker');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            game = { ...game, ...parsed };
            // Проверяем, есть ли все генераторы
            GENERATORS_CONFIG.forEach(g => {
                if (!(g.id in game.generators)) {
                    game.generators[g.id] = 0;
                }
            });
        } catch (e) {
            console.warn('Ошибка загрузки, начинаем новую игру');
        }
    } else {
        // Инициализация новых генераторов
        GENERATORS_CONFIG.forEach(g => {
            game.generators[g.id] = 0;
        });
    }
    saveGame();
}

function saveGame() {
    localStorage.setItem('cubeClicker', JSON.stringify(game));
}

// ========================================
= ОБНОВЛЕНИЕ UI
// ========================================
function updateUI() {
    // Баланс
    document.getElementById('coins').textContent = formatNumber(game.coins);
    
    // Мощность клика
    document.getElementById('clickPower').textContent = game.clickPower;
    
    // Всего кликов
    document.getElementById('totalClicks').textContent = formatNumber(game.totalClicks);
    
    // Доход в час
    const income = getIncomePerHour();
    document.getElementById('incomePerHour').textContent = formatNumber(income);
    
    // Генераторы
    renderGenerators();
    
    // Активные бустеры
    renderActiveBoosters();
    
    // Статистика
    document.getElementById('statClicks').textContent = formatNumber(game.totalClicks);
    document.getElementById('statEarned').textContent = formatNumber(game.totalEarned);
    document.getElementById('statIncome').textContent = formatNumber(income);
    let totalGenLevels = 0;
    Object.values(game.generators).forEach(l => totalGenLevels += l);
    document.getElementById('statGenerators').textContent = totalGenLevels;
    
    // Кнопка сбора
    updateClaimButton();
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// ========================================
= РАСЧЁТ ДОХОДА
// ========================================
function getIncomePerHour() {
    let total = 0;
    GENERATORS_CONFIG.forEach(g => {
        const level = game.generators[g.id] || 0;
        if (level > 0) {
            total += g.baseIncome * Math.pow(1.3, level - 1);
        }
    });
    // Бонус от бустеров
    const boosterBonus = getActiveBoosterBonus();
    total *= boosterBonus;
    return Math.floor(total);
}

function getActiveBoosterBonus() {
    let bonus = 1;
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    game.boosters.forEach(b => {
        if (b.type === 'x2') bonus = Math.max(bonus, 2);
        if (b.type === 'x5') bonus = Math.max(bonus, 5);
    });
    return bonus;
}

// ========================================
= КЛИК ПО КУБУ
// ========================================
function clickCube() {
    // Анимация
    const cube = document.getElementById('cube');
    cube.classList.remove('rotate');
    void cube.offsetWidth;
    cube.classList.add('rotate');
    
    // Расчёт клика
    let earn = game.clickPower;
    const bonus = getActiveBoosterBonus();
    if (bonus > 1) earn *= bonus;
    
    game.coins += earn;
    game.totalClicks++;
    game.totalEarned += earn;
    
    // Визуальный фидбек
    showFloatingText(`+${formatNumber(earn)} 🪙`);
    
    saveGame();
    updateUI();
}

// Плавающий текст
function showFloatingText(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 32px;
        font-weight: 700;
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255,215,0,0.5);
        pointer-events: none;
        z-index: 999;
        animation: floatUp 0.8s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Добавим анимацию в CSS (добавим динамически)
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 0; transform: translate(-50%, -150%) scale(1.5); }
    }
`;
document.head.appendChild(style);

// ========================================
= ГЕНЕРАТОРЫ
// ========================================
function getGeneratorPrice(genId) {
    const config = GENERATORS_CONFIG.find(g => g.id === genId);
    const level = game.generators[genId] || 0;
    return Math.floor(config.basePrice * Math.pow(1.5, level));
}

function getGeneratorIncome(genId) {
    const config = GENERATORS_CONFIG.find(g => g.id === genId);
    const level = game.generators[genId] || 0;
    if (level === 0) return 0;
    return Math.floor(config.baseIncome * Math.pow(1.3, level - 1));
}

function buyGenerator(genId) {
    const price = getGeneratorPrice(genId);
    if (game.coins < price) return;
    
    game.coins -= price;
    game.generators[genId] = (game.generators[genId] || 0) + 1;
    
    saveGame();
    updateUI();
    showFloatingText('⬆ Улучшено!');
}

function renderGenerators() {
    const container = document.getElementById('generatorsList');
    container.innerHTML = '';
    
    GENERATORS_CONFIG.forEach(g => {
        const level = game.generators[g.id] || 0;
        const price = getGeneratorPrice(g.id);
        const income = getGeneratorIncome(g.id);
        const canAfford = game.coins >= price;
        
        const card = document.createElement('div');
        card.className = 'generator-card';
        card.innerHTML = `
            <div class="icon">${g.icon}</div>
            <div class="info">
                <div class="name">${g.name}</div>
                <div class="details">
                    ${g.description} · Уровень: <span class="level">${level}</span>
                    ${level > 0 ? `· Доход: <span class="price">${formatNumber(income)}/час</span>` : ''}
                </div>
            </div>
            <button class="buy-btn" ${!canAfford ? 'disabled' : ''} data-id="${g.id}">
                ${level === 0 ? 'Купить' : '⬆'}
                <br><small>${formatNumber(price)}</small>
            </button>
        `;
        
        card.querySelector('.buy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            buyGenerator(g.id);
        });
        
        container.appendChild(card);
    });
}

// ========================================
= СБОР ПАССИВНОГО ДОХОДА
// ========================================
function claimPassiveIncome() {
    const now = Date.now();
    const last = game.lastClaim || now;
    const diffSeconds = (now - last) / 1000;
    const incomePerSecond = getIncomePerHour() / 3600;
    const earned = Math.floor(diffSeconds * incomePerSecond);
    
    if (earned <= 0) {
        showFloatingText('⏳ Подожди немного');
        return;
    }
    
    game.coins += earned;
    game.totalEarned += earned;
    game.lastClaim = now;
    
    saveGame();
    updateUI();
    showFloatingText(`📥 +${formatNumber(earned)} 🪙`);
}

function updateClaimButton() {
    const btn = document.getElementById('claimBtn');
    const income = getIncomePerHour();
    if (income === 0) {
        btn.textContent = '📥 Купи генераторы для дохода';
        btn.disabled = true;
    } else {
        btn.textContent = '📥 Собрать пассивный доход';
        btn.disabled = false;
    }
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
    showFloatingText(`⚡ ${type.toUpperCase()} активирован!`);
}

function renderActiveBoosters() {
    const container = document.getElementById('activeBoosters');
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    
    if (game.boosters.length === 0) {
        container.innerHTML = '<span style="color:#666;">Нет активных бустеров</span>';
        return;
    }
    
    container.innerHTML = game.boosters.map(b => {
        const left = Math.ceil((b.expiresAt - now) / 1000);
        const mins = Math.floor(left / 60);
        const secs = left % 60;
        const emoji = b.type === 'x2' ? '⚡' : b.type === 'x5' ? '🔥' : '🤖';
        return `<span class="active-booster">${emoji} ${b.type.toUpperCase()} ${mins}:${String(secs).padStart(2, '0')}</span>`;
    }).join('');
}

// ========================================
= ТАБЫ (вкладки)
// ========================================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ========================================
= БУСТЕРЫ - КНОПКИ
// ========================================
document.querySelectorAll('.buy-booster').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.closest('.booster-card').dataset.booster;
        buyBooster(type);
    });
});

// ========================================
= КНОПКА СБОРА
// ========================================
document.getElementById('claimBtn').addEventListener('click', claimPassiveIncome);

// ========================================
= КЛИК ПО КУБУ
// ========================================
document.getElementById('cubeWrapper').addEventListener('click', clickCube);
document.getElementById('cubeWrapper').addEventListener('touchstart', (e) => {
    e.preventDefault();
    clickCube();
}, { passive: false });

// ========================================
= ПАССИВНЫЙ ДОХОД (тик каждую секунду)
// ========================================
setInterval(() => {
    // Если есть генераторы, добавляем монеты каждую секунду
    const income = getIncomePerHour();
    if (income > 0) {
        const perSecond = income / 3600;
        game.coins += perSecond;
        // Обновляем UI не слишком часто
        updateUI();
        saveGame();
    }
}, 1000);

// ========================================
= АВТО-КЛИКЕР БУСТЕР
// ========================================
setInterval(() => {
    // Проверяем, есть ли активный авто-кликер
    const now = Date.now();
    game.boosters = game.boosters.filter(b => b.expiresAt > now);
    const hasAuto = game.boosters.some(b => b.type === 'auto');
    if (hasAuto) {
        // Авто-клик каждые 2 секунды
        clickCube();
    }
    renderActiveBoosters();
}, 2000);

// ========================================
= СТАРТ
// ========================================
loadGame();
updateUI();

console.log('🎲 Куб-кликер загружен!');
console.log(`🪙 Монет: ${game.coins}`);
console.log(`📊 Доход/час: ${getIncomePerHour()}`);
