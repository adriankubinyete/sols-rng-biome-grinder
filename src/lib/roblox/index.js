const path = require("path");
const { System } = require(path.resolve("src/lib/system"));
const nwm = require("node-window-manager");
const windowManager = {
  // this is so dumb
  ...nwm.addon,
  ...nwm.windowManager,
};

const TEMPORARY_PRIVATE_URL =
  "https://www.roblox.com/games/15532962292?privateServerLinkCode=48477360821955658485761705534051";

// should have code related to roblox process
// get roblox window size
// join server
// confirm join
// leave server
// confirm leave

class RobloxNotOpen extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class Roblox {
  constructor(debug = true) {
    this.debug = debug;
    this.robloxProcessId = undefined;
    this.privateServerLink = undefined;
    this.ROBLOX_EXECUTABLE_NAME = "RobloxPlayerBeta.exe";
    this.WAIT_AFTER_DISCONNECT = 2000; // 2 seconds

    this._getPrivateLink(); // prepares private link from env
  }

  _waitDisconnectInterval() {
    // you can't join IMMEDIATELY after you leave a server
    // otherwise roblox says "login detected from another device"
    // PS: im not sure the exact wait time needed. lets just assume 2 seconds for now
    const _FUNCTION = "Roblox:_waitDisconnectInterval";

    if (this.debug) {
      console.log(`${_FUNCTION}: Waiting ${this.WAIT_AFTER_DISCONNECT}ms`);
    }

    System.sleep(this.WAIT_AFTER_DISCONNECT);
  }

  _getPrivateLink() {
    const _FUNCTION = "Roblox:_getPrivateLink";

    if (this.privateServerLink) return this.privateServerLink;

    const PVT_SERVER = process.env.PRIVATE_SERVER ?? TEMPORARY_PRIVATE_URL; // could move down, useless but verbose :)
    const privateServerUrl = new URL(PVT_SERVER);
    const privateServerCode = privateServerUrl.searchParams.get(
      "privateServerLinkCode"
    );
    const privateServerLink =
      "roblox://placeID=15532962292&linkCode=" + privateServerCode; // could move down, useless but verbose :)
    this.privateServerLink = privateServerLink;
    // console.log(`${_FUNCTION}: ${this.privateServerLink}`);

    return;
  }

  Window(report = false) {
    const windows = windowManager.getWindows();
    const robloxWindow = windows.find((window) =>
      window.path.includes(this.ROBLOX_EXECUTABLE_NAME)
    );
    // If everything goes right, we're expecting to see "RobloxPlayerBeta.exe" at the end of executable path of this window
    // path: 'C:\\Users\\<USER>\\AppData\\Local\\Roblox\\Versions\\version-b591875ddfbc4294\\RobloxPlayerBeta.exe'

    if (!robloxWindow) {
      throw new RobloxNotOpen("Could not find the Roblox process.");
    }

    if (report) {
      console.log(`Roblox window found: ${JSON.stringify(robloxWindow)}`);
    }

    return robloxWindow;
  }

  ProcessId() {
    const robloxWindow = this.Window();

    return robloxWindow.processId;
  }

  Position() {
    const robloxWindow = this.Window();
    const robloxBounds = robloxWindow.getBounds();

    return robloxBounds;
  }

  isFullscreen() {
    const _FUNCTION = "Roblox:isFullscreen";

    // get roblox width and height
    const robloxPos = this.Position();

    // get primary monitor workable width and height (excluding taskbar)
    const primaryMonitorId = windowManager.getPrimaryMonitor().id;
    const primaryMonitorWorkArea =
      windowManager.getMonitorInfo(primaryMonitorId).workArea;

    // check if roblox area is greater than work area, meaning we are in full screen
    // (or youre dumb and made your game bigger than your screen somehow)
    const robloxIsFullscreen =
      robloxPos.width >= primaryMonitorWorkArea.width &&
      robloxPos.height >= primaryMonitorWorkArea.height;

    if (this.debug) {
      console.log(
        `${_FUNCTION}: Roblox area               : [${robloxPos.width},${robloxPos.height}] `
      );
      console.log(
        `${_FUNCTION}: Primary monitor work area : [${primaryMonitorWorkArea.width},${primaryMonitorWorkArea.height}]`
      );
      console.log(
        `${_FUNCTION}: Roblox is fullscreen?     : ${robloxIsFullscreen}`
      );
    }

    return robloxIsFullscreen;

    return;
  }

  isMinimized() {
    const robloxPos = this.Position();

    // NOTE: In theory you could set the bastard to this exact position, but I'll assume no one has a monitor this big. My bad if you do!
    return robloxPos.x === -32000 && robloxPos.y === -32000;
  }

  isOpen() {
    try {
      this.Window(); // be aware that the game could be on closing process... (i.e: you clicked X button, it clears the window but takes a while to remove the process)
    } catch (err) {
      if (!err instanceof RobloxNotOpen) {
        throw err;
      } // its not the error we expected, throw miserably
      return false; // roblox is not open
    }
    return true; // roblox is open
  }

  async JoinPrivateServer(config = { force: false }) {
    const _FUNCTION = "Roblox:JoinPrivateServer";

    if (this.isOpen()) {
      if (!config.force) {
        throw new Error("Roblox is already open");
      }

      // config.force is true, so we're gonna force you to join the private server
      console.log(`${_FUNCTION}: Forcing join private server`);
      await this.Close();
    }

    if (config.force && this.isOpen()) {
      console.log(`${_FUNCTION}: Roblox is already open`);
      console.log(`${_FUNCTION}: Forcing join private server`);
      await this.Close();
    }

    await System.StartUrl(this.privateServerLink);

    // only return once the roblox window is open
    while (!this.isOpen()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.debug) {
      console.log(`${_FUNCTION}: Joined private server!`);
    }

    return;
  }

  async Close() {
    const _FUNCTION = "Roblox:Close";

    const robloxProcessId = this.ProcessId();
    await System.Taskkill(robloxProcessId);

    // only return when the roblox window is closed
    while (this.isOpen()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.debug) {
      console.log(`${_FUNCTION}: Closed Roblox (Process: ${robloxProcessId})`);
    }

    this._waitDisconnectInterval(); // read this function to understand why its here, dont want to repeat myself
    return;
  }
  
}

module.exports = {
  Roblox: new Roblox(),
};
