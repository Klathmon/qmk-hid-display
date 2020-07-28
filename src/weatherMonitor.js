const fetch = require("node-fetch");

const { title } = require("./util");


/**
 * Get the current weather
 * @return {object}
 */
async function getWeather() {
    // Regex's for reading out the weather info from the yahoo page
    const tempRegex = /"temperature":({[^}]+})/;
    const condRegex = /"conditionDescription":"([^"]+)"/;
    const rainRegex = /"precipitationProbability":([^,]+),/;

    const url = `https://www.yahoo.com/news/weather/united-states/st-augustine/st-augustine-12771497`;
    try {
        const res = await fetch(url);
        const body = await res.text();

        const weather = {};
        const temp = tempRegex.exec(body);
        weather.temp = JSON.parse(temp[1]);

        const cond = condRegex.exec(body);
        weather.desc = cond[1];

        const rain = rainRegex.exec(body);
        weather.rain = rain[1];

        return weather;
    } catch (err) {
        throw (err);
    }
}

/**
 * Create a screen using the stock weather
 * @param {string} description
 * @param {object} weather
 * @param {string} weather.desc
 * @param {string} weather.rain
 * @param {string} weather.desc
 * @param {object} weather.temp
 * @return {string}
 */
function formatScreen(description, weather) {
    return [
        `desc: ${ description }${ " ".repeat(Math.max(0, 9 - ("" + description).length)) } |  ${ title(0, 2) }`,
        `temp: ${ weather.temp.now }${ " ".repeat(Math.max(0, 9 - ("" + weather.temp.now).length)) } |  ${ title(1, 2) }`,
        `high: ${ weather.temp.high }${ " ".repeat(Math.max(0, 9 - ("" + weather.temp.high).length)) } |  ${ title(2, 2) }`,
        `rain: ${ weather.rain }%${ " ".repeat(Math.max(0, 8 - ("" + weather.rain).length)) } |  ${ title(3, 2) }`,
    ].join(" ");
}

/**
 * Generate an endless stream of screens for the current weather
 */
async function* weatherStream() {
    // Used for scrolling long weather descriptions
    let lastWeather = null;
    let lastWeatherDescIndex = 0;

    while (true) {
        try {
            // Get the current weather
            const weather = await getWeather();
            let description = weather.desc;

            // If we are trying to show the same weather description more than once, and it is
            // longer than 9 (which is all that will fit in our space) lets scroll it.
            if (lastWeather && weather.desc == lastWeather.desc && weather.desc.length > 9) {
                // Move the string one character over
                lastWeatherDescIndex++;
                description = description.slice(lastWeatherDescIndex, lastWeatherDescIndex + 9);
                if (lastWeatherDescIndex > weather.desc.length - 9) {
                    // Restart back at the beginning
                    lastWeatherDescIndex = -1; // minus one since we increment before we show
                }
            } else {
                lastWeatherDescIndex = 0;
            }
            lastWeather = weather;

            // Create the new screen
            const screen = formatScreen(description, weather);

            yield screen;
        } catch (err) {
            // do nothing
        }
    }
}

module.exports = {
    getWeather,
    formatScreen,
    stream: weatherStream,
};
