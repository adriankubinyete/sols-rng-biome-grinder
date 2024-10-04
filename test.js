const path = require("path");
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));
const robot = require("robotjs");
const sharp = require("sharp");

(async () => {
  // await Roblox.JoinPrivateServer({force: true})
  // await Roblox.Close()
  //   console.log(Biomes.identify("sandsto", { DEBUG_SCAN: true }));
  // console.log(await System.OCRfromScreen([[0, 0],[100, 100]]))

  const bmb = await Biomes.getAsBitmap();
  const resizedBmb = await System.ResizeBitmap(bmb, 400, 200);
  console.log(resizedBmb);
  await System.BitmapToFile(resizedBmb, path.resolve("src/tests/images/test.png"));
  // console.log(ocr)


  // make a Roblox.ScreenshotWindow() so we can check what Roblox.Position() is really returning


})();


