/**
 * Конфігурація клієнтського порталу звітів Carfax
 * 
 * Ви можете змінити API_SERVER_URL на вашу зовнішню IP-адресу, домен або Cloudflare tunnel URL.
 * Користувачі також можуть перевизначити цю адресу через меню налаштувань (шестерня у шапці сайту).
 */
window.APP_CONFIG = {
    // Захищена адреса вашого API сервера через Cloudflare HTTPS Tunnel
    // (вирішує блокування Mixed Content на GitHub Pages та приховує реальний IP сервера)
    API_SERVER_URL: "https://boots-bones-indirect-trail.trycloudflare.com",

    // Мова за замовчуванням (uk | en | pl | ro | ru)
    DEFAULT_LANGUAGE: "uk",

    // Автоматично перевіряти ліміти при введенні збереженого API ключа
    AUTO_CHECK_QUOTA: true,

    // Автоматично завантажувати згенерований PDF
    AUTO_DOWNLOAD_PDF: true,

    // Таймаут очікування генерації звіту (у мілісекундах, 120 сек)
    GENERATION_TIMEOUT_MS: 120000
};
