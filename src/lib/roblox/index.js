const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { System } = require(path.resolve("src/lib/system"));
const ss = require("string-similarity");
const robot = require("robotjs");
const { Logger } = require(path.resolve("src/lib/utils/logger"));
const log = new Logger('Roblox', false).setLevel(999).setLocation(path.resolve("logs/srbg.log")).create()
const nwm = require("node-window-manager");
const windowManager = {
  // this is so dumb
  ...nwm.addon,
  ...nwm.windowManager,
};

const TEMPORARY_PRIVATE_URL = "https://www.roblox.com/games/15532962292?privateServerLinkCode=48477360821955658485761705534051";
class RobloxError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class OcrExpectationFailed extends RobloxError { constructor(message) { super(message) } } // expects play button, etc
class ApplicationExpectationFailed extends RobloxError { constructor(message) { super(message) } } // expects play button, etc
class WindowManagementFailure extends RobloxError { constructor(message) { super(message) } }


class Roblox {
  constructor(debug = true) {
    this.debug = debug;
    this.robloxProcessId = undefined;
    this.privateServerLink = undefined;
    this.ROBLOX_WINDOW_TITLE = "Roblox";
    this.ROBLOX_EXECUTABLE_NAME = "RobloxPlayerBeta.exe";
    this.WAIT_AFTER_DISCONNECT = 1000 * 5; // 5 seconds

    this._getPrivateLink(); // prepares private link from env
  }

  // ----------------- states -----------------

  // checks if roblox is in full screen or not
  // returns true/false
  isFullscreen() {
    const _FUNCTION = "Roblox:isFullscreen";

    // get roblox width and height
    const robloxPos = this.Position();

    // get primary monitor workable width and height (excluding taskbar)
    const primaryMonitorId = windowManager.getPrimaryMonitor().id;
    const primaryMonitorWorkArea = windowManager.getMonitorInfo(primaryMonitorId).workArea;

    // check if roblox area is greater than work area, meaning we are in full screen
    // (or youre dumb and made your game bigger than your screen somehow)
    const robloxIsFullscreen =
      robloxPos.width >= primaryMonitorWorkArea.width &&
      robloxPos.height >= primaryMonitorWorkArea.height;

    return robloxIsFullscreen;
  }

  // checks if roblox is minimized or not
  // returns true/false
  isMinimized() {
    const robloxPosition = this.Position();

    // pois é... não é através do this.Window().isVisible()... parece que o roblox mantém o serviço em suspensão, e não minimizado de fato
    // PROVAVELMENTE pro jogo continuar rodando de fundo (chutando)
    if (robloxPosition.x === -32000 && robloxPosition.y === -32000) {
      return true;
    }
    return false;

    // return !robloxWindow.isVisible();
  }

  // checks if roblox is open or not
  // returns true/false
  isOpen() {
    // try {
    //   this.Window(); // be aware that the game could be on closing process... (i.e: you clicked X button, it clears the window but takes a while to remove the process)
    // } catch (err) {
    //   if (!err instanceof ApplicationExpectationFailed) {
    //     throw err;
    //   } // its not the error we expected, throw miserably
    //   return false; // roblox is not open
    // }
    // return true; // roblox is open

    const windows = windowManager.getWindows();
    const robloxWindow = windows.find(window =>
      window.path && window.path.includes('Roblox') && window.path.endsWith('.exe')
    );

    // Se uma janela correspondente for encontrada, Roblox ainda está aberto
    return !!robloxWindow; // Retorna true se robloxWindow existe, caso contrário false
  }

  // checks if roblox is on focus or not
  // returns true/false
  isOnFocus() {
    const _FUNCTION = "Roblox:isOnFocus";

    // obtaining roblox's window id
    const robloxWindow = this.Window();
    const robloxWindowId = robloxWindow.id;

    // obtaining the active window's id
    const activeWindow = windowManager.getActiveWindow();
    const activeWindowId = activeWindow.id;

    // checking if roblox is the active window
    if (robloxWindowId === idWindowOnTop) {
      return true;
    }
    return false;
  }

  // only proceeds after roblox closes
  // returns nothing
  waitUntilClosed() {
    const _FUNCTION = "Roblox:waitUntilClosed";

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const isOpen = await this.isRobloxOpen();
        if (!isOpen) {
          clearInterval(interval);
          resolve();
        }
      }, 3000);
    });
  }

  // ----------------- utils -----------------

  // TODO(adrian): find the exact timing
  // called every time we close roblox
  // sleep a bit so roblox dont say 'login detected from another device'
  _waitDisconnectInterval() {
    // you can't join IMMEDIATELY after you leave a server
    // otherwise roblox says "login detected from another device"
    // PS: im not sure the exact wait time needed. lets just assume 2 seconds for now
    const _FUNCTION = "Roblox:_waitDisconnectInterval";
    const DISCONNECT_DELAY_MS = CONFIGURATION.general.WAIT_AFTER_DISCONNECT;

    if (this.debug) {
      log.debug(`${_FUNCTION}: Waiting ${DISCONNECT_DELAY_MS}ms`);
    }

    System.sleep(DISCONNECT_DELAY_MS);
  }

  // sets this.privateServerLink
  // returns nothing
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
    log.trace(`${_FUNCTION}: ${this.privateServerLink}`);

    return;
  }

  // from relative coordinates of roblox, transform them into absolute coordinates
  AbsoluteFromRelativePercent(relativeX, relativeY) {
    const roblox = this.Position();

    const x = Math.floor((relativeX / 100) * roblox.width + roblox.x);
    const y = Math.floor((relativeY / 100) * roblox.height + roblox.y);

    return { x, y };
  }

  AbsoluteFromRelative(relativeX, relativeY) {
    const roblox = this.Position();

    const x = Math.floor(relativeX + roblox.x);
    const y = Math.floor(relativeY + roblox.y);

    return { x, y };
  }

  // just for debug purposes, so i can easily obtain relative coords of things
  // this is an infinitely looping function, please dont call it if you dont know what you're doing
  async MonitorMousePosition() {
    const _FUNCTION = "Roblox:MonitorMousePosition";
    const INTERVAL = 1000;
    let i = 0;

    while (true) {
      i++
      const { x, y, width, height } = this.Position();
      const { x: mouseX, y: mouseY } = System.CurrentMousePosition();

      // calculating relative position of the mouse in relation to roblox window
      const relativeX = ((mouseX - x) / width) * 100;  // % of width
      const relativeY = ((mouseY - y) / height) * 100; // % of height

      // logging to console
      log.trace(`#${i}                 Mouse position :   ${mouseX}, ${mouseY}`);
      log.trace(`#${i}              Relative position :   ${(relativeX / 100) * width}, ${(relativeY / 100) * height}`);
      log.trace(`#${i}             Relative position% :   ${relativeX}, ${relativeY}`);
      log.trace(`#${i} XY-deviation. from rblx center :   ${x + width / 2 - mouseX}, ${y + height / 2 - mouseY}`);
      log.trace(`#${i}                    rblx center :   ${x + width / 2}, ${y + height / 2}`);
      log.trace(`#${i}                       rblx w/h :   ${width}, ${height}`);
      log.trace(`#${i}           estimate square size :   ${this.calculateSquareSize(width, height)}`);

      // waiting INTERVAL before repeating
      System.sleep(INTERVAL)
    }
  }

  calculateSquareSize(width, height) {
    // Constantes
    const k = 12.5;
    const W_base = 816;
    const H_base = 840;

    // Calculando o tamanho do quadrado
    const squareSize = k * (width / W_base + height / H_base);
    return squareSize;
  }

  // ------------------ roblox process/window related -----------------

  // returns roblox window
  // throws RobloxNotOpen if roblox is not open
  Window(config = {}, report = false) {
    // PS: WINDOW METHODS:
    // [
    //   'constructor',        'getBounds',
    //   'setBounds',          'getTitle',
    //   'getMonitor',         'show',
    //   'hide',               'minimize',
    //   'restore',            'maximize',
    //   'bringToTop',         'redraw',
    //   'isWindow',           'isVisible',
    //   'toggleTransparency', 'setOpacity',
    //   'getOpacity',         'getIcon',
    //   'setOwner',           'getOwner'
    // ]

    const _FUNCTION = "Roblox:Window";

    const {
      NOTIFY = config?.NOTIFY || false,
      IGNORE_OOB = config?.IGNORE_OOB || false, // dont throw error if roblox is out of bounds
      AUTOCORRECT = config?.AUTOCORRECT || false, // overrides ignore_oob. if roblox is out of bounds, automatically correct it
    } = config;

    const windows = windowManager.getWindows();

    // Filtra a janela que contém 'RobloxPlayerBeta.exe' no path e tem título 'Roblox'
    const robloxWindow = windows.find((window) =>
      window.path && window.path.includes(this.ROBLOX_EXECUTABLE_NAME) && window.getTitle() === this.ROBLOX_WINDOW_TITLE
    );

    if (!robloxWindow) {
      throw new ApplicationExpectationFailed(`${_FUNCTION}: Roblox is not open`);
    }

    // too granular, almost everything calls this, so i dont want to log it every time
    // would log if there were a level below unit
    // TODO(adrian): make lower ( granularest (??) ) log level
    // log.unit(`${_FUNCTION}: Roblox window found! (WINDOW ID: ${robloxWindow.id}, PROCESS ID: ${robloxWindow.processId})`);

    // checking if roblox is in primary mon
    if (robloxWindow.getMonitor().id !== windowManager.getPrimaryMonitor().id) {

      // corrigindo automaticamente caso o usuário tenha repassado a flag
      if (AUTOCORRECT) {

        // bringing roblox window to the front, from wherever it is
        robloxWindow.restore();
        robloxWindow.bringToTop();

        // moving to center of primary mon
        const primaryMonitorWorkArea = windowManager.getMonitorInfo(windowManager.getPrimaryMonitor().id).workArea;
        robloxWindow.setBounds({
          x: (primaryMonitorWorkArea.width - robloxWindow.getBounds().width) / 2,
          y: (primaryMonitorWorkArea.height - robloxWindow.getBounds().height) / 2,
        });

        log.warn('Roblox window was out of bounds. Moved to primary monitor.');
        return robloxWindow
      }

      // roblox did not autocorrect and is still out of bounds
      if (!IGNORE_OOB) {
        throw new ApplicationExpectationFailed(`${_FUNCTION}: Move Roblox to your primary monitor`);
      }

    }

    // roblox is in primary mon, we can proceed
    return robloxWindow;
  }
  // returns {  x: number, y: number, width: number, height: number } meaning roblox window position
  // throws RobloxNotOpen if roblox is not open
  Position(config = {}) {
    const _FUNCTION = "Roblox:Position";

    const {
      NOTIFY = config?.NOTIFY || false,
      IGNORE_OOB = config?.IGNORE_OOB || false, // dont throw error if roblox is out of bounds
      AUTOCORRECT = config?.AUTOCORRECT || false, // overrides ignore_oob. if roblox is out of bounds, automatically correct it
    } = config;

    const robloxWindow = this.Window(config);
    const robloxBounds = robloxWindow.getBounds();

    if (!robloxBounds) {
      log.error(`${_FUNCTION}: Roblox window not found`);
    }

    return robloxBounds;
  }

  // gets roblox proccess id
  // returns { id: number }
  // throws RobloxNotOpen if roblox is not open
  ProcessId() {
    const robloxWindow = this.Window();

    return robloxWindow.processId;
  }

  // ----------------- actions -----------------

  // bring roblox window to the top
  async bringToTop(config = {}) {
    const _FUNCTION = "Roblox:bringToTop";

    const {
      MAXIMIZE = config?.MAXIMIZE || false,
    } = config;

    const robloxWindow = this.Window();
    if (this.isMinimized()) {
      log.unit(`${_FUNCTION}: Roblox is minimized. Restoring...`);

      await robloxWindow.restore();

      if (this.isMinimized()) {
        log.error(`${_FUNCTION}: Roblox is still minimized after restore attempt.`);
        throw new WindowManagementFailure(`${_FUNCTION}: Roblox is still minimized after restore attempt.`);
      }
      log.unit(`${_FUNCTION}: Roblox window restored successfully.`);
    } else {
      await robloxWindow.bringToTop();

      if (MAXIMIZE) {
        await robloxWindow.maximize();
      }

      return robloxWindow;
    }

    return true;
  }

  //  joins private server configured in this class
  // returns nothing
  async JoinPrivateServer(config = {}) {
    const _FUNCTION = "Roblox:JoinPrivateServer";

    const {
      FORCE = config?.FORCE || false,
      NOTIFY = config?.NOTIFY || false,
      IGNORE_OOB = config?.IGNORE_OOB || false, // dont throw error if roblox is out of bounds
      AUTOCORRECT_WINDOW = config?.AUTOCORRECT_WINDOW || false, // overrides ignore_oob. if roblox is out of bounds, automatically correct it
    } = config;

    if (this.isOpen()) {
      if (!FORCE) {
        throw new ApplicationExpectationFailed("Roblox is already open");
      }

      // config.FORCE is true, so we're gonna FORCE you to join the private server
      log.debug(`${_FUNCTION}: Roblox is already open: forcing join private server`);
      await this.Close();
    }

    await System.StartUrl(this.privateServerLink);

    // wait the process to start
    while (!this.isOpen()) {
      log.trace(`${_FUNCTION}: Roblox is not open yet. Waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // wait till roblox gets really available, we cant
    // return the same instant the process starts
    // because it might be in the process of loading
    while (this.Position({ AUTOCORRECT: AUTOCORRECT_WINDOW }).width === 0) {
      log.trace(`${_FUNCTION}: Roblox is not ready yet. Waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.debug) {
      log.debug(`${_FUNCTION}: Private server joined successfully!`);
    }

    return;
  }

  // closes roblox
  // calls _waitDisconnectInterval before returning
  // returns nothing
  async Close(config = {}) {
    const _FUNCTION = "Roblox:Close";

    const {
      SKIP_INTERVAL = config?.SKIP_INTERVAL || false,
    } = config;

    const robloxProcessId = this.ProcessId();
    await System.Taskkill(robloxProcessId);

    // only return when the roblox window is closed
    while (this.isOpen()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.debug) {
      log.trace(`${_FUNCTION}: Roblox closed successfully!`);
    }

    if (!SKIP_INTERVAL) {
      this._waitDisconnectInterval(); // read this function to understand why its here, dont want to repeat myself
    }

    return;
  }

  // clicks on an absolute coordinate that was calculated from relative coordinates
  // relative coordinates are the same coordinates independant of roblox window size
  async Click(x, y, config = {}) {
    const _FUNCTION = "Roblox:Click";

    const {
      TYPE = config?.TYPE || "relative", // relative_percent, relative, absolute, 
      NOTIFY = config?.NOTIFY || true,
      CLICK = config?.CLICK || true,
      SLOW = config?.SLOW || false,
    } = config;

    let absolute = { x, y }
    switch (TYPE.toLowerCase()) {
      case 'relative_percent':
        absolute = this.AbsoluteFromRelativePercent(x, y);
        break;
      case 'relative':
        absolute = this.AbsoluteFromRelative(x, y);
        break;
      case 'absolute':
        break;
      default:
        throw new Error(`${_FUNCTION}: Invalid TYPE: ${TYPE}`);
    }

    if (NOTIFY) { log.debug(`Clicking at ${absolute.x},${absolute.y}`) };
    if (!CLICK) {
      System.MouseMove(absolute.x, absolute.y, { SLOW: SLOW });
      return;
    };

    System.MouseClick(absolute.x, absolute.y);
  }

  // ----------------- specific roblox elements -----------------

  ToggleChat(config = {}) {
    const _FUNCTION = "Roblox:ToggleChat";

    const CHAT_BUTTON_COORDINATES = { x: 80, y: 50 }
    this.Click(CHAT_BUTTON_COORDINATES.x, CHAT_BUTTON_COORDINATES.y, { TYPE: 'absolute', CLICK: true, SLOW: false })
  }

  // i STRONGLY recommend agaisnt of this, because this will auto skip the first aura on join
  // if thats a global :skull: (REALLY unlieky)
  ToggleAutoRoll(config = {}) {
    const _FUNCTION = "Roblox:ToggleAutoRoll";

    const AUTO_ROLL_BUTTON_COORDINATES = { x: 38.48039215686275, y: 94.31009957325746 }
    this.Click(AUTO_ROLL_BUTTON_COORDINATES.x, AUTO_ROLL_BUTTON_COORDINATES.y, { TYPE: 'relative_percent', CLICK: true, SLOW: false })
  }

  ClickYouveFoundSkipButton(config = {}) {
    const _FUNCTION = "Roblox:ClickYouveFoundSkipButton";

    const YOUVE_FOUND_SKIP_BUTTON_COORDINATES = { x: 56.19834710743802, y: 84.54198473282443 }
    this.Click(YOUVE_FOUND_SKIP_BUTTON_COORDINATES.x, YOUVE_FOUND_SKIP_BUTTON_COORDINATES.y, { TYPE: 'relative_percent', CLICK: true, SLOW: false })
  }

  CloseCollection(config = {}) {
    const _FUNCTION = "Roblox:CloseCollection";

    const COLLECTION_BACK_BUTTON_COORDINATES = { x: 15.082644628099173, y: 11.641221374045802 }
    this.Click(COLLECTION_BACK_BUTTON_COORDINATES.x, COLLECTION_BACK_BUTTON_COORDINATES.y, { TYPE: 'relative_percent', CLICK: true, SLOW: false })
  }

  OpenCollection(config = {}) {
    const _FUNCTION = "Roblox:OpenCollection";
    this.clickButtonPosition(2);
  }

  OpenInventory(config = {}) {
    const _FUNCTION = "Roblox:OpenInventory";
    this.clickButtonPosition(3);
  }

  // clicks on left side menu buttons
  // order from top to bottom, 1 to 7 (8 if ownPrivate tag)
  clickButtonPosition(num) {
    const _FUNCTION = "Roblox:clickButton";

    const button = this.getMenuButtonPosition(num);
    this.Click(button.x, button.y, { TYPE: 'absolute', CLICK: true, SLOW: false })
  }

  // almost a carbon copy from dolphsols
  getMenuButtonPosition(num) {
    const _FUNCTION = "Roblox:getMenuButtonPosition";

    // 1: storage,  2: collection,  3: inventory,       4: achievements
    // 5: quests,   6: settings,    7: pvt management,  8: gamepass

    // num := options["InOwnPrivateServer"] ? num : num + 1
    // in theory you should always be in your private while running this
    // doesnt make sense to run this script in other servers
    num = true ? num : num + 1;

    // getRobloxPos(rX, rY, width, height)
    const roblox = this.Position();
    const monitor = System.getPrimaryMonitorInfo();

    const menuBarOffset = 20;   // x offset from left edge of roblox window
    // const menuBarYSpacingOffset = 10.5; // y spacing between menu buttons
    // const menuBarYSpacingOffset = (10.5 / 1080) * roblox.height

    // TODO(adrian): get a more precise formula for this. This does not return 10.5, but instead returns 10.54

    // misses the button if your game window is too small (or you have a small resolution) (<1080p)
    // higher resolution support works better, but not sure if its good until 4k++
    const spacingSizeVar = 10.5 * Math.sqrt((roblox.width / 1920) * (roblox.height / 1080));
    const buttonSizeVar = 58.0 * Math.sqrt((roblox.width / 1920) * (roblox.height / 1080));

    // menuBarVSpacing   := 10.5 * (height        / 1080)
    const menuBarVSpacing = spacingSizeVar * (roblox.height / monitor.bounds.height)
    // const menuBarVSpacing = menuBarYSpacingOffset * (roblox.height / monitor.bounds.height)

    // menuBarButtonSize   := 58 * (width        / 1920)
    const menuBarButtonSize = buttonSizeVar * (roblox.width / monitor.bounds.width)

    log.unit(`${_FUNCTION}: Menu Bar Vertical Spacing: ${menuBarVSpacing}`);
    log.unit(`${_FUNCTION}: Menu Bar Button Size: ${menuBarButtonSize}`);

    // menuEdgeCenter   := [rX       + menuBarOffset, rY       + (height        / 2)]
    const menuEdgeCenter = [roblox.x + menuBarOffset, roblox.y + (roblox.height / 2)]

    // startPos   := [menuEdgeCenter[1] + (menuBarButtonSize / 2), menuEdgeCenter[2] + (menuBarButtonSize / 4) - (menuBarButtonSize + menuBarVSpacing - 1) * 3.5] 
    const startPos = [menuEdgeCenter[0] + (menuBarButtonSize / 2), menuEdgeCenter[1] + (menuBarButtonSize / 4) - (menuBarButtonSize + menuBarVSpacing - 1) * 3.5]

    const posX = startPos[0]
    const posY = startPos[1] + (menuBarButtonSize + menuBarVSpacing) * (num - 0.5)

    log.unit(`${_FUNCTION}: Menu Button Position: ${num} (${posX}, ${posY})`);

    // MouseMove, % posX, % posY
    return { x: posX, y: posY }


  }

  // ----------------- specific sols elements -----------------

  AlignCamera(config = {}) {
    const _FUNCTION = "Roblox:AlignCamera";

    System.sleep(1500);

    log.trace(`${_FUNCTION}: Toggling chat...`);
    this.ToggleChat(); // should ocr this is open or closed

    // trying to open collection
    log.trace(`${_FUNCTION}: Opening collection...`);
    this.OpenCollection();
    System.sleep(1500);
    this.OpenCollection();

    // now trying to close it
    log.trace(`${_FUNCTION}: Closing collection...`);
    this.CloseCollection(); // should ocr this is actually closed
    System.sleep(1500); // fuck you, just in case  //TODO(adrian): remove this once OCR for this is implemented
    this.CloseCollection(); // please?

    // blind click on "SKIP", just in case
    log.trace(`${_FUNCTION}: Blindly clicking "SKIP" button from "You've Found" prompt...`);
    this.ClickYouveFoundSkipButton();
    System.sleep(1500);
    this.ClickYouveFoundSkipButton();


    // now lets enable auto roll
    log.trace(`${_FUNCTION}: Enabling auto roll...`);
    this.ToggleAutoRoll(); // not sure if this works properly

    // now aligning with wall
    log.trace(`${_FUNCTION}: Aligning biome label with wall with wall... (holding "A"+"S")`);
    robot.keyToggle('a', 'down');
    robot.keyToggle('s', 'down');
  }

  async CheckIfWaitingServer(config = {}) {
      const _FUNCTION = "Roblox:CheckIfWaitingServer";
      const {
        TIMEOUT = config?.TIMEOUT || 1000 * 60, // wait for server a maximum of 60, else we fail totally
        MAX_ITERATIONS = config?.MAX_ITERATIONS || 30, // default 10 iterations in 10 seconds
        INTERVAL = config?.INTERVAL || 2000, // intervalo de 2s entre cada OCR check
      } = config;

      // should check 5 times, if it finds, check one time per second until its gone or a timeout happens (took too long)
      const EXPECTED_TEXT = "Waiting for an available server";
      const SIMILARITY_THRESHOLD = 0.5; // good enough
      let IS_WAITING_SERVER = false;
      let i = 0;
      const startTime = Date.now();

      const roblox = this.Position();

      // offset if needed
      const FINAL_Y_OFFSET = -25; // for some reason roblox position is 16 pixels bigger than it should be
      const FINAL_X_OFFSET = 0;

      const rectHeight = 30; // height of area to be checked
      const rectWidthPercent = 0.25; // width of area to be checked (10% of screen width)
      const rectWidth = rectWidthPercent * roblox.width; // rectangle width
      const centerX = roblox.width / 2;  // X center of roblox window
      const centerY = roblox.height / 2; // Y center of roblox window
      // final coordinates
      const y1 = (roblox.height - rectHeight) + FINAL_Y_OFFSET; // topo do retângulo
      const y2 = (roblox.height) + FINAL_Y_OFFSET; // base do retângulo (alinhado com a borda inferior)
      const x1 = (centerX - (rectWidth / 2)) + FINAL_X_OFFSET; // canto superior esquerdo
      const x2 = (centerX + (rectWidth / 2)) + FINAL_X_OFFSET; // canto inferior direito
      const SCREENSHOT_AREA = [[x1, y1], [x2, y2]];

      // lets check if its waiting for server
      while (i <= MAX_ITERATIONS) {
        i++
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= TIMEOUT) { throw new ApplicationExpectationFailed(`${_FUNCTION} - Private server init took too long. (${TIMEOUT / 1000}s timeout reached)`) };
        if (i > MAX_ITERATIONS) { throw new ApplicationExpectationFailed(`${_FUNCTION} - Private server init took too long. (${MAX_ITERATIONS} iterations limit reached)`) };

        // take a screenshot of the area
        const screenshot = await System.CoordinateToRawBuffer(SCREENSHOT_AREA);

        // save screenshot for debugging purposes
        // await System.SaveRawBufferToFile(screenshot, path.resolve(`src/tests/images/waitingservertest_${i}.png`));

        // read the text from the screenshot
        const ocrResult = await System.OCRfromRawBuffer(screenshot);
        const ocrText = ocrResult.text.toLowerCase();

        // calculate the similarity of the two strings. Threshold should be low, because the text is really tiny. its about 0.5/0.66 acc
        const similarity = ss.compareTwoStrings(ocrText, EXPECTED_TEXT);

        // if it hits the threshold, its probably still waiting for server
        if (similarity > SIMILARITY_THRESHOLD) {
          // its probably waiting for the server
          // log the iteration number, the ocr text and similarity
          log.debug(`${_FUNCTION} - #${i} OCR: "${ocrText}", Similarity: ${similarity}`);
          IS_WAITING_SERVER = true;
        } else {
          // its not waiting for server anymore, we can proceed with the script
          log.debug(`${_FUNCTION} - #${i} OCR: "${ocrText}", Similarity: ${similarity}`);
          log.debug(`${_FUNCTION} - #${i} Its not waiting for server anymore!`);
          IS_WAITING_SERVER = false;
          break;
        }

        // waits INTERVAL before repeating
        await new Promise(resolve => setTimeout(resolve, INTERVAL));
      }

      return IS_WAITING_SERVER; // Retorna se ainda está esperando o servidor ou não
    }

  async WaitForPlayButton(config = {}) {
      const _FUNCTION = "Roblox:WaitForPlayButton";

      const {
        TIMEOUT = config?.TIMEOUT || 1000 * 10, // default 10s
        MAX_ITERATIONS = config?.MAX_ITERATIONS || 10, // default 10 iterations in 10 seconds 
      } = config;

      const INTERVAL_PER_ITERATION = TIMEOUT / MAX_ITERATIONS;
      let PLAY_BUTTON_FOUND = false;
      let RELATIVE_PLAY_BUTTON_CENTER
      let RELATIVE_PLAY_BUTTON_POSITION

      for (let i = 0; i < MAX_ITERATIONS; i++) {

        // Obtaining Roblox's window relative position
        const { x, y, width, height } = this.Position()

        // Calculate the center point (x, y)
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Adjust relative positions based on a specific size if needed (for the play button size)
        const buttonWidth = width * 0.20; // Example play button width
        const buttonHeight = height * 0.13; // Example play button height

        // Shift the box 50 pixels down
        const yOffset = height * 0.35;

        // Now calculate the relative position of the play button around the center, adjusted by 50 pixels down
        const x1 = centerX - buttonWidth / 2;
        const y1 = centerY - buttonHeight / 2 + yOffset;
        const x2 = centerX + buttonWidth / 2;
        const y2 = centerY + buttonHeight / 2 + yOffset;

        RELATIVE_PLAY_BUTTON_POSITION = [[x1, y1], [x2, y2]];
        RELATIVE_PLAY_BUTTON_CENTER = { x: ((x1 + x2) / 2), y: ((y1 + y2) / 2) };
        log.trace(`${_FUNCTION} - Looking for Play Button, iteration #${i}`);

        // screenshot playbutton position
        const screenshot = await System.CoordinateToRawBuffer(RELATIVE_PLAY_BUTTON_POSITION); // should perfectly capture the play button

        // // TESTING : saving the screenshot in a file just to check
        // await System.SaveRawBufferToFile(screenshot, path.resolve("src/tests/images/playbuttontest.png"));

        // reading buffer and checking if it says play
        const ocrResult = await System.OCRfromRawBuffer(screenshot);
        const ocrText = ocrResult.text.toLowerCase();
        if (ocrText.includes("play")) {
          log.trace(`${_FUNCTION} - Found in iteration #${i}`);
          PLAY_BUTTON_FOUND = true;
          break
        }

        // play not found, repeat again
        await new Promise(resolve => setTimeout(resolve, INTERVAL_PER_ITERATION));
      }

      if (!PLAY_BUTTON_FOUND) {
        throw new OcrExpectationFailed(`${_FUNCTION} - Play button not found after ${MAX_ITERATIONS} iterations`);
      }

      // if play found, click button
      log.unit(`${_FUNCTION} - Play button found! Clicking...`);
      System.MouseClick(RELATIVE_PLAY_BUTTON_CENTER.x, RELATIVE_PLAY_BUTTON_CENTER.y);
    }

  }

module.exports = {
  Roblox: new Roblox(),
};
