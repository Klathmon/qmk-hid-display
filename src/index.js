#!/usr/bin/env node
"use strict";

const hid = require("node-hid");
const os = require("os-utils");

const { wait } = require("./util");
const perfStream = require("./perfMonitor").stream;
const weatherStream = require("./weatherMonitor").stream;
const stockStream = require("./stockMonitor").stream;


// Keyboard info
const KEYBOARD_NAME = "Lily58";
const KEYBOARD_USAGE_ID = 0x61;
const KEYBOARD_USAGE_PAGE = 0xFF60;
const KEYBOARD_UPDATE_TIME = 1000;

const STOCK_SYMBOLS = [
    "MSFT",
    "TSLA",
    "GOOG",
    "FB",
];

// Info screen types
const monitors = [
    perfStream(),
    stockStream(STOCK_SYMBOLS),
    weatherStream(),
];
let screens = new Array(monitors.length);
let currentScreenIndex = 0;

let keyboard = null;
let screenBuffer = null;
let screenLastUpdate = null;

/**
 * Send screen data to the keyboard
 * @param {string} screen
 */
async function sendToKeyboard(screen) {
    // If we are already buffering a screen to the keyboard just quit early.
    // Or if there is no update from what we sent last time.
    if (screenBuffer || screenLastUpdate === screen) {
        return;
    }

    screenLastUpdate = screen;

    // Convert the screen string into raw bytes
    screenBuffer = [];
    for (let i = 0; i < screen.length; i++) {
        screenBuffer.push(screen.charCodeAt(i));
    }

    // Split the bytes into 4 lines that we will send one at a time
    // This is to prevent hitting the 32 length limit on the connection
    const lines = [];
    lines.push([0].concat(screenBuffer.slice(0, 21)));
    lines.push([0].concat(screenBuffer.slice(21, 42)));
    lines.push([0].concat(screenBuffer.slice(42, 63)));
    lines.push([0].concat(screenBuffer.slice(63, 84)));

    // Loop through and send each line after a small delay to allow the
    // keyboard to store it ready to send to the slave side once full.
    for (const line of lines) {
        if (os.platform() === "darwin") {
            await wait(100);
        }
        keyboard.write(line);
        if (os.platform() === "darwin") {
            await wait(100);
        } else {
            await wait(20);
        }
    }

    // We have sent the screen data, so clear it ready for the next one
    screenBuffer = null;
}

/**
 * Update the keyboard display
 */
function updateKeyboardScreen() {
    // If we don't have a connection to a keyboard yet, look now
    if (!keyboard) {
        // Search all devices for a matching keyboard
        const devices = hid.devices();
        for (const d of devices) {
            if (d.product === KEYBOARD_NAME &&
                d.usage === KEYBOARD_USAGE_ID &&
                d.usagePage === KEYBOARD_USAGE_PAGE) {
                // Create a new connection and store it as the keyboard
                keyboard = new hid.HID(d.path);
                console.log(`Keyboard connection established.`);

                // Listen for data from the keyboard which indicates the screen to show
                keyboard.on("data", (e) => {
                    // Check that the data is a valid screen index and update the current one
                    if (e[0] >= 1 && e[0] <= screens.length) {
                        currentScreenIndex = e[0] - 1;
                        console.log(`Keyboard requested screen index: ${ currentScreenIndex }`);
                    }
                });

                // On the initial connection write our special sequence
                // 1st byte - unused and thrown away on windows see bug in node-hid
                // 2nd byte - 1 to indicate a new connection
                // 3rd byte - number of screens the keyboard can scroll through
                keyboard.write([0, 1, screens.length]);
                break;
            }
        }
    }

    // If we have a connection to a keyboard and a valid screen
    if (keyboard && screens[currentScreenIndex].length === 84) {
        // Send that data to the keyboard
        sendToKeyboard(screens[currentScreenIndex]);
    }
}

/**
 * Update screens buffer with the latest data from each monitor
 */
async function updateScreens() {
    screens = (await Promise.all(monitors.map((stream) => stream.next())))
            .map((screen) => screen.value);
}

/**
 * Update monitor data and send the current screen to the keyboard
 */
function run() {
    updateScreens.then(() => updateKeyboardScreen());
}

// Update the data on the keyboard with the current info screen every second
setInterval(run, KEYBOARD_UPDATE_TIME);
