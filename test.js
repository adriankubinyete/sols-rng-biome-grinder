const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));
const { Discord } = require(path.resolve("src/lib/discord"));
const robot = require("robotjs"); // screen to bitmap, and user input
const nwm = require("node-window-manager");
const wm = {
  // this is so dumb
  ...nwm.addon,
  ...nwm.windowManager,
};


(async () => {

  // Roblox.Window({AUTOCORRECT: true});
  // const [CLICK_X, CLICK_Y] = [  10.294117647058822, 7.396870554765292  ]
  // Roblox.Click(50, 50, {TYPE: 'relative_percent', CLICK: false});

  // Roblox.ToggleChat();
  // Roblox.ToggleAutoRoll();
  // await Roblox.bringToTop({MAXIMIZE: true});
  // Roblox.OpenInventory();


  // System.sleep(2000)
  // Roblox.clickButtonPosition(2);

  // console.log('STARTING')
  // System.sleep(3000)
  // Roblox.AlignCamera();

  // console.log(CONFIGURATION.biomes)
  // console.log('user pings: ' + CONFIGURATION.getDiscordPings())
  // console.log('ping: ' + CONFIGURATION.getBiomesToPing())
  // console.log('spam ping: ' + CONFIGURATION.getBiomesToSpamPing())
  // console.log('notify: ' + CONFIGURATION.getBiomesToNotify())
  // console.log('pop: ' + CONFIGURATION.getBiomesToPop())

  // console.log(Discord.Message({embed: false, text: CONFIGURATION.getDiscordPings()}).Send())
  // Discord.SpamPing(CONFIGURATION.getDiscordPings(), 5) // 10 pings, default interval of 1 second
  // Discord.NotifyBiome({ BIOME: 'Unknown' });
  // Biomes.DiscordNotification({ BIOME: detectedBiome.biome });


  // await Roblox.JoinPrivateServer({ FORCE: true, AUTOCORRECT_WINDOW: true })
  // await Roblox.bringToTop({ MAXIMIZE: true }) // test if this work properly please
  // System.sleep(2500) // wait 2 seconds after you told game to open, to guarantee it's open
  // await Roblox.CheckIfWaitingServer();
  console.log('------ END ---------')
  // Roblox.MonitorMousePosition();
  Roblox.ClickYouveFoundSkipButton();
  // await System.sleep(1000 * 4) // game is opening, give it some time


  // console.log('starting')
  // System.sleep(3000)

  // console.log('opening coll')
  // Roblox.OpenCollection();
  // System.sleep(3000)

  // console.log('closing coll')
  // Roblox.CloseCollection();

  // Roblox.MonitorMousePosition();





























  // ------------------------- TEST BUTTONS -------------------------------------
  // const roblox = Roblox.Position();
  // const test = calculateMenuSpacing(roblox.width, roblox.height)
  // console.log(test)

  // let button
  // button = Roblox.getMenuButtonPosition(1);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)

  // button = Roblox.getMenuButtonPosition(2);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)

  // button = Roblox.getMenuButtonPosition(3);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)

  // button = Roblox.getMenuButtonPosition(4);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)

  // button = Roblox.getMenuButtonPosition(5);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)

  // button = Roblox.getMenuButtonPosition(6);
  // Roblox.Click(button.x, button.y, {TYPE: 'absolute', CLICK: false, SLOW: true})
  // System.sleep(1000)





  // console.log(Roblox.AbsoluteFromRelative(2, 2))
  // Roblox.MonitorMousePosition();


})();
