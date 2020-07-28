const test = require("tape");

const {
    formatScreen,
    getPerf,
    getVolume,
} = require("../src/perfMonitor");


test("get perf stats", async (t) => {
    {
        const actual = await getPerf();

        t.equal(Array.isArray(actual), true, "should return an array");
        t.equal(actual.length, 4, "should return an array with len 4");
    }

    t.end();
});

test("get os volume", async (t) => {
    {
        const msg = "should return only digits";
        const actual = await getVolume();
        const expected = /\d{1,3}/;

        t.match(actual+"", expected, msg);
    }

    t.end();
});
