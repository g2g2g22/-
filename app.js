// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Данные игрока
let player = {
    coins: 0,
    clickPower: 1,
    passiveIncome: 0,
    totalCoins: 0,
    prestigeLevel: 0,
    dailyClicks: 0,
    lastCollect: Date.now(),
    generators: {},
    boosters: {
        hour_boost: 0,
        super_click: 0
    }
};

// Данные генераторов с эмодзи для мини-кубов
const GENERATORS = {
    pocket_cube: {
        name: '🎲 Карманный кубик',
        emoji: '🎲',
        basePrice: 100,
        baseIncome: 10,
        category: 'basic'
    },
    helper_cube: {
        name: '🤖 Кубик-помощник',
        emoji: '🤖',
        basePrice: 500,
        baseIncome: 50,
        category: 'basic'
    },
    cube_farm: {
        name: '🏭 Кубо-ферма',
        emoji: '🏭',
        basePrice: 3000,
        baseIncome: 300,
        category: 'medium'
    },
    energy_cube: {
        name: '⚡ Энерго-куб',
        emoji: '⚡',
        basePrice: 12000,
        baseIncome: 1200,
        category: 'medium'
    },
    reactor: {
        name: '🔄 Кубический реактор',
        emoji: '🔄',
        basePrice: 50000,
        baseIncome: 5000,
        category: 'medium'
    },
    satellite: {
        name: '🚀 Куб-спутник',
        emoji: '🚀',
        basePrice: 200000,
        baseIncome: 20000,
        category: 'expensive'
    },
    cube_brain: {
        name: '🧠 Кубо-мозг',
        emoji: '🧠',
        basePrice: 1000000,
        baseIncome: 100000,
        category: 'expensive'
    },
    singularity: {
        name: '🌀 Кубическая сингулярность',
        emoji: '🌀',
        basePrice: 10000000,
        baseIncome: 1000000,
        category: 'expensive'
    },
    cube_universe: {
        name: '🌌 Куб-вселенная',
        emoji: '🌌',
        basePrice: 100000000,
        baseIncome: 10000000,
        category: 'legendary'
    },
    cube_throne: {
        name: '👑 Кубический трон',
        emoji: '👑',
        basePrice: 1000000000,
        baseIncome: 100000000,
        category: 'legendary'
    }
};

// Загрузка сохранения
function loadGame() {
    const saved = localStorage.getItem('cubeClickerData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            player = {...player, ...data};
            if (data.lastCollect) {
                player.lastCollect = data.lastCollect;
            }
        } catch(e) {
            console.error('Ошибка загрузки:', e);
        }
    }
}

// Сохранение
function saveGame() {
    try {
        localStorage.setItem('cubeClickerData', JSON.stringify(player));
    } catch(e) {
        console.error('Ошибка сохранения:', e);
    }
}

// Формулы
function getPrice(genId, level) {
    const base = GENERATORS[genId].basePrice;
    return Math.floor(base * Math.pow(1.5, level));
}

function getIncome(genId, level) {
    const base = GENERATORS[genId].baseIncome;
    return Math.floor(base * Math.pow(1.3, level));
}

// Подсчёт пассивного дохода
function calculatePassiveIncome() {
    let total = 0;
    const categoryCounts = {basic: 0, medium: 0, expensive: 0, legendary: 0};
    
    for (const [genId, level] of Object.entries(player.generators)) {
        if (GENERATORS[genId]) {
            const income = getIncome(genId, level);
            const category = GENERATORS[genId].category;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            total += income;
        }
    }
    
    // Бонусы категорий
    const bonuses = {
        basic: {threshold: 2, bonus: 1.2},
        medium: {threshold: 3, bonus: 1.5},
        expensive: {threshold: 3, bonus: 2.0},
        legendary: {threshold: 2, bonus: 2.5}
    };
    
    for (const [category, count] of Object.entries(categoryCounts)) {
        if (bonuses[category] && count >= bonuses[category].threshold) {
            total *= bonuses[category].bonus;
        }
    }
    
    return Math.floor(total);
}

// Обновление мини-кубов генераторов (статичные вокруг)
function updateMiniCubes() {
    const container = document.getElementById('mini-cubes');
    container.innerHTML = '';
    
    const purchased = Object.keys(player.generators);
    const count = purchased.length;
    
    if (count === 0) {
        const ghostPositions = [
            {x: -35, y: -35},
            {x: 35, y: -35},
            {x: 0, y: 40}
        ];
        ghostPositions.forEach((pos, i) => {
            const cube = document.createElement('div');
            cube.className = 'mini-cube';
            cube.textContent = '⬜';
            cube.style.opacity = '0.15';
            cube.style.fontSize = '20px';
            cube.style.left = `calc(50% + ${pos.x}px)`;
            cube.style.top = `calc(50% + ${pos.y}px)`;
            container.appendChild(cube);
        });
        return;
    }
    
    const radius = 110;
    const centerX = 50;
    const centerY = 50;
    
    purchased.forEach((genId, index) => {
        const gen = GENERATORS[genId];
        if (!gen) return;
        
        const level = player.generators[genId];
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius * 0.4;
        const y = centerY + Math.sin(angle) * radius * 0.4;
        
        const cube = document.createElement('div');
        cube.className = 'mini-cube bought';
        cube.textContent = gen.emoji;
        cube.dataset.genId = genId;
        cube.style.left = x + '%';
        cube.style.top = y + '%';
        cube.style.fontSize = (20 + level * 2) + 'px';
        cube.style.opacity = (0.6 + level * 0.05);
        
        container.appendChild(cube);
    });
}

// Вспышка при покупке генератора
function flashGenerator(genId) {
    const cubes = document.querySelectorAll('.mini-cube');
    cubes.forEach(cube => {
        if (cube.dataset.genId === genId) {
            cube.classList.add('flash');
            setTimeout(() => {
                cube.classList.remove('flash');
            }, 500);
        }
    });
}

// Обновление UI
function updateUI() {
    player.passiveIncome = calculatePassiveIncome();
    
    document.getElementById('coins').textContent = formatNumber(player.coins);
    document.getElementById('clickPower').textContent = player.clickPower;
    document.getElementById('passiveIncome').textContent = formatNumber(player.passiveIncome);
    
    const boostersCount = document.getElementById('boosters-count');
    if (boostersCount) {
        boostersCount.textContent = `⏳ ${player.boosters.hour_boost || 0} | 🎯 ${player.boosters.super_click || 0}`;
    }
    
    updateMiniCubes();
    renderGenerators();
    updateStats();
    saveGame();
}

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

// Клик по главному кубу с анимацией вращения
function handleClick() {
    const cube = document.getElementById('main-cube');
    
    cube.classList.remove('rolling');
    setTimeout(() => {
        cube.classList.add('rolling');
    }, 10);
    
    let multiplier = 1;
    if (player.boosters.super_click > 0) {
        multiplier = 10;
        player.boosters.super_click--;
    }
    
    const earned = player.clickPower * multiplier;
    player.coins += earned;
    player.totalCoins += earned;
    player.dailyClicks++;
    
    showClickAnimation(earned, multiplier > 1);
    
    setTimeout(() => {
        cube.classList.remove('rolling');
    }, 800);
    
    updateUI();
}

// Анимация клика - цифры вылетают рандомно вокруг куба
function showClickAnimation(amount, isSuper) {
    const container = document.getElementById('cube-container');
    const cube = document.getElementById('main-cube');
    
    const rect = cube.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const count = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < count; i++) {
        const anim = document.createElement('div');
        anim.className = 'click-burst-float';
        anim.textContent = `+${formatNumber(amount)}${isSuper ? ' 🔥' : ''}`;
        anim.style.color = isSuper ? '#ff6b6b' : '#ffd700';
        anim.style.fontSize = (Math.random() * 20 + 24) + 'px';
        anim.style.fontWeight = 'bold';
        anim.style.position = 'absolute';
        anim.style.pointerEvents = 'none';
        anim.style.zIndex = '20';
        anim.style.textShadow = '0 0 20px rgba(255,215,0,0.5)';
        anim.style.whiteSpace = 'nowrap';
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 80 + 40;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 30;
        
        const cubeX = rect.left - containerRect.left + rect.width / 2;
        const cubeY = rect.top - containerRect.top + rect.height / 2;
        
        anim.style.left = (cubeX + dx - 30) + 'px';
        anim.style.top = (cubeY + dy - 15) + 'px';
        anim.style.opacity = '1';
        anim.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        const delay = Math.random() * 0.2;
        anim.style.animationDelay = delay + 's';
        
        container.appendChild(anim);
        
        setTimeout(() => {
            anim.style.opacity = '0';
            anim.style.transform = `translateY(-${Math.random() * 60 + 40}px) scale(${Math.random() * 0.5 + 0.5})`;
        }, 50 + delay * 1000);
        
        setTimeout(() => {
            if (anim.parentNode) {
                anim.remove();
            }
        }, 700 + delay * 1000);
    }
}

// Сбор пассивки
function collectPassive() {
    if (player.passiveIncome === 0) {
        tg.showAlert('У вас нет пассивного дохода! Купите генераторы.');
        return;
    }
    
    const now = Date.now();
    const hoursPassed = (now - player.lastCollect) / (1000 * 60 * 60);
    
    if (hoursPassed < 0.1) {
        tg.showAlert('Подождите немного! Доход накапливается.');
        return;
    }
    
    let earned = Math.floor(player.passiveIncome * hoursPassed);
    if (earned < 1) earned = 1;
    
    player.coins += earned;
    player.totalCoins += earned;
    player.lastCollect = now;
    
    tg.showAlert(`📥 Собрано ${formatNumber(earned)} 🪙`);
    updateUI();
}

// Улучшение клика
function upgradeClick() {
    const cost = 50 * Math.pow(player.clickPower, 2);
    
    if (player.coins < cost) {
        tg.showAlert(`❌ Нужно ${formatNumber(cost)} 🪙`);
        return;
    }
    
    player.coins -= cost;
    player.clickPower++;
    tg.showAlert(`💪 Сила клика: +${player.clickPower}`);
    updateUI();
}

// Покупка генератора
function buyGenerator(genId) {
    const isNew = player.generators[genId] === undefined;
    const currentLevel = player.generators[genId] || 0;
    const cost = getPrice(genId, isNew ? 1 : currentLevel + 1);
    
    if (player.coins < cost) {
        tg.showAlert(`❌ Нужно ${formatNumber(cost)} 🪙`);
        return;
    }
    
    player.coins -= cost;
    if (isNew) {
        player.generators[genId] = 1;
        tg.showAlert(`✅ Куплен ${GENERATORS[genId].name}!`);
    } else {
        player.generators[genId] = currentLevel + 1;
        tg.showAlert(`✅ ${GENERATORS[genId].name} улучшен до ${currentLevel + 1} уровня!`);
    }
    
    flashGenerator(genId);
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    updateUI();
}

// Рендер генераторов
function renderGenerators() {
    const container = document.getElementById('generators-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const categories = {
        basic: '🎲 Базовые',
        medium: '⚡ Средние',
        expensive: '🚀 Дорогие',
        legendary: '👑 Легендарные'
    };
    
    for (const [category, categoryName] of Object.entries(categories)) {
        const categoryGen = Object.entries(GENERATORS).filter(
            ([id, data]) => data.category === category
        );
        
        if (categoryGen.length === 0) continue;
        
        const header = document.createElement('div');
        header.style.cssText = 'color: #888; font-size: 12px; margin: 10px 0 5px;';
        header.textContent = categoryName;
        container.appendChild(header);
        
        for (const [genId, genData] of categoryGen) {
            const level = player.generators[genId] || 0;
            const item = document.createElement('div');
            item.className = 'generator-item';
            if (level > 0) item.classList.add('bought');
            
            const info = document.createElement('div');
            info.className = 'generator-info';
            
            const name = document.createElement('div');
            name.className = 'generator-name';
            name.textContent = genData.name;
            
            const levelText = document.createElement('div');
            levelText.className = 'generator-level';
            if (level === 0) {
                levelText.textContent = '❌ Не куплен';
            } else {
                const income = getIncome(genId, level);
                levelText.textContent = `Ур. ${level} | +${formatNumber(income)}/ч`;
            }
            info.appendChild(name);
            info.appendChild(levelText);
            
            const btn = document.createElement('button');
            btn.className = 'generator-btn';
            
            if (level === 0) {
                const price = getPrice(genId, 1);
                btn.textContent = `Купить ${formatNumber(price)}🪙`;
                btn.onclick = () => buyGenerator(genId);
                if (player.coins < price) btn.disabled = true;
            } else {
                const price = getPrice(genId, level + 1);
                btn.textContent = `⬆️ ${formatNumber(price)}🪙`;
                btn.onclick = () => buyGenerator(genId);
                if (player.coins < price) btn.disabled = true;
            }
            
            item.appendChild(info);
            item.appendChild(btn);
            container.appendChild(item);
        }
    }
}

// Покупка бустера
function buyBooster(type) {
    const prices = {
        hour_boost: 5000,
        coin_bag: 2000,
        super_click: 3000
    };
    
    const price = prices[type];
    if (player.coins < price) {
        tg.showAlert(`❌ Нужно ${formatNumber(price)} 🪙`);
        return;
    }
    
    if (type === 'coin_bag') {
        const bonus = Math.floor(player.coins * 0.1);
        player.coins += bonus;
        tg.showAlert(`💰 +${formatNumber(bonus)} 🪙 (10%)`);
    } else {
        player.coins -= price;
        player.boosters[type] = (player.boosters[type] || 0) + 1;
        const names = {
            hour_boost: '⏳ Ускорение на 1 час',
            super_click: '🎯 Супер-клик'
        };
        tg.showAlert(`✅ Куплен ${names[type] || type}!`);
    }
    
    updateUI();
}

// Обновление статистики
function updateStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    const totalGenerators = Object.values(player.generators).reduce((a, b) => a + b, 0);
    
    container.innerHTML = `
        🪙 Всего заработано: <span>${formatNumber(player.totalCoins)}</span><br>
        💪 Сила клика: <span>+${player.clickPower}</span><br>
        ⚡ Пассивный доход: <span>${formatNumber(player.passiveIncome)}/ч</span><br>
        🏭 Генераторов: <span>${totalGenerators}</span><br>
        🎯 Уровень престижа: <span>${player.prestigeLevel}</span><br>
        📅 Кликов сегодня: <span>${player.dailyClicks}</span>
    `;
}

// Переключение вкладок
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
    
    if (tab === 'generators') renderGenerators();
    if (tab === 'stats') updateStats();
}

// ===== ИГРА В КУБИКИ =====
let diceCount = 2;

function openDiceGame() {
    document.getElementById('dice-overlay').style.display = 'flex';
    document.getElementById('dice-result').innerHTML = '';
}

function closeDiceGame() {
    document.getElementById('dice-overlay').style.display = 'none';
}

function selectDiceCount(count) {
    diceCount = count;
    document.querySelectorAll('#dice-controls-modal .dice-count').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });
}

function rollDice() {
    const resultContainer = document.getElementById('dice-result');
    resultContainer.innerHTML = '';
    
    const count = diceCount;
    const results = [];
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * 6) + 1;
        results.push(value);
    }
    
    results.forEach((value, index) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = 'dice-result-item';
            item.textContent = diceEmojis[value - 1];
            resultContainer.appendChild(item);
        }, index * 150);
    });
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Инициализация
loadGame();
updateUI();

// Автосохранение каждые 10 секунд
setInterval(saveGame, 10000);

// Пассивный доход в фоне
setInterval(() => {
    if (player.passiveIncome > 0) {
        const earned = Math.floor(player.passiveIncome / 60);
        if (earned > 0) {
            player.coins += earned;
            updateUI();
        }
    }
}, 60000);

tg.onEvent('viewportChanged', () => {
    saveGame();
});

console.log('🎲 Колония Кубов загружена!');
