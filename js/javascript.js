
const currencies = [
    { code: 'USD_WHITE', flag: 'us', name: 'Доллар США (белый)', buy: 95.5, sell: 97.8, showRates: true },
    { code: 'USD_BLUE', flag: 'us', name: 'Доллар США (синий)', buy: 94.0, sell: 96.5, showRates: true },
    { code: 'EUR', flag: 'eu', name: 'Евро', buy: 105.2, sell: 107.9, showRates: true },
    { code: 'GBP', flag: 'gb', name: 'Фунт стерлингов', buy: 0, sell: 0, showRates: false },
    { code: 'CNY', flag: 'cn', name: 'Китайский юань', buy: 0, sell: 0, showRates: false },
    { code: 'RUB', flag: 'ru', name: 'Российский рубль', buy: 1, sell: 1, showRates: true }
];

const grid = document.getElementById('currencyGrid');
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

observer.observe(document.getElementById('statsSection'));

const fromAmount = document.getElementById('fromAmount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const toAmount = document.getElementById('toAmount');

function calculateExchange() {
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

fromAmount.addEventListener('input', calculateExchange);
fromCurrency.addEventListener('change', calculateExchange);
toCurrency.addEventListener('change', calculateExchange);
calculateExchange();

function openQuickOrder() {
    const modal = document.getElementById('quickOrderModal');
    modal.classList.add('show');
}

function closeQuickOrder() {
    const modal = document.getElementById('quickOrderModal');
    modal.classList.remove('show');
}

function submitOrder() {
    alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
    closeQuickOrder();
}

window.onclick = function(event) {
    const modal = document.getElementById('quickOrderModal');
    if (event.target === modal) {
    closeQuickOrder();
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const toggle = document.getElementById('themeToggle');
const toggleBg = document.getElementById('toggleBg');
const toggleCircle = document.getElementById('toggleCircle');
const darkLabel = document.getElementById('darkLabel');
const lightLabel = document.getElementById('lightLabel');

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

    document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
        el.classList.remove('bg-gray-800', 'border-gray-700', 'text-gray-100');
        el.classList.add('bg-white', 'border-gray-300', 'text-gray-900');
    });
    toAmount.classList.remove('bg-gray-900', 'border-gray-700', 'text-teal-400');
    toAmount.classList.add('bg-gray-100', 'border-gray-300', 'text-teal-600');

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

    document.getElementById('advantages').classList.replace('bg-gray-900/50', 'bg-gray-50');
    document.getElementById('partners').classList.replace('bg-gray-900/50', 'bg-gray-50');
    
    document.querySelectorAll('#advantages .bg-gray-900, #partners .bg-gray-900').forEach(el => {
        el.classList.replace('bg-gray-900', 'bg-white');
        el.classList.replace('border-gray-800', 'border-gray-200');
        el.classList.replace('hover:border-teal-400', 'hover:border-teal-600');
    });
    
    document.querySelectorAll('#advantages h2, #partners h2, #advantages h3, #partners h3').forEach(el => {
        el.classList.replace('text-gray-100', 'text-gray-900');
    });
    
    document.querySelectorAll('#advantages p, #partners p').forEach(el => {
        if (!el.classList.contains('text-teal-400')) {
            el.classList.replace('text-gray-400', 'text-gray-600');
        }
    });
    } else {
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

    document.querySelectorAll('#calculator select, #calculator input').forEach(el => {
        el.classList.remove('bg-white', 'border-gray-300', 'text-gray-900');
        el.classList.add('bg-gray-800', 'border-gray-700', 'text-gray-100');
    });
    toAmount.classList.remove('bg-gray-100', 'border-gray-300', 'text-teal-600');
    toAmount.classList.add('bg-gray-900', 'border-gray-700', 'text-teal-400');

    document.getElementById('advantages').classList.replace('bg-gray-50', 'bg-gray-900/50');
    document.getElementById('partners').classList.replace('bg-gray-50', 'bg-gray-900/50');
    
    document.querySelectorAll('#advantages .bg-white, #partners .bg-white').forEach(el => {
        el.classList.replace('bg-white', 'bg-gray-900');
        el.classList.replace('border-gray-200', 'border-gray-800');
        el.classList.replace('hover:border-teal-600', 'hover:border-teal-400');
    });
    
    document.querySelectorAll('#advantages h2, #partners h2, #advantages h3, #partners h3').forEach(el => {
        el.classList.replace('text-gray-900', 'text-gray-100');
    });
    
    document.querySelectorAll('#advantages p, #partners p').forEach(el => {
        if (!el.classList.contains('text-teal-400')) {
            el.classList.replace('text-gray-600', 'text-gray-400');
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