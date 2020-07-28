const os = require("os-utils");
const batteryLevel = require("battery-level");
const loudness = require("loudness");

const { title } = require("./util");


// the node-audio-windows version is much faster on windows, but loudness handles other os's better,
// so let's get the best of both worlds
let winAudio;
try {
    winAudio = require("node-audio-windows").volume;
} catch (err) {
    // do nothing
}

/**
 * Get the system volume
 */
async function getVolume() {
    return os.platform() === "win32" ? winAudio.getVolume() * 100 : await loudness.getVolume();
}

/**
 * Get OS performance statistics
 * @return {array}
 */
async function getPerf() {
    return await Promise.all([
        new Promise((resolve) => os.cpuUsage((usage) => resolve(usage * 100))),
        100 - (os.freememPercentage() * 100),
        getVolume(),
        (await batteryLevel()) * 100,
    ]);
}

/**
 * @param {array} perfStats
 * @return {string}
 */
function formatScreen( perfStats) {
    console.log(perfStats);
    const maxTitleSize = Math.max(...perfStats.map(([header]) => header.length));
    const barGraphSize = 21 - maxTitleSize - 3;

    // Set this to be the latest performance info
    return perfStats.map(([header, percent], index) => {
        const numBlackTiles = barGraphSize * (percent / 100);
        return `${ header } ${ "\u0008".repeat(Math.ceil(numBlackTiles)) }${ " ".repeat(barGraphSize - numBlackTiles) }|${ title(index, 0) }`;
    }).join("");
}

/**
 * Generate an endless stream of screens for the system performance metrics
 */
async function* perfStream() {
    while (true) {
        const [
            cpuUsagePercent,
            usedMemoryPercent,
            volumeLevelPercent,
            batteryPercent,
        ] = await getPerf();

        const perfStats = [
            ["CPU:", cpuUsagePercent],
            ["RAM:", usedMemoryPercent],
            ["VOL:", volumeLevelPercent],
            ["BAT:", batteryPercent],
        ];

        yield formatScreen(
                // cpuUsagePercent,
                // usedMemoryPercent,
                // volumeLevelPercent,
                // batteryPercent,
                perfStats,
        );
    }
}

module.exports = {
    getPerf,
    getVolume,
    formatScreen,
    stream: perfStream,
};
