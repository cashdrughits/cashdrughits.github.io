const firebaseConfig = {
    databaseURL: "https://oper-kassa-default-rtdb.europe-west1.firebasedatabase.app"
};

let currencies = [];
let app, database;
let firebaseLoaded = false;

function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.app) {
            app = firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            firebaseLoaded = true;
            console.log("Firebase initialized successfully");
            return true;
        } else {
            console.warn("Firebase SDK not available");
            return false;
        }
    } catch (error) {
        console.warn("Firebase initialization failed:", error);
        return false;
    }
}

async function loadCurrencies() {
    console.log("Starting currency loading process...");
    
    const grid = document.getElementById('currencyGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                <p class="text-gray-400 mt-2">Загружаем курсы...</p>
            </div>
        `;
    }
    
    if (initializeFirebase()) {
        try {
            await loadCurrenciesFromFirebase();
            return; 
        } catch (error) {
            console.warn("Firebase load failed, trying fallbacks...");
        }
    }
    
    try {
        await loadCurrenciesFromCBR();
        return; // 
    } catch (error) {
        console.warn("CBR load failed, using static data...");
    }
    
    loadStaticCurrencies();
}

function loadCurrenciesFromFirebase() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Firebase timeout"));
        }, 5000);

        const currenciesRef = database.ref('currencies');
        currenciesRef.on('value', (snapshot) => {
            clearTimeout(timeout);
            const data = snapshot.val();
            
            if (data && Array.isArray(data) && data.length > 0) {
                console.log("Currencies loaded from Firebase:", data);
                currencies = data;
                displayCurrencies();
                setupCalculator();
                resolve();
            } else {
                reject(new Error("No data in Firebase"));
            }
        }, (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function loadCurrenciesFromCBR() {
    try {
        const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('CBR response not ok');
        
        const data = await response.json();
        
        currencies = [
            {
                code: 'USD_BLUE',
                flag: 'us',
                name: 'Доллар США (синий)',
                buy: data.Valute.USD.Value * 0.98,
                sell: data.Valute.USD.Value * 1.02,
                showRates: true
            },
            {
                code: 'USD_WHITE',
                flag: 'us', 
                name: 'Доллар США (белый)',
                buy: data.Valute.USD.Value * 0.95,
                sell: data.Valute.USD.Value * 1.05,
                showRates: true
            },
            {
                code: 'EUR',
                flag: 'eu',
                name: 'Евро',
                buy: data.Valute.EUR.Value * 0.98,
                sell: data.Valute.EUR.Value * 1.02,
                showRates: true
            },
            // ИЗМЕНЕНИЕ: Для GBP и CNY в fallback всегда showRates: false
            {
                code: 'GBP',
                flag: 'gb',
                name: 'Фунт стерлингов',
                buy: data.Valute.GBP ? data.Valute.GBP.Value * 0.98 : 0,
                sell: data.Valute.GBP ? data.Valute.GBP.Value * 1.02 : 0,
                showRates: false 
            },
            {
                code: 'CNY',
                flag: 'cn',
                name: 'Китайский юань',
                buy: data.Valute.CNY ? data.Valute.CNY.Value * 0.98 : 0,
                sell: data.Valute.CNY ? data.Valute.CNY.Value * 1.02 : 0,
                showRates: false 
            },
            {
                code: 'RUB',
                flag: 'ru',
                name: 'Российский рубль',
                buy: 1,
                sell: 1,
                showRates: true
            }
        ];
        
        console.log("Currencies loaded from CBR:", currencies);
        displayCurrencies();
        setupCalculator();
        
    } catch (error) {
        console.error("Error loading from CBR:", error);
        throw error;
    }
}

async function loadStaticCurrencies() {
    try {
        const response = await fetch('./data/currencies.json');
        if (response.ok) {
            const data = await response.json();
            currencies = data.currencies;
            console.log("Currencies loaded from local JSON");
        } else {
            throw new Error('Local JSON not found');
        }
    } catch (error) {
        console.log("Using built-in static currencies");
        currencies = [
            { code: 'USD_BLUE', flag: 'us', name: 'Доллар США (синий)', buy: 81.0, sell: 81.9, showRates: true },
            { code: 'USD_WHITE', flag: 'us', name: 'Доллар США (белый)', buy: 79.0, sell: 81.0, showRates: true },
            { code: 'EUR', flag: 'eu', name: 'Евро', buy: 94.0, sell: 95.5, showRates: true },
            { code: 'GBP', flag: 'gb', name: 'Фунт стерлингов', buy: 110.0, sell: 115.0, showRates: false },
            { code: 'CNY', flag: 'cn', name: 'Китайский юань', buy: 11.5, sell: 12.0, showRates: false },
            { code: 'RUB', flag: 'ru', name: 'Российский рубль', buy: 1, sell: 1, showRates: true }
        ];
    }
    
    displayCurrencies();
    setupCalculator();
}
function displayCurrencies() {
    const grid = document.getElementById('currencyGrid');
    if (!grid) {
        console.error("Currency grid not found");
        return;
    }
    
    grid.innerHTML = `
        <div class="col-span-full text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            <p class="text-gray-400 mt-2">Загружаем курсы...</p>
        </div>
    `;
    
    setTimeout(() => {
        const renderCurrencies = () => {
            grid.innerHTML = '';
            
            const filteredCurrencies = currencies.filter(c => c.code !== 'RUB');
            
            if (filteredCurrencies.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <p class="text-red-400">Не удалось загрузить курсы</p>
                        <p class="text-gray-400 mt-2">Пожалуйста, позвоните для уточнения курсов</p>
                        <a href="tel:+79616269999" class="text-teal-400 hover:text-teal-300 font-semibold">+7 (961) 626-99-99</a>
                    </div>
                `;
                return;
            }
            
            filteredCurrencies.forEach((currency, index) => {
                const card = document.createElement('div');
                card.className = `currency-card bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800 hover:border-teal-400 transition-all hover:scale-105 cursor-pointer slide-in min-w-[300px] max-w-[350px]`;
                
                const shouldShowRates = (currency.code === 'GBP' || currency.code === 'CNY') 
                    ? currency.showRates && currency.buy > 0
                    : currency.buy > 0;
                
                if (shouldShowRates) {
                    card.innerHTML = `
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <img src="https://flagcdn.com/w40/${currency.flag}.png" alt="${currency.code}" class="w-10 h-8 rounded shadow-sm" />
                                <div>
                                    <h3 class="text-2xl font-bold">${getCurrencyDisplayCode(currency)}</h3>
                                    <p class="text-xs text-gray-500">${currency.name}</p>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400">Покупка</span>
                                <span class="text-2xl font-bold text-green-400">${currency.buy.toFixed(2)} ₽</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400">Продажа</span>
                                <span class="text-2xl font-bold text-red-400">${currency.sell.toFixed(2)} ₽</span>
                            </div>
                        </div>
                    `;
                } else {
                    card.innerHTML = `
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <img src="https://flagcdn.com/w40/${currency.flag}.png" alt="${currency.code}" class="w-10 h-8 rounded shadow-sm" />
                                <div>
                                    <h3 class="text-2xl font-bold">${getCurrencyDisplayCode(currency)}</h3>
                                    <p class="text-xs text-gray-500">${currency.name}</p>
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
                        </div>
                    `;
                }
                
                grid.appendChild(card);
            });
        };
        
        renderCurrencies();
    }, 500); 
}

function getCurrencyDisplayCode(currency) {
    if (currency.name.includes('белый') || currency.name.includes('синий')) {
        return 'USD';
    }
    return currency.code;
}

function setupCalculator() {
    updateCurrencySelects();
    calculateExchange();
}

function updateCurrencySelects() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    if (!fromSelect || !toSelect) return;
    
    const currentFrom = fromSelect.value;
    const currentTo = toSelect.value;
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    currencies.forEach(currency => {
        const optionFrom = document.createElement('option');
        optionFrom.value = currency.code;
        optionFrom.textContent = `${getCurrencyDisplayCode(currency)} - ${currency.name}`;
        if (currency.code === currentFrom) optionFrom.selected = true;
        
        const optionTo = document.createElement('option');
        optionTo.value = currency.code;
        optionTo.textContent = `${getCurrencyDisplayCode(currency)} - ${currency.name}`;
        if (currency.code === currentTo) optionTo.selected = true;
        
        fromSelect.appendChild(optionFrom);
        toSelect.appendChild(optionTo);
    });
    
    if (!currentFrom) {
        const rubOption = fromSelect.querySelector('option[value="RUB"]');
        if (rubOption) rubOption.selected = true;
    }
    
    if (!currentTo) {
        const usdOption = toSelect.querySelector('option[value="USD_BLUE"]');
        if (usdOption) usdOption.selected = true;
    }
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

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing...");

    loadCurrencies();
    
    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = document.querySelectorAll('[data-target]');
                    counters.forEach(counter => animateCounter(counter));
                    observer.disconnect();
                }
            });
        });
        observer.observe(statsSection);
    }
    
    const fromAmount = document.getElementById('fromAmount');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    
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

    toAmount.textContent = result.toFixed(2) + ' ' + getCurrencyDisplayCode(currencies.find(c => c.code === to));
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
window.scrollToTop = scrollToTop;
window.calculateExchange = calculateExchange;
