const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));
const { Tests } = require(path.resolve("src/tests"));
const { Logger } = require( path.resolve("src/lib/utils/logger") );
const log = new Logger('Main::ServerRoll', false).setLevel(999).setLocation(path.resolve("logs/srbg.log")).create()
const Timer = new Tests();

(async () => {
    let i = 0 // current server roll (how many servers we created)
    let max_reconnects = CONFIGURATION.general.MAX_RECONNECTS; // how many times we can try to fix something by rejoining before stopping the macro
    let count_reconnects = 0;
    let max_unknown_biome_fails = CONFIGURATION.general.MAX_UNKNOWN_FAILS; // how many times Biomes.HandleBiome() can fail to detect before stopping the macro
    let count_fail_unknown_biome = 0;

    async function ServerRoll() {
        // first, lets validate if we exceeded any threshold that would make us stop the macro
        if (count_fail_unknown_biome >= max_unknown_biome_fails) {
            log.error('[Server #${i}] Failed to detect biome ' + count_fail_unknown_biome + ' times. stopping macro.')
            throw new Error('Failed to detect biome ' + count_fail_unknown_biome + ' times. stopping macro.')
        }
        if (count_reconnects >= max_reconnects) {
            log.error('[Server #${i}] We had too many reconnects (' + count_reconnects + '). stopping macro.')
            throw new Error('We had too many reconnects (' + count_reconnects + '). Stopping, because something may be wrong.')
        }

        i++
        Timer.time(`server-roll-${i}`)

        log.info(`[Server #${i}] Joining server...`);
        await Roblox.JoinPrivateServer({ FORCE: true, AUTOCORRECT_WINDOW: true }) // this will close your game if its open, and join the configured private server. it will also move the window to the center of your primary monitor
        await Roblox.bringToTop({ MAXIMIZE: true }) // brings window to the front, and maximizes it

        log.info(`[Server #${i}] Checking if we're waiting for a server...`);
        await System.sleep(1000 * 4) // wait a little for game to open, else the check below will falsely pass through
        await Roblox.CheckIfWaitingServer(); // waits until "Waiting for an available server..." is gone. // fails instantaneously if max_iterations or timeout is reached, no reconnects!

        // maybe check if "Fetching data..."? :: UPDATE: no.

        log.info(`[Server #${i}] Waiting for play button...`);
        await Roblox.WaitForPlayButton({ TIMEOUT: 1000 * 15, MAX_ITERATIONS: 15 })
        // TODO(adrian): this can fail. if it does (button never showed up) we should try to rejoin while incrementing a fail counter

        // align the camera to the wall-location so we get a better background for biome detection
        log.info(`[Server #${i}] Aligning camera...`);
        await Roblox.AlignCamera();

        // the screen is probably still fading from back, just wait a bit more before starting biome detection, else we will get a lot of "Unknown"s
        await System.sleep(1000 * 2)

        // detect the actual biome. if it fails (detects unknown 5 times in a row) we try another server
        log.info(`[Server #${i}] Detecting biome...`);
        const biome_result = await Biomes.HandleBiome();
        if (!biome_result.success) {
            count_fail_unknown_biome++;
            log.warn(`[Server #${i}] Failed to detect biome. Total fails: ${count_fail_unknown_biome}. Changing server...`);
            Timer.endTime(`server-roll-${i}`)
            ServerRoll();
        }

        Timer.endTime(`server-roll-${i}`)
        log.info(`[Server #${i}] Total time spent: ${Timer.getTime(`server-roll-${i}`).seconds}s | Biome: ${biome_result.detected.biome} (${biome_result.detected.confidence})`)
        ServerRoll(); // repeat
    }

    ServerRoll()
})();