const path = require("path");
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));

(async () => {
  // await Roblox.JoinPrivateServer({force: true})
  // await Roblox.Close()
  //   console.log(Biomes.identify("sandsto", { DEBUG_SCAN: true }));
  // console.log(await System.OCRfromScreen([[0, 0],[100, 100]]))

  // const colorMatrix = [
  //   2, 0, 0, 0, 0,
  //   0, 1.5, 0, 0, 0,
  //   0, 0, 1, 0, 0,
  //   0, 0, 0, 1, 0,
  //   0, 0, 0.2, 0, 1,
  // ];

  // // get biome area as bitmap
  // const biomeRawBuffer = await Biomes.getBiomeAsRawBuffer();


  // // apply effects to make ocr more accurate
  // const preparedRawBuffer = await Biomes.prepareBufferForOCR(biomeRawBuffer);
  // const resizedRawBuffer = await System.ResizeFromRawBuffer(biomeRawBuffer, 400, 200);
  // const matrixedRawBuffer = await System.ApplyColorMatrixToRawBuffer(biomeRawBuffer, colorMatrix);


  // console.log(matrixedRawBuffer)

  // // easier to edit what thing we are looking at
  // const OCRbuffer = matrixedRawBuffer

  // // console.log(OCRbuffer)
  // const output = await System.OCRfromRawBuffer(OCRbuffer);
  // // console.log(output)
  // console.log('Recognized: ' + String(output.text))
  
  // // write to file as needed
  // await System.BitmapToFile(OCRbuffer, path.resolve("src/tests/images/test.png"));

  console.time('determine-biome')
  console.log(await Biomes.determineBiome())
  console.timeEnd('determine-biome')


  // make a Roblox.ScreenshotWindow() so we can check what Roblox.Position() is really returning

})();
