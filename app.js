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
    },
    diceCount: 2
};

// Данные генераторов с эмодзи для мини-кубов
const GENERATORS = {
    pocket_cube: {
        name: '🎲 Карманный кубик',
        emoji: '🎲',
        basePrice: 100,
        baseIncome: 10,
        category: 'basic',
        orbitRadius: 100,
        orbitSpeed: 4
    },
    helper_cube: {
        name: '🤖 Кубик-помощник',
        emoji: '🤖',
        basePrice: 500,
        baseIncome: 50,
        category: 'basic',
        orbitRadius: 120,
        orbitSpeed: 3.5
    },
    cube_farm: {
        name: '🏭 Кубо-ферма',
        emoji: '🏭',
        basePrice: 3000,
        baseIncome: 300,
        category: 'medium',
        orbitRadius: 100,
        orbitSpeed: 3
    },
    energy_cube: {
        name: '⚡ Энерго-куб',
        emoji: '⚡',
        basePrice: 12000,
        baseIncome: 1200,
        category: 'medium',
        orbitRadius: 130,
        orbitSpeed: 2.5
    },
    reactor: {
        name: '🔄 Кубический реактор',
        emoji: '🔄',
        basePrice: 50000,
        baseIncome: 5000,
        category: 'medium',
        orbitRadius: 110,
        orbitSpeed: 2
    },
    satellite: {
        name: '🚀 Куб-спутник',
        emoji: '🚀',
        basePrice: 200000,
        baseIncome: 20000,
        category: 'expensive',
        orbitRadius: 140,
        orbitSpeed: 1.8
    },
    cube_brain: {
        name: '🧠 Кубо-мозг',
        emoji: '🧠',
        basePrice: 1000000,
        baseIncome: 100000,
        category: 'expensive',
        orbitRadius: 120,
        orbitSpeed: 1.5
    },
    singularity: {
        name: '🌀 Кубическая сингулярность',
        emoji: '🌀',
        basePrice: 10000000,
        baseIncome: 1000000,
        category: 'expensive',
        orbitRadius: 150,
        orbitSpeed: 1.2
    },
    cube_universe: {
        name: '🌌 Куб-вселенная',
        emoji: '🌌',
        basePrice: 100000000,
        baseIncome: 10000000,
        category: 'legendary',
        orbitRadius: 130,
        orbitSpeed: 1
    },
    cube_throne: {
        name: '👑 Кубический трон',
        emoji: '👑',
        basePrice: 1000000000,
        baseIncome: 100000000,
        category: 'legendary',
        orbitRadius: 160,
        orbitSpeed: 0.8
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

// Обновление мини-кубов генераторов
function updateMiniCubes() {
    const container = document.getElementById('mini-cubes');
    container.innerHTML = '';
    
    const purchased = Object.keys(player.generators);
    if (purchased.length === 0) {
        // Показываем призрачные кубы
        const ghostEmojis = ['⬜', '⬜', '⬜'];
        ghostEmojis.forEach((emoji, i) => {
            const cube = document.createElement('div');
            cube.className = 'mini-cube';
            cube.textContent = emoji;
            cube.style.opacity = '0.2';
            cube.style.animationDelay = `${i * 1.3}s`;
            cube.style.fontSize = '20px';
            container.appendChild(cube);
        });
        return;
    }
    
    purchased.forEach((genId, index) => {
        const gen = GENERATORS[genId];
        if (!gen) return;
        
        const level = player.generators[genId];
        const cube = document.createElement('div');
        cube.className = 'mini-cube bought';
        cube.textContent = gen.emoji;
        cube.dataset.genId = genId;
        
        // Разные орбиты
        const radius = gen.orbitRadius || 100 + (index * 10);
        const speed = gen.orbitSpeed || 4 - (index * 0.3);
        const delay = index * 0.8;
        
        cube.style.setProperty('--radius', radius + 'px');
        cube.style.setProperty('--speed', speed + 's');
        cube.style.animationDelay = delay + 's';
        cube.style.fontSize = (20 + level * 2) + 'px';
        
        // Позиционирование на орбите
        const angle = (index / purchased.length) * 360;
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;
        cube.style.transform = `translate(${x}px, ${y}px)`;
        
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
    
    // Анимация вращения как в Telegram
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

// Анимация клика
function showClickAnimation(amount, isSuper) {
    const anim = document.getElementById('click-animation');
    anim.textContent = `+${formatNumber(amount)}${isSuper ? ' 🔥x10' : ''}`;
    anim.style.color = isSuper ? '#ff6b6b' : '#ffd700';
    anim.style.left = (Math.random() * 40 + 30) + '%';
    anim.style.top = (Math.random() * 30 + 35) + '%';
    anim.className = 'click-burst';
    setTimeout(() => {
        anim.className = '';
    }, 600);
}

// Бросок кубиков
function selectDiceCount(count) {
    player.diceCount = count;
    document.querySelectorAll('.dice-count').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });
}

function rollDice() {
    const resultContainer = document.getElementById('dice-result');
    resultContainer.innerHTML = '';
    resultContainer.style.display = 'flex';
    
    const count = player.diceCount;
    const results = [];
    let totalEarned = 0;
    
    for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * 6) + 1;
        results.push(value);
        totalEarned += value * 10; // 10 монет за каждое очко
    }
    
    // Показываем результаты с анимацией
    results.forEach((value, index) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = 'dice-result-item';
            // Эмодзи кубиков
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            item.textContent = diceEmojis[value - 1];
            resultContainer.appendChild(item);
        }, index * 150);
    });
    
    // Добавляем монеты
    setTimeout(() => {
        player.coins += totalEarned;
        player.totalCoins += totalEarned;
        tg.showAlert(`🎲 Выпало: ${results.join(', ')}\n+${formatNumber(totalEarned)} 🪙`);
        updateUI();
        
        // Скрываем результат через 3 секунды
        setTimeout(() => {
            resultContainer.style.display = 'none';
            resultContainer.innerHTML = '';
        }, 3000);
    }, results.length * 150 + 200);
    
    // Вибрация
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
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
    
    // Вспышка и зелёное уведомление
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

// Инициализация
loadGame();

// Активируем кнопку выбора кубиков
document.querySelectorAll('.dice-count').forEach(btn => {
    if (parseInt(btn.dataset.count) === player.diceCount) {
        btn.classList.add('active');
    }
});

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
