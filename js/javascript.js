const firebaseConfig = {
    databaseURL: "https://oper-kassa-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currencies = [];

function loadCurrenciesFromFirebase() {
    try {
        console.log("Loading currencies from Firebase...");
        
        const currenciesRef = database.ref('currencies');
        currenciesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data && Array.isArray(data) && data.length > 0) {
                console.log("Currencies loaded from Firebase:", data);
                currencies = data;
                displayCurrencies();
                setupCalculator();
            } else {
                console.log("No data in Firebase, using static data");
                loadStaticCurrencies();
            }
        }, (error) => {
            console.error("Error loading currencies:", error);
            loadStaticCurrencies();
        });

    } catch (error) {
        console.error("Error in loadCurrenciesFromFirebase:", error);
        loadStaticCurrencies();
    }
}

function displayCurrencies() {
    const grid = document.getElementById('currencyGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    currencies.filter(c => c.code !== 'RUB').forEach(({ code, flag, name, buy, sell, showRates }, index, array) => {
        const card = document.createElement('div');
        card.className = `currency-card bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 hover:border-teal-400 transition-all hover:scale-105 cursor-pointer slide-in min-w-[300px] max-w-[350px]`;
        
        if (showRates) {
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <img src="https://flagcdn.com/w40/${flag}.png" alt="${code}" class="w-10 h-8 rounded shadow-sm" />
                    <div>
                    <h3 class="text-2xl font-bold">${name.includes('белый') ? 'USD' : name.includes('синий') ? 'USD' : code}</h3>
                    <p class="text-xs text-gray-500">${name}</p>
                    </div>
                </div>
                </div>
                <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">Покупка</span>
                    <span class="text-2xl font-bold text-green-400">${buy.toFixed(2)} ₽</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">Продажа</span>
                    <span class="text-2xl font-bold text-red-400">${sell.toFixed(2)} ₽</span>
                </div>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <img src="https://flagcdn.com/w40/${flag}.png" alt="${code}" class="w-10 h-8 rounded shadow-sm" />
                    <div>
                    <h3 class="text-2xl font-bold">${code}</h3>
                    <p class="text-xs text-gray-500">${name}</p>
                    </div>
                </div>
                </div>
                <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">Покупка</span>
                    <span class="text-xl font-bold text-gray-500">—</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400">Продажа</span>
                    <span class="text-xl font-bold text-gray-500">—</span>
                </div>
                <div class="text-center pt-2 border-t border-gray-700 mt-3">
                    <p class="text-xs text-gray-500 mb-1">Уточняйте курс по телефону</p>
                    <a href="tel:+79616269999" class="text-teal-400 hover:text-teal-300 font-semibold text-sm">+7 (961) 626-99-99</a>
                </div>
                </div>`;
        }
        
        grid.appendChild(card);
    });
}

// Настройка калькулятора с текущими курсами
function setupCalculator() {
    // Обновляем опции в селектах
    updateCurrencySelects();
    
    // Пересчитываем текущий обмен
    calculateExchange();
}

// Обновление селектов в калькуляторе
function updateCurrencySelects() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    if (!fromSelect || !toSelect) return;
    
    // Сохраняем текущие значения
    const currentFrom = fromSelect.value;
    const currentTo = toSelect.value;
    
    // Очищаем селекты
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Заполняем селекты
    currencies.forEach(currency => {
        const optionFrom = document.createElement('option');
        optionFrom.value = currency.code;
        optionFrom.textContent = `${currency.code} - ${currency.name}`;
        if (currency.code === currentFrom) optionFrom.selected = true;
        
        const optionTo = document.createElement('option');
        optionTo.value = currency.code;
        optionTo.textContent = `${currency.code} - ${currency.name}`;
        if (currency.code === currentTo) optionTo.selected = true;
        
        fromSelect.appendChild(optionFrom);
        toSelect.appendChild(optionTo);
    });
    
    // Если не было сохраненных значений, устанавливаем по умолчанию
    if (!currentFrom) {
        const rubOption = fromSelect.querySelector('option[value="RUB"]');
        if (rubOption) rubOption.selected = true;
    }
    
    if (!currentTo) {
        const usdOption = toSelect.querySelector('option[value="USD_WHITE"]');
        if (usdOption) usdOption.selected = true;
    }
}

// Fallback на статичные данные
function loadStaticCurrencies() {
    console.log("Loading static currencies...");
    
    currencies = [
        { code: 'USD_WHITE', flag: 'us', name: 'Доллар США (белый)', buy: 79.0, sell: 81.0, showRates: true },
        { code: 'USD_BLUE', flag: 'us', name: 'Доллар США (синий)', buy: 81.0, sell: 81.9, showRates: true },
        { code: 'EUR', flag: 'eu', name: 'Евро', buy: 94.0, sell: 95.5, showRates: true },
        { code: 'GBP', flag: 'gb', name: 'Фунт стерлингов', buy: 0, sell: 0, showRates: false },
        { code: 'CNY', flag: 'cn', name: 'Китайский юань', buy: 0, sell: 0, showRates: false },
        { code: 'RUB', flag: 'ru', name: 'Российский рубль', buy: 1, sell: 1, showRates: true }
    ];
    
    displayCurrencies();
    setupCalculator();
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
    current += step;
    if (current >= target) {
        element.textContent = target.toLocaleString('ru-RU');
        clearInterval(timer);
    } else {
        element.textContent = Math.floor(current).toLocaleString('ru-RU');
    }
    }, 16);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
    if (entry.isIntersecting) {
        const counters = document.querySelectorAll('[data-target]');
        counters.forEach(counter => animateCounter(counter));
        observer.disconnect();
    }
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing...");
    
    // Загружаем курсы из Firebase (вместо статических)
    loadCurrenciesFromFirebase();
    
    // Наблюдатель для статистики
    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // Инициализация калькулятора (будет вызвана после загрузки курсов)
    const fromAmount = document.getElementById('fromAmount');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const toAmount = document.getElementById('toAmount');
    
    if (fromAmount && fromCurrency && toCurrency && toAmount) {
        fromAmount.addEventListener('input', calculateExchange);
        fromCurrency.addEventListener('change', calculateExchange);
        toCurrency.addEventListener('change', calculateExchange);
    }
});

function calculateExchange() {
    const fromAmount = document.getElementById('fromAmount');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const toAmount = document.getElementById('toAmount');
    
    if (!fromAmount || !fromCurrency || !toCurrency || !toAmount) return;

    const amount = parseFloat(fromAmount.value) || 0;
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (amount === 0) {
    toAmount.textContent = '~';
    return;
    }

    const fromRate = currencies.find(c => c.code === from)?.sell || 1;
    const toRate = currencies.find(c => c.code === to)?.buy || 1;

    let result;
    if (from === 'RUB') {
    result = amount / toRate;
    } else if (to === 'RUB') {
    result = amount * fromRate;
    } else {
    const inRub = amount * fromRate;
    result = inRub / toRate;
    }

    toAmount.textContent = result.toFixed(2) + ' ' + to;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const toggle = document.getElementById('themeToggle');
const toggleBg = document.getElementById('toggleBg');
const toggleCircle = document.getElementById('toggleCircle');
const darkLabel = document.getElementById('darkLabel');
const lightLabel = document.getElementById('lightLabel');

if (toggle && toggleBg && toggleCircle) {
    toggle.addEventListener('change', () => {
        const body = document.getElementById('body');
        const navbar = document.getElementById('navbar');
        const heroSection = document.getElementById('heroSection');
        const contactCard = document.getElementById('contactCard');
        const calculatorCard = document.getElementById('calculatorCard');
        const footer = document.getElementById('footer');
        const cards = document.querySelectorAll('.currency-card');
        const statsSection = document.getElementById('statsSection');

        if (toggle.checked) {
            // Светлая тема
            toggleBg.classList.replace('bg-gray-700', 'bg-gray-300');
            toggleCircle.style.transform = 'translateX(24px)';
            darkLabel.classList.add('hidden');
            lightLabel.classList.remove('hidden');
            lightLabel.classList.add('text-teal-600', 'font-semibold');

            body.classList.replace('bg-gray-950', 'bg-gray-50');
            body.classList.replace('text-gray-100', 'text-gray-900');
            navbar.classList.replace('border-gray-800', 'border-gray-200');
            navbar.classList.replace('bg-gray-950/90', 'bg-gray-50/90');
            heroSection.classList.remove('hero-gradient');
            heroSection.classList.add('hero-gradient-light');
            footer.classList.replace('border-gray-800', 'border-gray-200');

            contactCard.classList.remove('glass-effect', 'border-gray-800');
            contactCard.classList.add('glass-effect-light', 'border-gray-200');
            calculatorCard.classList.remove('glass-effect', 'border-gray-800');
            calculatorCard.classList.add('glass-effect-light', 'border-gray-200');
            statsSection.classList.replace('bg-gray-900/50', 'bg-white/50');

            // Секции преимуществ и партнеров
            const advantages = document.getElementById('advantages');
            const partners = document.getElementById('partners');
            if (advantages) advantages.classList.replace('bg-gray-900/50', 'bg-gray-50');
            if (partners) partners.classList.replace('bg-gray-900/50', 'bg-gray-50');
            
            document.querySelectorAll('#advantagesGrid .bg-gray-900, #partners .bg-gray-900').forEach(el => {
                el.classList.replace('bg-gray-900', 'bg-white');
                el.classList.replace('border-gray-800', 'border-gray-200');
            });
            
            document.querySelectorAll('#advantages h2, #partners h2, #advantages h3, #partners h3').forEach(el => {
                el.classList.replace('text-gray-100', 'text-gray-900');
            });
            
            document.querySelectorAll('#advantages p, #partners p').forEach(el => {
                if (!el.classList.contains('text-teal-400')) {
                    el.classList.replace('text-gray-400', 'text-gray-600');
                }
            });

            // Элементы калькулятора
            document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
                el.classList.remove('bg-gray-800', 'border-gray-700', 'text-gray-100');
                el.classList.add('bg-white', 'border-gray-300', 'text-gray-900');
            });
            const toAmount = document.getElementById('toAmount');
            if (toAmount) {
                toAmount.classList.remove('bg-gray-900', 'border-gray-700', 'text-teal-400');
                toAmount.classList.add('bg-gray-100', 'border-gray-300', 'text-teal-600');
            }

            // Карточки валют
            cards.forEach(c => {
                c.classList.replace('bg-gray-900', 'bg-white');
                c.classList.replace('border-gray-800', 'border-gray-200');
                c.classList.replace('hover:border-teal-400', 'hover:border-teal-600');
            });

            // Отзывы
            document.querySelectorAll('.review-card').forEach(card => {
                card.classList.remove('bg-gray-900/60', 'border-gray-700');
                card.classList.add('bg-white', 'border-gray-200');
            });
            document.querySelectorAll('.review-name').forEach(name => {
                name.classList.remove('text-white');
                name.classList.add('text-gray-900');
            });
            document.querySelectorAll('.review-text').forEach(text => {
                text.classList.remove('text-gray-300');
                text.classList.add('text-gray-700');
            });

        } else {
            // Темная тема
            toggleBg.classList.replace('bg-gray-300', 'bg-gray-700');
            toggleCircle.style.transform = 'translateX(0)';
            lightLabel.classList.add('hidden');
            darkLabel.classList.remove('hidden');
            darkLabel.classList.add('text-teal-400', 'font-semibold');

            body.classList.replace('bg-gray-50', 'bg-gray-950');
            body.classList.replace('text-gray-900', 'text-gray-100');
            navbar.classList.replace('border-gray-200', 'border-gray-800');
            navbar.classList.replace('bg-gray-50/90', 'bg-gray-950/90');
            heroSection.classList.remove('hero-gradient-light');
            heroSection.classList.add('hero-gradient');
            footer.classList.replace('border-gray-200', 'border-gray-800');

            contactCard.classList.remove('glass-effect-light', 'border-gray-200');
            contactCard.classList.add('glass-effect', 'border-gray-800');
            calculatorCard.classList.remove('glass-effect-light', 'border-gray-200');
            calculatorCard.classList.add('glass-effect', 'border-gray-800');
            statsSection.classList.replace('bg-white/50', 'bg-gray-900/50');

            // Секции преимуществ и партнеров
            const advantages = document.getElementById('advantages');
            const partners = document.getElementById('partners');
            if (advantages) advantages.classList.replace('bg-gray-50', 'bg-gray-900/50');
            if (partners) partners.classList.replace('bg-gray-50', 'bg-gray-900/50');
            
            document.querySelectorAll('#advantagesGrid .bg-white, #partners .bg-white').forEach(el => {
                el.classList.replace('bg-white', 'bg-gray-900');
                el.classList.replace('border-gray-200', 'border-gray-800');
            });
            
            document.querySelectorAll('#advantages h2, #partners h2, #advantages h3, #partners h3').forEach(el => {
                el.classList.replace('text-gray-900', 'text-gray-100');
            });
            
            document.querySelectorAll('#advantages p, #partners p').forEach(el => {
                if (!el.classList.contains('text-teal-400')) {
                    el.classList.replace('text-gray-600', 'text-gray-400');
                }
            });

            // Элементы калькулятора
            document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
                el.classList.remove('bg-white', 'border-gray-300', 'text-gray-900');
                el.classList.add('bg-gray-800', 'border-gray-700', 'text-gray-100');
            });
            const toAmount = document.getElementById('toAmount');
            if (toAmount) {
                toAmount.classList.remove('bg-gray-100', 'border-gray-300', 'text-teal-600');
                toAmount.classList.add('bg-gray-900', 'border-gray-700', 'text-teal-400');
            }

            // Карточки валют
            cards.forEach(c => {
                c.classList.replace('bg-white', 'bg-gray-900');
                c.classList.replace('border-gray-200', 'border-gray-800');
                c.classList.replace('hover:border-teal-600', 'hover:border-teal-400');
            });

            // Отзывы
            document.querySelectorAll('.review-card').forEach(card => {
                card.classList.remove('bg-white', 'border-gray-200');
                card.classList.add('bg-gray-900/60', 'border-gray-700');
            });
            document.querySelectorAll('.review-name').forEach(name => {
                name.classList.remove('text-gray-900');
                name.classList.add('text-white');
            });
            document.querySelectorAll('.review-text').forEach(text => {
                text.classList.remove('text-gray-700');
                text.classList.add('text-gray-300');
            });
        }
    });
}

// Глобальные функции
window.scrollToTop = scrollToTop;
window.calculateExchange = calculateExchange;
