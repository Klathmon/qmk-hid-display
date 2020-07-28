const test = require("tape");

const {
    formatScreen,
    getPrice,
    getStocks,
} = require("../src/stockMonitor");


test("get stock price", async function (t) {
    {
        const symbol = "msft";

        const msg = "returns a stock price";
        const actual = await getPrice(symbol);

        t.match(actual, /\d+\.\d{2,3}/, msg);
    }

    t.end();
});

test("update stock map", async function (t) {
    {
        const stocks = new Map();
        stocks.set("msft", 0);
        stocks.set("aapl", 0);

        const msg = "updates stock price map in place";
        await getStocks(stocks);
        // const expected = {};

        // t.deepEqual(actual, expected, msg);
        let actual = stocks.get("msft");
        t.match(actual, /\d+\.\d{2,3}/, msg);
        actual = stocks.get("aapl");
        t.match(actual, /\d+\.\d{2,3}/, msg);
    }

    t.end();
});
