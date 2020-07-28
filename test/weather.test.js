const test = require("tape");

const {
    getWeather,
    formatScreen,
} = require("../src/weatherMonitor");


test("get weather", async (t) => {
    const actual = await getWeather();
    {
        const msg = "weather field names match";
        const expected = ["desc", "temp", "rain"].sort();
        t.deepEqual(Object.getOwnPropertyNames(actual).sort(), expected, msg);
    }

    {
        const msg = "temp field names match";
        const expected = ["feelsLike", "high", "low", "now"].sort();
        t.deepEqual(Object.getOwnPropertyNames(actual.temp).sort(), expected, msg);
    }

    {
        const msg = "expected field values exist";
        actual.desc = !!actual.desc;
        actual.temp = !!actual.temp;
        actual.rain = !!actual.rain;
        const expected = {
            desc: true,
            temp: true,
            rain: true,
        };
        t.deepEqual(actual, expected, msg);
    }

    t.end();
});
