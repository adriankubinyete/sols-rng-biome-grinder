// should have code related to biome-recognition
// use ocr to screenshot biome
// map the ocr for a biome value
const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { System } = require(path.resolve("src/lib/system"));
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { Discord } = require(path.resolve("src/lib/discord"));
const { getCurrentTimeFormatted } = require(path.resolve("src/lib/utils"));
const { Logger } = require( path.resolve("src/lib/utils/logger") );
const log = new Logger('Biomes', false).setLevel(999).setLocation(path.resolve("logs/srbg.log")).create()

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
    this.configuration = CONFIGURATION.biomes
    // {
    //   Normal: {
    //     color: "#dddddd",
    //   },
    //   Windy: {
    //     category: "weather",
    //     color: "#9ae5ff",
    //     chance: 500,
    //     duration: 120,
    //     display: false,
    //     ping: false,
    //     spam: false,
    //   },
    //   Rainy: {
    //     category: "weather",
    //     color: "#027cbd",
    //     chance: 750,
    //     duration: 120,
    //     display: false,
    //     ping: false,
    //     spam: false,
    //   },
    //   Snowy: {
    //     category: "weather",
    //     color: "#dceff9",
    //     chance: 600,
    //     duration: 120,
    //     display: false,
    //     ping: false,
    //     spam: false,
    //   },
    //   SandStorm: {
    //     category: "biome",
    //     color: "#ffc600",
    //     chance: 3000,
    //     duration: 600,
    //     display: true,
    //     ping: false,
    //     spam: false,
    //   },
    //   Hell: {
    //     category: "biome",
    //     color: "#ff4719",
    //     chance: 6666,
    //     duration: 660,
    //     display: true,
    //     ping: false,
    //     spam: false,
    //   },
    //   Starfall: {
    //     category: "biome",
    //     color: "#011ab7",
    //     chance: 7500,
    //     duration: 600,
    //     display: true,
    //     ping: false,
    //     spam: false,
    //   },
    //   Corruption: {
    //     category: "biome",
    //     color: "#6d32a8",
    //     chance: 9000,
    //     duration: 660,
    //     display: true,
    //     ping: false,
    //     spam: false,
    //   },
    //   Null: {
    //     category: "biome",
    //     color: "#838383",
    //     chance: 13333,
    //     duration: 90,
    //     display: true,
    //     ping: false,
    //     spam: false,
    //   },
    //   Glitch: {
    //     category: "biome",
    //     color: "#bfff00",
    //     chance: 30000,
    //     duration: 164,
    //     display: true,
    //     ping: true,
    //     spam: false,
    //   },
    //   Unknown: {
    //     color: "#838383",
    //     display: false,
    //     ping: false,
    //     spam: false,
    //   },
    // };
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

    log.trace(`${_FUNCTION}: Current biome coordinates: ${JSON.stringify(currentBiomeCoordinates)}`)

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

    // redundant log because upper function already tells this
    log.trace(`${_FUNCTION}: Character-matching to find biome from cleaned OCR: ${ocrCleaned}`);

    for (let i = 0; i < Object.keys(this.configuration).length; i++) {
      const biomeKey = Object.keys(this.configuration)[i]; // biome name
      // too granular
      // log.unit(`${_FUNCTION}: [Most likely: ${foundBiome}] Checking biome "${biomeKey}".`)

      if (["Glitch", "Unknown"].includes(biomeKey)) {
        continue;
      }

      let scanIndex = 1;
      let accuracy = 0;

      // Iteramos sobre o nome do bioma
      for (let k = 0; k < biomeKey.length; k++) {
        const checkingChar = biomeKey[k];

        // Agora iteramos sobre o resultado limpo do OCR
        for (let j = 0; j < ocrCleaned.length; j++) {
          const index = scanIndex + j - 1;
          const targetChar = ocrCleaned[index];

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
          log.unit(`${_FUNCTION} - Probably glitch biome.`);
          foundBiome = "Glitch";
        }

        // Debug log. This is TOO GRANULAR, so ill leave it commented out
        // log.unit(`${_FUNCTION}: Accuracy: ${accuracy}`);
        // log.unit(`${_FUNCTION}: Ratio: ${ratio}`);
        // log.unit(`${_FUNCTION}: Highest Confidence Value: ${highestConfidenceValue}`);
        // log.unit(`${_FUNCTION}: OCR_CLEANED: ${ocrCleaned}`);
        // log.unit(`${_FUNCTION}: Internal Str Length: ${internalStrLength}`);
        // log.unit(`${_FUNCTION}: Glitch Check: ${glitchedCheck}`);

      }
    }

    return {
      biome: foundBiome,
      confidence: highestConfidenceValue,
    };
  }

  // loops 10 times and tries to determine biome
  // saves failed attempts to src/tests/images/ocr-biome-failed/
  // returns { biome: string, confidence: number} // biome can be Unknown if not found any
  async determineBiome(config = {}) {
    const _FUNCTION = "Biomes:determineBiome";
    const {
      SAVE_UNKNOWN = config?.SAVE_UNKNOWN || CONFIGURATION.general.SAVE_UNKNOWN_BIOMES, // debug purposes, should be false on production // about 500kb of screenshots per 10-iteration-fail
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

      // System.SaveRawBufferToFile(resizedBuffer, path.resolve(`src/tests/images/screenshot-${Date.now()}.png`));

      // applying the color matrix on the image (should help ocr)
      const transformedBuffer = await System.ApplyColorMatrixToRawBuffer(resizedBuffer, colorMatrix);

      // send buffer to ocr
      const ocrResult = await System.OCRfromRawBuffer(transformedBuffer);

      // pass ocr result to algorithm which checks valid biomes from text.
      identifiedBiome = this.identifyBiome(ocrResult.text, { DEBUG_SCAN: IDENTIFYBIOME_DEBUG, CONFIDENCE_THRESHOLD: IDENTIFYBIOME_THRESHOLD });
      log.debug(`${_FUNCTION} >> #${index} : Biome: "${identifiedBiome.biome}" | Confidence: '${identifiedBiome.confidence}' | OCR: "${ocrResult.text.replace(/\n/g, "")}"`)


      // saving image if needed
      if (SAVE_SS_ITERATIONS) {
        const ssName = `${identifiedBiome.biome.toLowerCase()}_${idForSS}_iter${index}_conf${identifiedBiome.confidence}.png`;
        const ssPath = path.resolve("src/tests/images/", ssName);
        await System.SaveRawBufferToFile(transformedBuffer, ssPath);
      } else if (SAVE_UNKNOWN && identifiedBiome.biome === "Unknown") {
        const ssName = `${identifiedBiome.biome.toLowerCase()}_${idForSS}_iter${index}_conf${identifiedBiome.confidence}.png`;
        const ssPath = path.resolve("src/tests/images/ocr-biome-failed", ssName);
        await System.SaveRawBufferToFile(transformedBuffer, ssPath);
      }

      // Verifica se o bioma foi identificado
      if (identifiedBiome && identifiedBiome.biome !== "Unknown") {
        break; // Sai do loop se o bioma foi identificado
      }
    }

    if (!identifiedBiome) {
      log.unit(`${_FUNCTION}: Biome not identified.`);
      identifiedBiome = {
        biome: "Unknown",
        confidence: null,
      };
    }

    return identifiedBiome
  }

  // we dont need to wait until biome notification finishes, we can just send it and forget
  // PS: ideally wait biome duration should be called AFTER this is called
  async DiscordNotification(BIOME) {
    const _FUNCTION = "Biomes:DiscordNotification";

    // pesquisa as informações do bioma (cor, raridade)
    let biome_config = CONFIGURATION.biomes[BIOME]
    let should_notify = biome_config?.notify
    let should_ping = biome_config?.ping
    let should_spam = biome_config?.spam
    const should_send_link = biome_config?.send_private_server_link

    if (should_send_link) {
      should_notify = true;
    }

    if (should_spam) {
      should_notify = true;
      should_ping = true;
    } else if (should_ping) {
      should_notify = true;
    }


    // Monta a mensagem embed do bioma
    const embedMessage = {
      embed: true,
      description: `**[${getCurrentTimeFormatted()}]** \`${BIOME}\`${biome_config?.chance ? ' (*1 in ' + biome_config?.chance + '*)' : ''}`,
      color: biome_config?.color || "#000000",
      timestamp: true
    };

    // adding the private server link if enabled
    if (should_send_link) {
      // embedMessage.title = `🔗 Server ID ${CONFIGURATION.roblox.private_server_link.split('?privateServerLinkCode=')[1]}`
      embedMessage.title = `🔗   Click to join the server!   🔗`;
      embedMessage.link = CONFIGURATION.roblox.private_server_link
    }

    // Verifica se a notificação deve ser enviada
    if (should_notify) {
      let MESSAGE_PINGS = '';
      const IDS_ARRAY = []; // Assuma que IDS_ARRAY é preenchido com IDs de usuários ou roles

      // Monta a mensagem de pings se necessário
      if (should_ping && IDS_ARRAY.length > 0) {
        for (let i = 0; i < IDS_ARRAY.length; i++) {
          MESSAGE_PINGS += `<${IDS_ARRAY[i]}> `;
        }
        embedMessage.text = MESSAGE_PINGS; // Adiciona os pings ao texto da mensagem
      }

      // Envia a mensagem embed
      await Discord.Message(embedMessage).Send();

      // Se spam estiver ativo, chama a função SpamPing com a quantidade desejada
      if (should_spam) {
        const spamAmount = 7; // Exemplo: número de mensagens a serem enviadas em spam
        await Discord.SpamPing(MESSAGE_PINGS, spamAmount);
      }
    }
  }

  async WaitForDuration(BIOME) {
    const _FUNCTION = "Biomes:WaitForDuration";
    // pesquisa as informações do bioma
    let biome_config = CONFIGURATION.biomes[BIOME]
    let should_wait_biome_end = biome_config?.wait_biome_end
    let biome_duration = biome_config?.duration

    if (should_wait_biome_end) {
      log.info(`${_FUNCTION}: Waiting ${biome_duration} seconds for biome "${BIOME}" to end...`);
      return new Promise(resolve => setTimeout(resolve, biome_duration * 1000)); // we cant atomically sleep here, else discord notification will stop mid-send
    } else {
      log.info(`${_FUNCTION}: "${BIOME}" will be skipped. `);
    }
  }

  async HandleBiome(BIOME) {
    const _FUNCTION = "Biomes:HandleBiome";

    const INTERVAL_CHECK_NORMAL_BIOME_ENDED = CONFIGURATION.general.INTERVAL_CHECK_NORMAL_BIOME_ENDED;
    let detectedBiome;
    let UNKNOWN_COUNT = 0;
    let MAX_UNKNOWN_COUNT = CONFIGURATION.general.MAX_UNKNOWN_DETECTION; // Número máximo de vezes que "Unknown" pode ser detectado antes de trocar de servidor
    do {
      // we are inside a loop, so lets define a "timeout" to break out of it
      // that "timeout" is detecting UNKNOWN biome 5 times in a row
      // lets check if that happened. if that hasn't happened yet, we can proceed trying to determine a biome from ocr
      if (UNKNOWN_COUNT > MAX_UNKNOWN_COUNT) {
        log.warn(`${_FUNCTION}: Biome "Unknown" detected more than ${MAX_UNKNOWN_COUNT} times, switching servers...`);
        return {
          success: false,
          detected: null,
        };
      }

      // lets determine the current biome
      detectedBiome = await this.determineBiome();

      // lets check the result. if its unknown or normal, try again, else, we can get out of the loop
      if (detectedBiome.biome === "Unknown") {
        UNKNOWN_COUNT++;
        log.unit(`${_FUNCTION}: Biome "Unknown" detected, trying again...`);
        await System.sleep(1000 * 3);
      } else if (detectedBiome.biome === "Normal") {
        log.unit(`${_FUNCTION}: Biome "Normal" detected, waiting ${INTERVAL_CHECK_NORMAL_BIOME_ENDED / 1000}s before checking again...`);
        await System.sleep(INTERVAL_CHECK_NORMAL_BIOME_ENDED);  // Delay de 10 segundos entre as tentativas
      }
    } while (detectedBiome.biome === "Normal" || detectedBiome.biome === "Unknown");

    log.unit(`${_FUNCTION}: Biome detected: ${detectedBiome.biome} with confidence: ${detectedBiome.confidence}`);

    this.DiscordNotification(detectedBiome.biome); // will async-ly handle the notification part from config (spam, ping, notify, send link etc.)
    await this.WaitForDuration(detectedBiome.biome); // will wait for biome duration if needed

    return {
      success: true,
      detected: detectedBiome, // {biome, confidence}
    };
  }
}

module.exports = {
  Biomes: new Biomes(),
};
