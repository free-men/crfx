/**
 * Конфігурація клієнтського порталу звітів Carfax
 */
window.APP_CONFIG = {
    // Постійна офіційна адреса вашого API сервера із захищеним SSL-сертифікатом:
    API_SERVER_URL: "https://api.carfx.pp.ua",

    // Мова за замовчуванням (uk | en | pl | ro | ru)
    DEFAULT_LANGUAGE: "uk",

    // Автоматично перевіряти ліміти при введенні збереженого API ключа
    AUTO_CHECK_QUOTA: true,

    // Автоматично завантажувати згенерований PDF
    AUTO_DOWNLOAD_PDF: true,

    // Таймаут очікування генерації звіту (у мілісекундах, 120 сек)
    GENERATION_TIMEOUT_MS: 120000
};
