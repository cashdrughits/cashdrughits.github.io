const apiUrl = "https://api.oper-kassa.online/api/rates";
let currencies = [];

function fetchWithTimeout(url, options = {}, timeoutMs = 180000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
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

    try {
        await loadCurrenciesFromMongo();
        return;
    } catch (error) {
        console.warn("MongoDB Atlas load failed:", error);
    }

    try {
        await loadCurrenciesFromCBR();
        return;
    } catch (error) {
        console.warn("CBR load failed:", error);
    }

    console.warn("Mongo и CBR не доступны. Загружаем локальный JSON...");
    try {
        await loadStaticJsonCurrencies();
        return;
    } catch {
        console.warn("Локальный JSON не найден!!!");
    }
}

async function loadCurrenciesFromMongo() {
    try {
        const response = await fetchWithTimeout(
            apiUrl,
            { method: 'GET', headers: { 'Accept': 'application/json' } },
            180000
        );
        if (!response.ok) throw new Error("API response not ok");
        const data = await response.json();
        currencies = data.currencies;
        console.log("Currencies loaded from Mongo API:", currencies);
        displayCurrencies();
        setupCalculator();
    } catch (error) {
        console.error("Error loading from Mongo API:", error);
        throw error;
    }
}

async function loadCurrenciesFromCBR() {
    try {
        const response = await fetchWithTimeout(
            'https://www.cbr-xml-daily.ru/daily_json.js',
            { method: 'GET', mode: 'cors', headers: { 'Accept': 'application/json' } },
            30000
        );

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

async function loadStaticJsonCurrencies() {
    const response = await fetch('./js/currencies.json');
    if (!response.ok) throw new Error("Local JSON not found");

    const data = await response.json();
    currencies = data.currencies;

    console.log("✅ Currencies loaded from local JSON");

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

        filteredCurrencies.forEach((currency) => {
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
    }, 500);
}

function getCurrencyDisplayCode(currency) {
    if (!currency) return '';
    if (currency.name && (currency.name.includes('белый') || currency.name.includes('синий'))) {
        return 'USD';
    }
    return currency.code;
}

function setupCalculator() {
    updateCurrencySelect();
    calculateExchange();
}

function updateCurrencySelect() {
    const select = document.getElementById('foreignCurrency');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '';

    const foreign = currencies.filter(c => c.code !== 'RUB');

    foreign.forEach(currency => {
        const opt = document.createElement('option');
        opt.value = currency.code;
        opt.textContent = `${getCurrencyDisplayCode(currency)} — ${currency.name}`;
        if (currency.code === currentVal) opt.selected = true;
        select.appendChild(opt);
    });

    // По умолчанию USD_BLUE
    if (!currentVal) {
        const defaultOpt = select.querySelector('option[value="USD_BLUE"]') || select.querySelector('option');
        if (defaultOpt) defaultOpt.selected = true;
    }
}

function calculateExchange() {
    const amountInput    = document.getElementById('foreignAmount');
    const currencySelect = document.getElementById('foreignCurrency');
    const resultLabel    = document.getElementById('calcResultLabel');
    const resultAmount   = document.getElementById('calcResultAmount');
    const rateInfo       = document.getElementById('calcRateInfo');

    if (!amountInput || !currencySelect || !resultLabel || !resultAmount || !rateInfo) return;

    const amount = parseFloat(amountInput.value) || 0;
    const code   = currencySelect.value;
    const mode   = document.getElementById('calcModeToggle')?.dataset.mode || 'buy';

    const currencyData = currencies.find(c => c.code === code);
    if (!currencyData) return;

    const displayCode = getCurrencyDisplayCode(currencyData);

    if (amount === 0) {
        resultAmount.textContent = '—';
        rateInfo.textContent     = '';
        return;
    }

    if (mode === 'buy') {
        // Клиент покупает → обменник продаёт по курсу sell
        const rate   = currencyData.sell || 0;
        const rubSum = amount * rate;

        resultLabel.textContent  = 'Вы отдаёте:';
        resultAmount.textContent = formatRub(rubSum);
        rateInfo.textContent     = `Курс: ${rate.toFixed(2)} ₽ за 1 ${displayCode}`;
    } else {
        // Клиент продаёт → обменник покупает по курсу buy
        const rate   = currencyData.buy || 0;
        const rubSum = amount * rate;

        resultLabel.textContent  = 'Вы получаете:';
        resultAmount.textContent = formatRub(rubSum);
        rateInfo.textContent     = `Курс: ${rate.toFixed(2)} ₽ за 1 ${displayCode}`;
    }
}

function formatRub(amount) {
    return amount.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';
}

function animateCounter(element) {
    const target   = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;

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


document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM loaded, initializing...");

    loadCurrencies();

    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = document.querySelectorAll('[data-target]');
                    counters.forEach(counter => animateCounter(counter));
                    statsObserver.disconnect();
                }
            });
        });
        statsObserver.observe(statsSection);
    }

    const foreignAmount   = document.getElementById('foreignAmount');
    const foreignCurrency = document.getElementById('foreignCurrency');

    if (foreignAmount)   foreignAmount.addEventListener('input', calculateExchange);
    if (foreignCurrency) foreignCurrency.addEventListener('change', calculateExchange);

    const calcModeBuy    = document.getElementById('calcModeBuy');
    const calcModeSell   = document.getElementById('calcModeSell');
    const calcModeToggle = document.getElementById('calcModeToggle');

    if (calcModeBuy && calcModeSell && calcModeToggle) {
        calcModeBuy.addEventListener('click', () => {
            calcModeToggle.dataset.mode = 'buy';
            calcModeBuy.classList.add('bg-teal-500', 'text-black', 'shadow-md');
            calcModeBuy.classList.remove('text-gray-400', 'hover:text-gray-200');
            calcModeSell.classList.remove('bg-teal-500', 'text-black', 'shadow-md');
            calcModeSell.classList.add('text-gray-400', 'hover:text-gray-200');
            calculateExchange();
        });

        calcModeSell.addEventListener('click', () => {
            calcModeToggle.dataset.mode = 'sell';
            calcModeSell.classList.add('bg-teal-500', 'text-black', 'shadow-md');
            calcModeSell.classList.remove('text-gray-400', 'hover:text-gray-200');
            calcModeBuy.classList.remove('bg-teal-500', 'text-black', 'shadow-md');
            calcModeBuy.classList.add('text-gray-400', 'hover:text-gray-200');
            calculateExchange();
        });
    }
});

const toggle       = document.getElementById('themeToggle');
const toggleBg     = document.getElementById('toggleBg');
const toggleCircle = document.getElementById('toggleCircle');
const darkLabel    = document.getElementById('darkLabel');
const lightLabel   = document.getElementById('lightLabel');

if (toggle && toggleBg && toggleCircle) {
    toggle.addEventListener('change', () => {
        const body           = document.getElementById('body');
        const navbar         = document.getElementById('navbar');
        const heroSection    = document.getElementById('heroSection');
        const contactCard    = document.getElementById('contactCard');
        const calculatorCard = document.getElementById('calculatorCard');
        const footer         = document.getElementById('footer');
        const cards          = document.querySelectorAll('.currency-card');
        const statsSection   = document.getElementById('statsSection');

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

            const advantages = document.getElementById('advantages');
            const partners   = document.getElementById('partners');
            if (advantages) advantages.classList.replace('bg-gray-900/50', 'bg-gray-50');
            if (partners)   partners.classList.replace('bg-gray-900/50', 'bg-gray-50');

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

            document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
                el.classList.remove('bg-gray-800', 'border-gray-700', 'text-gray-100');
                el.classList.add('bg-white', 'border-gray-300', 'text-gray-900');
            });

            const calcResultBox = document.getElementById('calcResultBox');
            if (calcResultBox) {
                calcResultBox.classList.remove('bg-gray-900/60', 'border-gray-700');
                calcResultBox.classList.add('bg-gray-100', 'border-gray-300');
            }

            const calcModeToggle = document.getElementById('calcModeToggle');
            if (calcModeToggle) {
                calcModeToggle.classList.replace('bg-gray-800', 'bg-gray-200');
            }
            document.querySelectorAll('#calcModeToggle button').forEach(btn => {
                if (!btn.classList.contains('bg-teal-500')) {
                    btn.classList.remove('text-gray-400', 'hover:text-gray-200');
                    btn.classList.add('text-gray-500', 'hover:text-gray-700');
                }
            });

            cards.forEach(c => {
                c.classList.replace('bg-gray-900', 'bg-white');
                c.classList.replace('border-gray-800', 'border-gray-200');
                c.classList.replace('hover:border-teal-400', 'hover:border-teal-600');
            });

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
            // Тёмная тема
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

            const advantages = document.getElementById('advantages');
            const partners   = document.getElementById('partners');
            if (advantages) advantages.classList.replace('bg-gray-50', 'bg-gray-900/50');
            if (partners)   partners.classList.replace('bg-gray-50', 'bg-gray-900/50');

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

            document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
                el.classList.remove('bg-white', 'border-gray-300', 'text-gray-900');
                el.classList.add('bg-gray-800', 'border-gray-700', 'text-gray-100');
            });

            const calcResultBox = document.getElementById('calcResultBox');
            if (calcResultBox) {
                calcResultBox.classList.remove('bg-gray-100', 'border-gray-300');
                calcResultBox.classList.add('bg-gray-900/60', 'border-gray-700');
            }

            const calcModeToggle = document.getElementById('calcModeToggle');
            if (calcModeToggle) {
                calcModeToggle.classList.replace('bg-gray-200', 'bg-gray-800');
            }
            document.querySelectorAll('#calcModeToggle button').forEach(btn => {
                if (!btn.classList.contains('bg-teal-500')) {
                    btn.classList.remove('text-gray-500', 'hover:text-gray-700');
                    btn.classList.add('text-gray-400', 'hover:text-gray-200');
                }
            });

            cards.forEach(c => {
                c.classList.replace('bg-white', 'bg-gray-900');
                c.classList.replace('border-gray-200', 'border-gray-800');
                c.classList.replace('hover:border-teal-600', 'hover:border-teal-400');
            });

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

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
