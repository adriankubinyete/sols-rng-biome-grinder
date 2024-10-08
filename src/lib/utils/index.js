function getCurrentTimeFormatted() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // HH:mm:ss
    return `${hours}:${minutes}:${seconds}`;
};

module.exports = {
    getCurrentTimeFormatted
};