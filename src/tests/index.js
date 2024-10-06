#!/usr/bin/node
const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));
const { Logger } = require(path.resolve("src/lib/utils/logger"));
const log = new Logger('Main::Testing', false).setLevel(999).setLocation(path.resolve("logs/srbg-tests.log")).create()

class Tests {
    constructor(AUTO_LOG_TIME = false) {
        this.AUTO_LOG_TIME = AUTO_LOG_TIME;
        this.times = {};
    }

    time(tag, note = null) {
        this.times[tag] = {
            start: { time: process.hrtime(), note: note },
            end: { time: null, note: null },
            duration: 'running'
        };
    }

    endTime(tag, note = null) {
        let timetag = this.times[tag];
        if (!timetag) {
            console.log(`Não há um marcador "${tag}" para ser cronometrado.`);
            return undefined;
        };
        let diff = process.hrtime(timetag.start.time); // [0] = segundos, [1] = nanosegundos
        let stringifiedTime

        // atualizando this.times
        timetag.end = { time: process.hrtime(), note: note };
        timetag.duration = { seconds: diff[0], milliseconds: parseFloat((diff[1] / 1e6).toFixed(3)), nanoseconds: diff[1] };

        // definindo a mensagem de retorno
        if (timetag.duration.seconds > 0) {
            stringifiedTime = `${timetag.duration.seconds} s, ${timetag.duration.milliseconds} ms`;
        } else {
            stringifiedTime = `${timetag.duration.milliseconds} ms`;
        }

        if (this.AUTO_LOG_TIME) {
            console.log(`${tag}: ${stringifiedTime}`);
        }

        return stringifiedTime;
    }

    getAllTimes() {
        return this.times;
    }

    getTime(tag) {
        return this.times[tag].duration
    }

}

class SolsTests {
    constructor() {
        this.tests = {};
    }

    Screenshot = {

        // Open SolsRNG and DON'T click the play button. Call this function and check what it screenshots
        PlayButton: async () => {
            const _FUNCTION = "Screenshot:PlayButton";

            // position
            log.info(`${_FUNCTION} - STEP 1: Getting play button position...`);
            const PLAY_BUTTON = await Roblox.getPlayButtonPosition();
            log.info(`${_FUNCTION} - STEP 1: Result: ${JSON.stringify(PLAY_BUTTON)}`);

            // screenshot buffer
            log.info(`${_FUNCTION} - STEP 2: Taking screenshot of play button...`);
            const BUFFER_PLAY_BUTTON_SCREENSHOT = await System.CoordinateToRawBuffer(PLAY_BUTTON.position);
            // log.info(`${_FUNCTION}: Play button screenshot buffer: ${BUFFER_PLAY_BUTTON_SCREENSHOT.buffer}`);

            // saving
            const OUTPUT_FILE = path.resolve("src/tests/images/tests_screenshot_playbutton.png");
            log.info(`${_FUNCTION} - STEP 3: Saving screenshot to ${OUTPUT_FILE}`);
            await System.SaveRawBufferToFile(BUFFER_PLAY_BUTTON_SCREENSHOT, OUTPUT_FILE);
        },

        // should screenshot the expected biome area
        Biome: async () => {
            const _FUNCTION = "Screenshot:Biome";

            // screenshot buffer (already has position-box in it)
            log.info(`${_FUNCTION} - STEP 1: Taking screenshot of biome area...`);
            const BUFFER_BIOME_SCREENSHOT = await Biomes.getBiomeAsRawBuffer(CONFIGURATION.biomes.Unknown.position);

            // saving
            const OUTPUT_FILE = path.resolve("src/tests/images/tests_screenshot_currentbiome.png");
            log.info(`${_FUNCTION} - STEP 2: Saving screenshot to ${OUTPUT_FILE}`);
            await System.SaveRawBufferToFile(BUFFER_BIOME_SCREENSHOT, OUTPUT_FILE);
        },
    }

    Hover = {

        // Should mouse hover on the play button
        // RobotJS can't move your mouse if it's outside your primary monitor. So make sure you only call this function when your mouse is inside your primary monitor.
        PlayButton: async () => {
            const _FUNCTION = "Hover:PlayButton";

            // position
            log.info(`${_FUNCTION} - STEP 1: Getting play button position...`);
            const PLAY_BUTTON = await Roblox.getPlayButtonPosition();
            log.info(`${_FUNCTION} - STEP 1: Result: ${JSON.stringify(PLAY_BUTTON)}`);

            log.info(`${_FUNCTION} - STEP 2: Hovering over play button...`);
            await Roblox.Click(PLAY_BUTTON.center.x, PLAY_BUTTON.center.y, { TYPE: 'absolute', CLICK: false, SLOW: true });
        },

        // should mouse hover on the auto roll click point
        AutoRoll: async () => {
            const _FUNCTION = "Hover:AutoRoll";

            // obtaining click point
            log.info(`${_FUNCTION} - STEP 1: Getting auto roll button position...`);
            const AUTO_ROLL_CLICK_POINT = await Roblox.getAutoRollButtonPosition();

            // hovering to it
            log.info(`${_FUNCTION} - STEP 2: Hovering over auto roll button (${AUTO_ROLL_CLICK_POINT.x}r%, ${AUTO_ROLL_CLICK_POINT.y}r%)...`);
            await Roblox.Click(AUTO_ROLL_CLICK_POINT.x, AUTO_ROLL_CLICK_POINT.y, { TYPE: 'relative_percent', CLICK: false, SLOW: true });
        },

        // should mouse hover on the chat toggle button
        Chat: async () => {
            const _FUNCTION = "Hover:Chat";

            // obtaining click point
            log.info(`${_FUNCTION} - STEP 1: Getting chat button position...`);
            const CHAT_BUTTON_CLICK_POINT = await Roblox.getChatButtonPosition();

            // hovering to it
            log.info(`${_FUNCTION} - STEP 2: Hovering over chat button (${CHAT_BUTTON_CLICK_POINT.x}r, ${CHAT_BUTTON_CLICK_POINT.y}r)...`);
            await Roblox.Click(CHAT_BUTTON_CLICK_POINT.x, CHAT_BUTTON_CLICK_POINT.y, { TYPE: 'relative', CLICK: false, SLOW: true });
        },

        // should mouse hover on the N'th menu button
        // remember, the script assumes you are in your private server! private server adds 1 more menu to the sidebar, so it can mess with the menu numbering/aligment
        SideMenu: async (num) => {
            const _FUNCTION = "Hover:SideMenu";

            // obtaining menu position
            log.info(`${_FUNCTION} - STEP 1: Getting menu button position for menu ${num}...`);
            const { x, y } = Roblox.getMenuButtonPosition(num);

            // hovering to it
            log.info(`${_FUNCTION} - STEP 2: Hovering over menu button (${num}) (${x}a, ${y}a)...`);
            await Roblox.Click(x, y, { TYPE: 'absolute', CLICK: false, SLOW: true });
        },

        // should mouse hover on the close collection click point. theres a general method to open sidemenu buttons if you want to actually open the collection instead
        CloseCollection: async () => {
            const _FUNCTION = "Hover:CloseCollection";

            // obtaining click point
            log.info(`${_FUNCTION} - STEP 1: Getting close collection button position...`);
            const CLOSE_COLLECTION_CLICK_POINT = await Roblox.getCloseCollectionButtonPosition();

            // hovering to it
            log.info(`${_FUNCTION} - STEP 2: Hovering over close collection button (${CLOSE_COLLECTION_CLICK_POINT.x}r%, ${CLOSE_COLLECTION_CLICK_POINT.y}r%)...`);
            await Roblox.Click(CLOSE_COLLECTION_CLICK_POINT.x, CLOSE_COLLECTION_CLICK_POINT.y, { TYPE: 'relative_percent', CLICK: false, SLOW: true });
        },
    }

    CompleteRoutine = {
        Roblox: {

            // should call the method that brings roblox to the top
            bringToTop: () => {
                const _FUNCTION = "CompleteRoutine:RobloxWindow:bringToTop";
            },

            // should call the method that opens roblox
            open: (join_private_server = false) => {
                const _FUNCTION = "CompleteRoutine:RobloxWindow:open";
            },

            // should call the method that closes roblox
            close: () => {
                const _FUNCTION = "CompleteRoutine:RobloxWindow:close";
            },

            // should list every window with the same search parameters the app uses
            listWindows: () => {
                const _FUNCTION = "CompleteRoutine:RobloxWindow:listWindows";
            }
        },

        AllSideMenus: async () => {
            const _FUNCTION = "CompleteRoutine:AllSideMenus";
            log.debug(`--- ${_FUNCTION}: TEST STARTED ---`);

            // simplificando a lógica acima um loop
            const menus = [1, 2, 3, 4, 5, 6, 7, 8];
            for (const n of menus) {
                this.Hover.SideMenu(n);
                log.info(`${_FUNCTION} - ON MENU ${n}`);
                System.sleep(2000);
            }

            log.debug(`--- ${_FUNCTION}: TEST FINISHED ---`);
        },

        PlayButton: async () => {
            const _FUNCTION = "CompleteRoutine:PlayButton";
            log.debug(`--- ${_FUNCTION}: TEST STARTED ---`);

            log.info(`${_FUNCTION} - STEP 1: DOING SCREENSHOT PLAYBUTTON TEST...`);
            await this.Screenshot.PlayButton();
            log.info(`${_FUNCTION} - STEP 1: DONE`);

            log.info(`${_FUNCTION} - STEP 2: DOING HOVER PLAYBUTTON TEST...`);
            await this.Hover.PlayButton();
            log.info(`${_FUNCTION} - STEP 2: DONE`);

            log.debug(`--- ${_FUNCTION}: TEST FINISHED ---`);
        },

        // should execute a single server roll
        SimulateServerRoll: async () => {
            const _FUNCTION = "CompleteRoutine:SimulateServerRoll";
            const INTERVAL_BETWEEN_STEPS = 3000;

            log.warn(`--- ${_FUNCTION}: TEST STARTED ---`);

            // screenshot playbutton
            log.warn(`${_FUNCTION} - STEP 1: TAKING SCREENSHOT OF PLAYBUTTON...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Screenshot.PlayButton();

            // hover playbutton
            log.warn(`${_FUNCTION} - STEP 2: HOVERING OVER PLAYBUTTON...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Hover.PlayButton();

            // click playbutton
            // -- automation to be implemented --
            log.warn(`${_FUNCTION} - STEP 3: --- PLEASE, CLICK ON THE PLAY BUTTON. WAITING 10 SECONDS...`);
            System.sleep(10000);

            // wait like 5 seconds so black menu fades out
            log.warn(`${_FUNCTION} - STEP 4: WAITING POSSIBLE MENU FADE OUT...`);
            System.sleep(5000);

            // screenshot biome
            log.warn(`${_FUNCTION} - STEP 5: TAKING SCREENSHOT OF BIOME...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Screenshot.Biome();

            // identify current biome
            log.warn(`${_FUNCTION} - STEP 6: IDENTIFYING CURRENT BIOME...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.CompleteRoutine.IdentifyCurrentBiome();

            // hover  auto roll
            log.warn(`${_FUNCTION} - STEP 7: HOVERING OVER AUTO ROLL...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Hover.AutoRoll();

            // hover chat
            log.warn(`${_FUNCTION} - STEP 8: HOVERING OVER CHAT...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Hover.Chat();

            // hover menus 1-8
            log.warn(`${_FUNCTION} - STEP 9: HOVERING OVER MENUS 1-8...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.CompleteRoutine.AllSideMenus();

            // click collection
            log.warn(`${_FUNCTION} - STEP 10: --- PLEASE, CLICK ON THE COLLECTON MENU. WAITING 10 SECONDS...`);
            System.sleep(10000);
            // -- to be implemented --

            // hover close collection
            log.warn(`${_FUNCTION} - STEP 11: HOVERING OVER CLOSE COLLECTION...`);
            System.sleep(INTERVAL_BETWEEN_STEPS);
            await this.Hover.CloseCollection();

            log.warn(`--- ${_FUNCTION}: TEST FINISHED ---`);
        },

        // should identify the current biome, and save it's screenshot
        IdentifyCurrentBiome: async () => {
            const _FUNCTION = "CompleteRoutine:IdentifyCurrentBiome";
            log.debug(`--- ${_FUNCTION}: TEST STARTED ---`);

            // screenshot buffer (already has position-box in it)
            log.info(`${_FUNCTION} - STEP 1: Taking screenshot of biome area...`);
            const BUFFER_BIOME_SCREENSHOT = await Biomes.getBiomeAsRawBuffer(CONFIGURATION.biomes.Unknown.position);

            // applying filters
            log.info(`${_FUNCTION} - STEP ´2: Processing image for better ocr accuracy...`);
            const BUFFER_PROCESSED_BIOME_SCREENSHOT = await Biomes.prepareBufferForOCR(BUFFER_BIOME_SCREENSHOT, { STRENGTH: 1 });

            // saving
            const OUTPUT_FILE = path.resolve("src/tests/images/tests_completeroutine_identifycurrentbiome.png");
            log.info(`${_FUNCTION} - STEP 3: Saving screenshot to ${OUTPUT_FILE}`);
            await System.SaveRawBufferToFile(BUFFER_PROCESSED_BIOME_SCREENSHOT, OUTPUT_FILE);

            // reading
            log.info(`${_FUNCTION} - STEP 4: Reading image...`);
            const RAW_OCR_RESULT = await System.OCRfromRawBuffer(BUFFER_PROCESSED_BIOME_SCREENSHOT);
            log.info(`${_FUNCTION} - STEP 4: Result: ${JSON.stringify(RAW_OCR_RESULT.text.replace(/\n/g, ''))}`);

            // mapping to a valid biome
            log.info(`${_FUNCTION} - STEP 5: Mapping OCR result to a valid biome...`);
            const DEFAULT_BIOME_MAPPING_THRESHOLD = 0.7;
            const IDENTIFIED_BIOME = await Biomes.identifyBiome(RAW_OCR_RESULT.text, { CONFIDENCE_THRESHOLD: DEFAULT_BIOME_MAPPING_THRESHOLD });
            log.info(`${_FUNCTION} - STEP 5: Result: ${JSON.stringify(IDENTIFIED_BIOME)}`);


            log.debug(`--- ${_FUNCTION}: TEST FINISHED ---`);
        },
        test_two: () => {
            const _FUNCTION = "CompleteRoutine:test_two";
        },
    }
}

// testing is not implemented yet, but it will be soon!

module.exports = {
    Tests,
    SolsTests: new SolsTests(),
}
