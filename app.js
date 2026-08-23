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

// Данные генераторов
const GENERATORS = {
    pocket_cube: {
        name: '🎲 Карманный кубик',
        basePrice: 100,
        baseIncome: 10,
        category: 'basic'
    },
    helper_cube: {
        name: '🤖 Кубик-помощник',
        basePrice: 500,
        baseIncome: 50,
        category: 'basic'
    },
    cube_farm: {
        name: '🏭 Кубо-ферма',
        basePrice: 3000,
        baseIncome: 300,
        category: 'medium'
    },
    energy_cube: {
        name: '⚡ Энерго-куб',
        basePrice: 12000,
        baseIncome: 1200,
        category: 'medium'
    },
    reactor: {
        name: '🔄 Кубический реактор',
        basePrice: 50000,
        baseIncome: 5000,
        category: 'medium'
    },
    satellite: {
        name: '🚀 Куб-спутник',
        basePrice: 200000,
        baseIncome: 20000,
        category: 'expensive'
    },
    cube_brain: {
        name: '🧠 Кубо-мозг',
        basePrice: 1000000,
        baseIncome: 100000,
        category: 'expensive'
    },
    singularity: {
        name: '🌀 Кубическая сингулярность',
        basePrice: 10000000,
        baseIncome: 1000000,
        category: 'expensive'
    },
    cube_universe: {
        name: '🌌 Куб-вселенная',
        basePrice: 100000000,
        baseIncome: 10000000,
        category: 'legendary'
    },
    cube_throne: {
        name: '👑 Кубический трон',
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
            // Восстанавливаем дату
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

// Обновление UI
function updateUI() {
    // Пассивный доход
    player.passiveIncome = calculatePassiveIncome();
    
    // Обновляем отображение
    document.getElementById('coins').textContent = formatNumber(player.coins);
    document.getElementById('clickPower').textContent = player.clickPower;
    document.getElementById('passiveIncome').textContent = formatNumber(player.passiveIncome);
    
    // Обновляем бустеры
    const boostersCount = document.getElementById('boosters-count');
    if (boostersCount) {
        boostersCount.textContent = `⏳ ${player.boosters.hour_boost || 0} | 🎯 ${player.boosters.super_click || 0}`;
    }
    
    // Обновляем генераторы
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

// Клик по кубу
function handleClick() {
    let multiplier = 1;
    if (player.boosters.super_click > 0) {
        multiplier = 10;
        player.boosters.super_click--;
    }
    
    const earned = player.clickPower * multiplier;
    player.coins += earned;
    player.totalCoins += earned;
    player.dailyClicks++;
    
    // Анимация
    showClickAnimation(earned, multiplier > 1);
    
    updateUI();
}

// Анимация клика
function showClickAnimation(amount, isSuper) {
    const anim = document.getElementById('click-animation');
    const cube = document.getElementById('cube');
    
    // Встряска куба
    cube.style.transform = 'scale(0.8) rotate(10deg)';
    setTimeout(() => {
        cube.style.transform = '';
    }, 150);
    
    // Текст
    anim.textContent = `+${formatNumber(amount)}${isSuper ? ' 🔥x10' : ''}`;
    anim.style.color = isSuper ? '#ff6b6b' : '#ffd700';
    anim.style.left = (Math.random() * 40 + 30) + '%';
    anim.style.top = (Math.random() * 40 + 30) + '%';
    anim.className = 'click-burst';
    setTimeout(() => {
        anim.className = '';
    }, 600);
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
    if (player.generators[genId] !== undefined) {
        // Улучшаем
        const currentLevel = player.generators[genId];
        const cost = getPrice(genId, currentLevel + 1);
        
        if (player.coins < cost) {
            tg.showAlert(`❌ Нужно ${formatNumber(cost)} 🪙`);
            return;
        }
        
        player.coins -= cost;
        player.generators[genId] = currentLevel + 1;
        tg.showAlert(`✅ ${GENERATORS[genId].name} улучшен до ${currentLevel + 1} уровня!`);
    } else {
        // Покупаем
        const cost = getPrice(genId, 1);
        
        if (player.coins < cost) {
            tg.showAlert(`❌ Нужно ${formatNumber(cost)} 🪙`);
            return;
        }
        
        player.coins -= cost;
        player.generators[genId] = 1;
        tg.showAlert(`✅ Куплен ${GENERATORS[genId].name}!`);
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
    // Кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Панели
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
    
    // Обновляем контент при переключении
    if (tab === 'generators') renderGenerators();
    if (tab === 'stats') updateStats();
}

// Инициализация
loadGame();
updateUI();

// Автосохранение каждые 10 секунд
setInterval(saveGame, 10000);

// Пассивный доход в фоне
setInterval(() => {
    // Небольшой пассивный доход каждую минуту
    if (player.passiveIncome > 0) {
        const earned = Math.floor(player.passiveIncome / 60);
        if (earned > 0) {
            player.coins += earned;
            updateUI();
        }
    }
}, 60000);

// Обработка закрытия
tg.onEvent('viewportChanged', () => {
    saveGame();
});

console.log('🎲 Колония Кубов загружена!');
