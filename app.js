/**
 * CARFAX REPORT CLIENT PORTAL — APPLICATION LOGIC
 * Чистий, адаптивний клієнтський інтерфейс без зайвих технічних налаштувань.
 */

(function () {
    'use strict';

    // --- Стан додатку ---
    const state = {
        apiUrl: '',
        apiKey: '',
        vin: '',
        lang: 'uk',
        saveKey: true,
        quota: null,
        isGenerating: false,
        generatedBlobUrl: null,
        generatedBlobSize: 0,
        serverOnline: false
    };

    // --- Елементи DOM ---
    const elements = {
        // Статус підключення
        serverStatusBadge: document.getElementById('serverStatusBadge'),
        serverStatusText: document.getElementById('serverStatusText'),

        // Поле 1: API-ключ
        apiKeyInput: document.getElementById('apiKeyInput'),
        toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
        eyeIcon: document.getElementById('eyeIcon'),
        checkQuotaBtn: document.getElementById('checkQuotaBtn'),
        keyStatusIndicator: document.getElementById('keyStatusIndicator'),
        saveKeyCheckbox: document.getElementById('saveKeyCheckbox'),
        clearKeyBtn: document.getElementById('clearKeyBtn'),

        // Панель статистики та лімітів
        quotaContainer: document.getElementById('quotaContainer'),
        quotaDescription: document.getElementById('quotaDescription'),
        quotaStatusBadge: document.getElementById('quotaStatusBadge'),
        refreshQuotaBtn: document.getElementById('refreshQuotaBtn'),
        metricBalance: document.getElementById('metricBalance'),
        metricDailyRemaining: document.getElementById('metricDailyRemaining'),
        metricDailySubtext: document.getElementById('metricDailySubtext'),
        metricDailyUsed: document.getElementById('metricDailyUsed'),
        metricTotalUsed: document.getElementById('metricTotalUsed'),
        progressPercentage: document.getElementById('progressPercentage'),
        progressBarFill: document.getElementById('progressBarFill'),

        // Поле 2: VIN номер
        vinInput: document.getElementById('vinInput'),
        vinCounter: document.getElementById('vinCounter'),
        pasteVinBtn: document.getElementById('pasteVinBtn'),
        clearVinBtn: document.getElementById('clearVinBtn'),
        vinValidationMessage: document.getElementById('vinValidationMessage'),

        // Поле 3: Мова звіту
        langOptions: document.querySelectorAll('.lang-option'),

        // Кнопка та прогрес генерації
        generateReportBtn: document.getElementById('generateReportBtn'),
        generateBtnText: document.getElementById('generateBtnText'),
        generationLoader: document.getElementById('generationLoader'),
        loaderTitle: document.getElementById('loaderTitle'),
        loaderSubtitle: document.getElementById('loaderSubtitle'),
        steps: [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4')
        ],

        // Результат
        resultContainer: document.getElementById('resultContainer'),
        resultSubtitle: document.getElementById('resultSubtitle'),
        resultVin: document.getElementById('resultVin'),
        resultLang: document.getElementById('resultLang'),
        resultSize: document.getElementById('resultSize'),
        resultFilename: document.getElementById('resultFilename'),
        downloadPdfLink: document.getElementById('downloadPdfLink'),
        previewPdfBtn: document.getElementById('previewPdfBtn'),
        resetFormBtn: document.getElementById('resetFormBtn'),

        // Повідомлення про помилки
        errorContainer: document.getElementById('errorContainer'),
        errorTitle: document.getElementById('errorTitle'),
        errorMessage: document.getElementById('errorMessage'),
        errorHelp: document.getElementById('errorHelp'),
        closeErrorBtn: document.getElementById('closeErrorBtn'),

        // Сповіщення (Toasts)
        toastContainer: document.getElementById('toastContainer')
    };

    // --- Ініціалізація ---
    function init() {
        // Отримуємо адресу API з конфігурації
        state.apiUrl = cleanUrl((window.APP_CONFIG && window.APP_CONFIG.API_SERVER_URL) || 'http://209.50.240.101:5000');

        // Відновлюємо збережений ключ
        const savedKey = localStorage.getItem('carfax_api_key');
        if (savedKey) {
            state.apiKey = savedKey.trim();
            elements.apiKeyInput.value = state.apiKey;
            elements.saveKeyCheckbox.checked = true;
        }

        // Відновлюємо збережену мову або мову за замовчуванням
        const savedLang = localStorage.getItem('carfax_lang') || (window.APP_CONFIG && window.APP_CONFIG.DEFAULT_LANGUAGE) || 'uk';
        setLanguage(savedLang);

        // Підключаємо обробники подій
        attachEventListeners();

        // Перевіряємо статус доступності сервісу
        pingServerStatus();

        // Якщо ключ уже введений, автоматично підтягуємо ліміти
        if (state.apiKey && window.APP_CONFIG && window.APP_CONFIG.AUTO_CHECK_QUOTA) {
            checkQuota(false);
        }
    }

    function cleanUrl(url) {
        if (!url) return '';
        let trimmed = url.trim();
        while (trimmed.endsWith('/')) {
            trimmed = trimmed.slice(0, -1);
        }
        return trimmed;
    }

    // --- Спливаючі сповіщення (Toast) ---
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // --- Підключення обробників подій ---
    function attachEventListeners() {
        // Перемикач видимості ключа (👁️)
        elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
            const isPassword = elements.apiKeyInput.type === 'password';
            elements.apiKeyInput.type = isPassword ? 'text' : 'password';
            elements.eyeIcon.textContent = isPassword ? '🙈' : '👁️';
        });

        // Введення API-ключа
        elements.apiKeyInput.addEventListener('input', (e) => {
            state.apiKey = e.target.value.trim();
            if (elements.saveKeyCheckbox.checked) {
                if (state.apiKey) localStorage.setItem('carfax_api_key', state.apiKey);
                else localStorage.removeItem('carfax_api_key');
            }
            elements.keyStatusIndicator.textContent = '';
        });

        elements.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkQuota(true);
            }
        });

        elements.saveKeyCheckbox.addEventListener('change', (e) => {
            if (e.target.checked && state.apiKey) {
                localStorage.setItem('carfax_api_key', state.apiKey);
                showToast("Ключ збережено в браузері", 'success');
            } else {
                localStorage.removeItem('carfax_api_key');
                showToast("Ключ видалено зі збережених", 'info');
            }
        });

        elements.clearKeyBtn.addEventListener('click', () => {
            elements.apiKeyInput.value = '';
            state.apiKey = '';
            localStorage.removeItem('carfax_api_key');
            elements.quotaContainer.classList.add('hidden');
            elements.keyStatusIndicator.textContent = '';
            showToast('Поле ключа очищено', 'info');
        });

        // Кнопки перевірки та оновлення лімітів
        elements.checkQuotaBtn.addEventListener('click', () => checkQuota(true));
        elements.refreshQuotaBtn.addEventListener('click', () => {
            elements.refreshQuotaBtn.classList.add('refreshing');
            checkQuota(true).finally(() => {
                setTimeout(() => elements.refreshQuotaBtn.classList.remove('refreshing'), 600);
            });
        });

        // Введення та валідація VIN-номера
        elements.vinInput.addEventListener('input', handleVinInput);
        elements.vinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !state.isGenerating) {
                e.preventDefault();
                generateReport();
            }
        });

        elements.clearVinBtn.addEventListener('click', () => {
            elements.vinInput.value = '';
            handleVinInput();
            elements.vinInput.focus();
        });

        elements.pasteVinBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    elements.vinInput.value = text.trim();
                    handleVinInput();
                    showToast('VIN вставлено з буфера', 'info');
                }
            } catch {
                elements.vinInput.focus();
                showToast('Натисніть Ctrl+V для вставки', 'info');
            }
        });

        // Вибір мови
        elements.langOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) {
                    setLanguage(radio.value);
                }
            });
        });

        // Генерація звіту
        elements.generateReportBtn.addEventListener('click', generateReport);

        // Перегляд та скидання форми
        elements.previewPdfBtn.addEventListener('click', () => {
            if (state.generatedBlobUrl) {
                window.open(state.generatedBlobUrl, '_blank');
            }
        });

        elements.resetFormBtn.addEventListener('click', () => {
            elements.resultContainer.classList.add('hidden');
            elements.vinInput.value = '';
            handleVinInput();
            elements.vinInput.focus();
        });

        elements.closeErrorBtn.addEventListener('click', hideError);
    }

    // --- Валідація VIN-коду (стандарт ISO 3779) ---
    function handleVinInput() {
        let raw = elements.vinInput.value;
        let cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (cleaned !== raw) {
            elements.vinInput.value = cleaned;
        }

        state.vin = cleaned;
        const len = cleaned.length;
        elements.vinCounter.textContent = `${len} / 17`;

        if (len === 17) {
            elements.vinCounter.classList.add('counter-valid');
        } else {
            elements.vinCounter.classList.remove('counter-valid');
        }

        // Перевірка заборонених символів (I, O, Q)
        const forbiddenMatches = cleaned.match(/[IOQ]/g);
        if (forbiddenMatches) {
            const unique = [...new Set(forbiddenMatches)].join(', ');
            showVinValidation(`Заборонені літери у VIN: ${unique} (у VIN не використовуються I, O, Q)`, 'error');
            return false;
        }

        if (len === 0) {
            elements.vinValidationMessage.textContent = '';
            elements.vinValidationMessage.className = 'validation-message';
            return false;
        }

        if (len < 17) {
            showVinValidation(`Залишилось ввести ${17 - len} симв. (VIN містить рівно 17 знаків)`, 'error');
            return false;
        }

        if (len === 17) {
            showVinValidation('✓ Формат VIN коректний (17 знаків)', 'valid');
            return true;
        }

        return false;
    }

    function showVinValidation(msg, type) {
        elements.vinValidationMessage.textContent = msg;
        elements.vinValidationMessage.className = `validation-message ${type}`;
    }

    // --- Перемикання мови звіту ---
    function setLanguage(langCode) {
        state.lang = langCode;
        localStorage.setItem('carfax_lang', langCode);

        elements.langOptions.forEach(opt => {
            const radio = opt.querySelector('input[type="radio"]');
            if (radio && radio.value === langCode) {
                radio.checked = true;
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // --- Перевірка статусу сервера (/api/status) ---
    async function pingServerStatus() {
        updateServerBadge('checking', 'Підключення...');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(`${state.apiUrl}/api/status`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                state.serverOnline = true;
                updateServerBadge('online', 'Сервіс онлайн');
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            console.warn('[Carfax API Status]', err);
            state.serverOnline = false;
            updateServerBadge('offline', 'Сервіс недоступний');
        }
    }

    function updateServerBadge(status, text) {
        elements.serverStatusBadge.className = `status-badge status-${status}`;
        elements.serverStatusText.textContent = text;
    }

    // --- Перевірка статистики та лімітів (GET /api/quota) ---
    async function checkQuota(showToasts = true) {
        if (!state.apiKey) {
            elements.keyStatusIndicator.textContent = '⚠️ Введіть API-ключ';
            elements.keyStatusIndicator.className = 'key-status-text key-status-invalid';
            if (showToasts) showToast('Будь ласка, введіть API-ключ', 'error');
            elements.apiKeyInput.focus();
            return;
        }

        hideError();
        elements.keyStatusIndicator.textContent = 'Перевірка...';
        elements.keyStatusIndicator.className = 'key-status-text';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(`${state.apiUrl}/api/quota`, {
                method: 'GET',
                headers: {
                    'X-API-Key': state.apiKey,
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.status === 401) {
                elements.keyStatusIndicator.textContent = '✗ Недійсний ключ';
                elements.keyStatusIndicator.className = 'key-status-text key-status-invalid';
                elements.quotaContainer.classList.add('hidden');
                showError('Помилка авторизації (401)', 'Вказаний API-ключ недійсний або не існує. Будь ласка, перевірте правильність ключа.');
                return;
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Помилка ${res.status}`);
            }

            const data = await res.json();
            state.quota = data;

            elements.keyStatusIndicator.textContent = '✓ Ключ активний';
            elements.keyStatusIndicator.className = 'key-status-text key-status-valid';

            renderQuotaData(data);
            elements.quotaContainer.classList.remove('hidden');

            if (showToasts) {
                showToast('Ліміти та баланс оновлено', 'success');
            }

        } catch (err) {
            elements.keyStatusIndicator.textContent = '✗ Помилка перевірки';
            elements.keyStatusIndicator.className = 'key-status-text key-status-invalid';
            showError('Помилка з\'єднання', err.message || 'Не вдалося зв\'язатися з сервером перевірки.');
        }
    }

    function renderQuotaData(data) {
        // Опис ключа
        elements.quotaDescription.textContent = data.description || `Ключ: ${data.masked_key || 'Активний'}`;

        // Загальний баланс
        if (data.is_balance_set && data.balance !== null && data.balance !== undefined) {
            elements.metricBalance.textContent = data.balance;
        } else {
            elements.metricBalance.textContent = '∞';
        }

        // Залишок на сьогодні та денний ліміт
        if (data.is_daily_limit_set && data.daily_limit !== null) {
            elements.metricDailyRemaining.textContent = data.daily_remaining !== null ? data.daily_remaining : '—';
            elements.metricDailySubtext.textContent = `з денного ліміту ${data.daily_limit} / день`;
        } else {
            elements.metricDailyRemaining.textContent = '∞';
            elements.metricDailySubtext.textContent = 'денний ліміт необмежений';
        }

        // Використано сьогодні
        elements.metricDailyUsed.textContent = data.daily_used ?? 0;

        // Всього згенеровано
        elements.metricTotalUsed.textContent = data.total_used ?? 0;

        // Статус бейдж
        if (data.is_limit_reached) {
            elements.quotaStatusBadge.textContent = 'Вичерпано';
            elements.quotaStatusBadge.className = 'badge badge-danger';
        } else if (data.daily_remaining !== null && data.daily_remaining <= 3) {
            elements.quotaStatusBadge.textContent = 'Залишилось мало';
            elements.quotaStatusBadge.className = 'badge badge-warning';
        } else {
            elements.quotaStatusBadge.textContent = 'Активний';
            elements.quotaStatusBadge.className = 'badge badge-active';
        }

        // Прогрес-бар денного ліміту
        if (data.is_daily_limit_set && data.daily_limit > 0) {
            const used = data.daily_used || 0;
            const limit = data.daily_limit;
            const pct = Math.min(100, Math.round((used / limit) * 100));

            elements.progressPercentage.textContent = `${pct}% (${used} з ${limit})`;
            elements.progressBarFill.style.width = `${pct}%`;

            if (pct >= 100) {
                elements.progressBarFill.className = 'progress-bar-fill bar-exhausted';
            } else if (pct >= 80) {
                elements.progressBarFill.className = 'progress-bar-fill bar-warning';
            } else {
                elements.progressBarFill.className = 'progress-bar-fill';
            }
        } else {
            elements.progressPercentage.textContent = 'Без обмежень';
            elements.progressBarFill.style.width = '100%';
            elements.progressBarFill.className = 'progress-bar-fill';
        }
    }

    // --- Генерація звіту (GET /api/carfax) ---
    async function generateReport() {
        if (state.isGenerating) return;

        hideError();
        elements.resultContainer.classList.add('hidden');

        // Перевірка API ключа
        if (!state.apiKey) {
            showError('Потрібен API-ключ', 'Будь ласка, вкажіть ваш персональний API-ключ у полі №1.');
            elements.apiKeyInput.focus();
            return;
        }

        // Перевірка VIN
        if (!state.vin || state.vin.length !== 17) {
            showError('Некоректний VIN-номер', 'VIN-номер автомобіля має містити рівно 17 символів (стандарт ISO 3779).');
            elements.vinInput.focus();
            return;
        }

        setGeneratingState(true);
        startStepAnimation();

        const vin = state.vin;
        const lang = state.lang;
        const url = `${state.apiUrl}/api/carfax?vin=${encodeURIComponent(vin)}&lang=${encodeURIComponent(lang)}`;

        try {
            const controller = new AbortController();
            const timeoutMs = (window.APP_CONFIG && window.APP_CONFIG.GENERATION_TIMEOUT_MS) || 120000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-Key': state.apiKey
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorJson = null;
                try {
                    errorJson = await response.json();
                } catch {
                    errorJson = {};
                }

                if (response.status === 400) {
                    throw new Error(errorJson.error || 'Невалідний VIN-номер або помилка в базі Carfax.');
                } else if (response.status === 401) {
                    throw new Error('Недійсний API-ключ. Перевірте правильність ключа.');
                } else if (response.status === 429) {
                    const reason = errorJson.reason === 'balance_exhausted' 
                        ? 'Вичерпано загальний баланс звітів для вашого ключа.' 
                        : `Вичерпано денний ліміт звітів (${errorJson.daily_used || 'макс.'} на сьогодні). Ліміт відновиться завтра о 00:00.`;
                    throw new Error(reason);
                } else {
                    throw new Error(errorJson.error || `Помилка формування звіту (HTTP ${response.status}).`);
                }
            }

            // Отримуємо бінарний PDF
            const blob = await response.blob();
            const fileSizeKb = Math.round(blob.size / 1024);
            const fileName = `Carfax_${vin}.pdf`;

            if (state.generatedBlobUrl) {
                URL.revokeObjectURL(state.generatedBlobUrl);
            }
            state.generatedBlobUrl = URL.createObjectURL(blob);
            state.generatedBlobSize = blob.size;

            elements.resultVin.textContent = vin;
            elements.resultLang.textContent = getLanguageLabel(lang);
            elements.resultSize.textContent = `${fileSizeKb} КБ`;
            elements.resultFilename.textContent = fileName;

            elements.downloadPdfLink.href = state.generatedBlobUrl;
            elements.downloadPdfLink.download = fileName;

            completeAllSteps();

            setTimeout(() => {
                setGeneratingState(false);
                elements.resultContainer.classList.remove('hidden');
                elements.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                showToast(`Звіт для ${vin} готовий!`, 'success');

                if (window.APP_CONFIG && window.APP_CONFIG.AUTO_DOWNLOAD_PDF) {
                    elements.downloadPdfLink.click();
                }

                // Оновлюємо залишок балансу
                checkQuota(false);
            }, 500);

        } catch (err) {
            setGeneratingState(false);
            showError('Помилка генерації звіту', err.message || 'Не вдалося сформувати звіт Carfax.');
        }
    }

    function getLanguageLabel(lang) {
        const map = {
            uk: 'Українська (uk)',
            en: 'English (en)',
            de: 'Deutsch (de)',
            es: 'Español (es)',
            fr: 'Français (fr)',
            pl: 'Polski (pl)',
            ro: 'Română (ro)',
            ar: 'العربية (ar)',
            fa: 'فارسی (fa)',
            ru: 'Русский (ru)'
        };
        return map[lang] || lang;
    }

    // --- Анімація кроків генерації ---
    let stepInterval = null;

    function setGeneratingState(isGen) {
        state.isGenerating = isGen;
        elements.generateReportBtn.disabled = isGen;

        if (isGen) {
            elements.generateBtnText.textContent = 'Звіт формується, зачекайте...';
            elements.generationLoader.classList.remove('hidden');
        } else {
            elements.generateBtnText.textContent = 'Сформувати та завантажити звіт Carfax (PDF)';
            elements.generationLoader.classList.add('hidden');
            if (stepInterval) clearInterval(stepInterval);
        }
    }

    function startStepAnimation() {
        elements.steps.forEach((s, idx) => {
            s.className = idx === 0 ? 'step-item step-active' : 'step-item';
        });

        elements.loaderTitle.textContent = 'Підключення до сервісу...';
        elements.loaderSubtitle.textContent = 'Перевірка API-ключа та черги запитів';

        let currentStep = 0;
        const subtitles = [
            { title: 'Підключення до сервісу...', sub: 'Перевірка API-ключа та черги запитів' },
            { title: 'Пошук автомобіля в базі Carfax...', sub: 'Завантаження офіційної картки транспортного засобу' },
            { title: 'Переклад та обробка звіту...', sub: 'Локалізація обраною мовою та очищення документа' },
            { title: 'Створення PDF-документа...', sub: 'Рендеринг високої чіткості та стиснення' }
        ];

        stepInterval = setInterval(() => {
            if (currentStep < 3) {
                elements.steps[currentStep].className = 'step-item step-done';
                currentStep++;
                elements.steps[currentStep].className = 'step-item step-active';
                elements.loaderTitle.textContent = subtitles[currentStep].title;
                elements.loaderSubtitle.textContent = subtitles[currentStep].sub;
            }
        }, 7000);
    }

    function completeAllSteps() {
        if (stepInterval) clearInterval(stepInterval);
        elements.steps.forEach(s => s.className = 'step-item step-done');
        elements.loaderTitle.textContent = 'Готово!';
        elements.loaderSubtitle.textContent = 'PDF файл сформовано та завантажується';
    }

    // --- Відображення помилок ---
    function showError(title, message) {
        elements.errorTitle.textContent = title;
        elements.errorMessage.textContent = message;
        elements.errorHelp.innerHTML = '';
        elements.errorContainer.classList.remove('hidden');
        elements.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideError() {
        elements.errorContainer.classList.add('hidden');
    }

    // --- Запуск ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
