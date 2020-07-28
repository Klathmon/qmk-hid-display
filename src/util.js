/**
 * Helper function to wait a few milliseconds using a promise
 * @param {number} ms
 * @return {Promise}
 */
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Return the character that indicates the title part from the font data
 * @param {number} i
 * @param {number} titleIndex
 * @return {string}
 */
function title(i, titleIndex) {
    if (i === 3) {
        return "\u00DE";
    }
    return String.fromCharCode((0x9A - titleIndex) + i * 32);
}

module.exports = {
    wait,
    title,
};
