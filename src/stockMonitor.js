const fetch = require("node-fetch");

const { title } = require("./util");


/**
 * Get the price of a single stock symbol from yahoo
 * @param {string} symbol
 * @return {number}
 */
async function getPrice(symbol) {
    // The regex used to grab the price from the yahoo stocks page
    const priceRegex = /"currentPrice":({[^}]+})/;

    try {
        // Get the stock price page for the current stock
        const url = `https://finance.yahoo.com/quote/${ symbol }/`;
        const res = await fetch(url);
        const body = await res.text();

        // parse the price
        const result = priceRegex.exec(body);
        const price = JSON.parse(result[1]).raw;
        return price.toFixed(2);
    } catch (e) {
        throw (e);
    }
}

/**
 * Update the prices for a map of stock symbol -> price
 * MUTATES the map passed in
 * @param {Map} stocks
 */
async function getStocks(stocks) {
    const promises = [];
    for (const key of stocks.keys()) {
        promises.push(new Promise((resolve, reject) => {
            getPrice(key).then((price) => {
                stocks.set(key, price);
                resolve();
            })
                    .catch(reject);
        }));
    }

    // Wait for all the stocks to be updated
    await Promise.all(promises);
}

/**
 * Create a screen using the stock data
 * @param {Map} stocks
 * @return {string}
 */
function formatScreen(stocks) {
    const lines = [];
    for (const [key, value] of stocks) {
        const line = `${ key.padEnd(5) }: $${ value }`;
        lines.push(`${ line }${ " ".repeat(16 - line.length) }|  ${ title(lines.length, 1) } `);
    }

    // Set this to be the latest stock info
    return lines.join("");
}

/**
 * Generate an endless stream of screens for the provided stock symbols
 * @param {string[]} symbols
 */
async function* stockStream(symbols) {
    let counter = 0;

    // Set the stocks that we want to show
    const stocks = new Map();
    for (const symbol of symbols) {
        stocks.set(symbol, 0);
    }

    while (true) {
        if (counter % 10 === 0) {
            await getStocks(stocks);
            counter = 0;
        }
        counter++;

        yield formatScreen(stocks);
    }
}

module.exports = {
    getPrice,
    getStocks,
    formatScreen,
    stream: stockStream,
};
