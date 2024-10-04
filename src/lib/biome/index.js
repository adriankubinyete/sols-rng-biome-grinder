// should have code related to biome-recognition
// use ocr to screenshot biome
// map the ocr for a biome value
const path = require("path");
const { System } = require(path.resolve("src/lib/system"));
const { Roblox } = require(path.resolve("src/lib/roblox"));

const SIMILAR = {
  1: "l",
  n: "m",
  m: "n",
  t: "f",
  f: "t",
  s: "S",
  S: "s",
  w: "W",
  W: "w",
};

class Biomes {
  constructor(debug = true) {
    this.debug = debug;
    this.GETBIOME_X_ADJUST = 13
    this.GETBIOME_Y_ADJUST = -4;
    this.configuration = {
      Normal: {
        color: "#dddddd",
      },
      Windy: {
        category: "weather",
        color: "#9ae5ff",
        chance: 500,
        duration: 120,
        display: false,
        ping: false,
        spam: false,
      },
      Rainy: {
        category: "weather",
        color: "#027cbd",
        chance: 750,
        duration: 120,
        display: false,
        ping: false,
        spam: false,
      },
      Snowy: {
        category: "weather",
        color: "#dceff9",
        chance: 600,
        duration: 120,
        display: false,
        ping: false,
        spam: false,
      },
      SandStorm: {
        category: "biome",
        color: "#ffc600",
        chance: 3000,
        duration: 600,
        display: true,
        ping: false,
        spam: false,
      },
      Hell: {
        category: "biome",
        color: "#ff4719",
        chance: 6666,
        duration: 660,
        display: true,
        ping: false,
        spam: false,
      },
      Starfall: {
        category: "biome",
        color: "#011ab7",
        chance: 7500,
        duration: 600,
        display: true,
        ping: false,
        spam: false,
      },
      Corruption: {
        category: "biome",
        color: "#6d32a8",
        chance: 9000,
        duration: 660,
        display: true,
        ping: false,
        spam: false,
      },
      Null: {
        category: "biome",
        color: "#838383",
        chance: 13333,
        duration: 90,
        display: true,
        ping: false,
        spam: false,
      },
      Glitch: {
        category: "biome",
        color: "#bfff00",
        chance: 30000,
        duration: 164,
        display: true,
        ping: true,
        spam: false,
      },
      Unknown: {
        color: "#838383",
        display: false,
        ping: false,
        spam: false,
      },
    };
  }

  // TODO(adrian): make a check to see if roblox is active window ... etc
  // get current biome as raw buffer. roblox must be open and visible
  // returns { buffer: Buffer, width: number, height: number }
  async getBiomeAsRawBuffer(config = {}) {
    const _FUNCTION = "Biomes:getBiomeAsRawBuffer";

    const {
      // WRITE_TO_FILE = config?.WRITE_TO_FILE || false, // not implemented yet
    } = config;

    const { x, y, width, height } = Roblox.Position()
    const X_ADJUSTMENT = this.GETBIOME_X_ADJUST;
    const Y_ADJUSTMENT = this.GETBIOME_Y_ADJUST;

    // thanks @dolphsol for this
    let x1 = x + X_ADJUSTMENT
    let y1 = (y + Y_ADJUSTMENT) + height - height * 0.135 + ((height / 600) - 1) * 10
    let x2 = x1 + (width * 0.15) // trying to normalize biome screenshot size
    let y2 = y1 + (height * 0.03)
    const currentBiomeCoordinates = [[x1, y1], [x2, y2]];

    console.log('Current biome coordinates: ', currentBiomeCoordinates)

    return await System.CoordinateToRawBuffer(currentBiomeCoordinates);
  }

  // TODO(adrian): implement or delete this. not used as of now
  // should contain image modifications before ocr
  prepareBufferForOCR(bitmap, config = {}) {
    const _FUNCTION = "Biomes:prepareBufferForOCR";

    const colorMatrix = [
      2, 0, 0, 0, 0,
      0, 1.5, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
      0, 0, 0.2, 0, 1,
    ];
  }

  // take some text and check the most likely biome
  // Unknown if couldn't determine biome
  // return { biome: string, confidence: number} // biome can be Unknown if not found any
  identifyBiome(ocrResult, config = {}) {
    // adapted from dolphsol's biome detection, check them out for a full macro!
    // https://github.com/BuilderDolphin/dolphSol-Macro
    const _FUNCTION = "Biomes:Identify";

    const {
      DEBUG_SCAN = config?.DEBUG_SCAN || true,
      CONFIDENCE_THRESHOLD = config?.CONFIDENCE_THRESHOLD || 0.7, // dolphsol default is 0.70
    } = config;

    const ocrCleaned = ocrResult
      .replace(/\s/g, "")
      .replace(/^([\[\(\{\|IJ]+)/, "")
      .replace(/[\]\)\}\|IJ]+$/, "");

    let highestConfidenceValue = 0;
    let foundBiome = null; // not the biome!

    //  Iteramos sobre cada configuração de bioma
    if (DEBUG_SCAN) {
      console.log(`${_FUNCTION}: Checking match for: ${ocrCleaned}`);
    }

    for (let i = 0; i < Object.keys(this.configuration).length; i++) {
      const biomeKey = Object.keys(this.configuration)[i]; // biome name

      //   if (DEBUG_SCAN) {
      //     console.log(
      //       `${_FUNCTION}: [PROB:${foundBiome}] Checking biome "${biomeKey}".`
      //     );
      //   }

      if (["Glitch", "Unknown"].includes(biomeKey)) {
        continue;
      }

      let scanIndex = 1;
      let accuracy = 0;

      // Iteramos sobre o nome do bioma
      for (let k = 0; k < biomeKey.length; k++) {
        if (DEBUG_SCAN) {
          console.log(`${_FUNCTION}: [PROB:${foundBiome}] Checking character "${biomeKey[k]}" from "${biomeKey}".`);
        }

        const checkingChar = biomeKey[k];

        // Agora iteramos sobre o resultado limpo do OCR
        for (let j = 0; j < ocrCleaned.length; j++) {
          const index = scanIndex + j - 1;
          const targetChar = ocrCleaned[index];

          if (DEBUG_SCAN) {
            // console.log(
            //   `Checking if character "${targetChar}" matches "${checkingChar}" or "${SIMILAR[targetChar]}"`
            // );
          }

          // Verificamos correspondência exata
          if (targetChar === checkingChar) {
            accuracy += 3 - j;
            scanIndex = index + 1; // Movemos o scanIndex
            break;

            // Verificamos correspondência de caractere semelhante
          } else if (SIMILAR[targetChar] === checkingChar) {
            accuracy += 2.5 - j;
            scanIndex = index + 1; // Movemos o scanIndex
            break;
          }
        }
      }

      let ratio = accuracy / (biomeKey.length * 2);
      if (ratio > highestConfidenceValue) {
        highestConfidenceValue = ratio;
        foundBiome = biomeKey;
      }

      if (highestConfidenceValue < CONFIDENCE_THRESHOLD) {
        // this defines the confidence value
        foundBiome = "Unknown";

        // Calcula o glitchedCheck
        const internalStrLength = ocrCleaned.length;
        const numbersRemovedLength = ocrCleaned.replace(/\d/g, "").length;
        const glitchedCheck =
          internalStrLength -
          numbersRemovedLength +
          (ocrCleaned.includes(".") ? 4 : 0);

        if (glitchedCheck >= 20) {
          console.log(`${_FUNCTION}: probably glitch biome`);
          foundBiome = "Glitch";
        }

        // Logs para depuração
        // console.log('-----------------------------------------------------------------')
        // console.log("highestConfidenceValue:", highestConfidenceValue);
        // console.log("ocrCleaned:", ocrCleaned);
        // console.log("internalStrLength:", internalStrLength);
        // console.log(
        //   "numbersRemovedLength (sem números):",
        //   numbersRemovedLength
        // );
        // console.log("glitchedCheck:", glitchedCheck);
      }
    }

    return {
      biome: foundBiome,
      confidence: highestConfidenceValue,
    };
  }

  // TODO(adrian): align with respawn plate so we get a better background for ocr ||| esc + r --> collection --> back --> d for 1 or 2s
  // loops 10 times and tries to determine biome
  // saves failed attempts to src/tests/images/ocr-biome-failed/
  // returns { biome: string, confidence: number} // biome can be Unknown if not found any
  async determineBiome(config = {}) {
    const _FUNCTION = "Biomes:determineBiome";
    const {
      SAVE_UNKNOWN = config?.SAVE_UNKNOWN || true, // debug purposes, should be false on production // about 500kb of screenshots per 10-iteration-fail
      SAVE_SS_ITERATIONS = config?.SAVE_SS_ITERATIONS || false,
      IDENTIFYBIOME_DEBUG = config?.IDENTIFYBIOME_DEBUG || false, // very spammy
      IDENTIFYBIOME_THRESHOLD = config?.IDENTIFYBIOME_THRESHOLD || 0.7, // default is 0.70
    } = config;

    // image editing matrix
    const colorMatrix = [
      2, 0, 0, 0, 0,
      0, 1.5, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 0, 0,
      1, 0, 0, 0, 0.2,
      0, 1,
    ];
    let idForSS = Date.now()
    let identifiedBiome


    // we will progressively increase the size of the image in each iteration that we did not find the biome
    // if we find a biome with confidence, we break out of the loop
    for (let index = 1; index <= 10; index++) {

      // obtaning current biome buffer
      const rawBuffer = await this.getBiomeAsRawBuffer();



      // enlarging image (this messes with ss alignment, be careful)
      const newWidth = Math.round(rawBuffer.width + index * 38);
      const newHeight = Math.round(rawBuffer.height + index * 7.5);
      const resizedBuffer = await System.ResizeFromRawBuffer(rawBuffer, newWidth, newHeight);

      // console.log('------------------ SAVING RESIZED FROM BUFFER ------------')
      // System.SaveRawBufferToFile(resizedBuffer, path.resolve(`src/tests/images/screenshot-${Date.now()}.png`));

      // applying the color matrix on the image (should help ocr)
      const transformedBuffer = await System.ApplyColorMatrixToRawBuffer(resizedBuffer, colorMatrix);

      // send buffer to ocr
      const ocrResult = await System.OCRfromRawBuffer(transformedBuffer);

      // pass ocr result to algorithm which checks valid biomes from text.
      identifiedBiome = this.identifyBiome(ocrResult.text, { DEBUG_SCAN: IDENTIFYBIOME_DEBUG, CONFIDENCE_THRESHOLD: IDENTIFYBIOME_THRESHOLD });
      console.log('Iteration ' + index + ' | Raw OCR: "' + ocrResult.text.replace(/[\r\n]+/g, " ") + '" | Biome: ' + identifiedBiome.biome + ' | Confidence: ' + identifiedBiome.confidence)

      // saving image if needed
      if (SAVE_SS_ITERATIONS) {
        const ssName = `${identifiedBiome.biome.toLowerCase()}_${idForSS}_iter${index}_conf${identifiedBiome.confidence}.png`;
        const ssPath = path.resolve("src/tests/images/", ssName);
        await System.SaveRawBufferToFile(transformedBuffer, ssPath);
      } else if (SAVE_UNKNOWN && identifiedBiome.biome === "Unknown") {
        const ssName = `${identifiedBiome.biome.toLowerCase()}_${idForSS}_iter${index}_conf${identifiedBiome.confidence}.png`;
        const ssPath = path.resolve("src/tests/images/BiomeDetermineFails", ssName);
        await System.SaveRawBufferToFile(transformedBuffer, ssPath);
      }

      // Verifica se o bioma foi identificado
      if (identifiedBiome && identifiedBiome.biome !== "Unknown") {
        // console.log(`Bioma identificado: ${JSON.stringify(identifiedBiome)}`);
        break; // Sai do loop se o bioma foi identificado
      }

      // Se necessário, limpe ou descarte a imagem
    }

    if (!identifiedBiome) {
      console.log(`Bioma não identificado.`);
      identifiedBiome = {
        biome: "Unknown",
        confidence: null,
      };
    }

    return identifiedBiome
  }
}

module.exports = {
  Biomes: new Biomes(),
};
