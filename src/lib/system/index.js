// should have code related to ocr:
// screenshot function
// readscreen function
// taskkill command
const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const robot = require("robotjs"); // screen to bitmap, and user input
const sharp = require("sharp"); // bitmap to image and image manipulation (manipulates better than jimp)
const Tesseract = require("tesseract.js"); // image to text (ocr)
const fs = require("fs"); // check file exists, unlink image files
const { Logger } = require( path.resolve("src/lib/utils/logger") );
const log = new Logger('System', false).setLevel(999).setLocation(path.resolve("logs/srbg.log")).create()
const nwm = require("node-window-manager");
const WindowManager = {
  // this is so dumb
  ...nwm.addon,
  ...nwm.windowManager,
};

class System {
  constructor(debug = true) {
    this.debug = debug;
  }

  // ----------------- utils -----------------

  sleep(ms) {
    const _FUNCTION = "System:sleep";
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  }

  _executeCommand(command) {
    const _FUNCTION = "System:_executeCommand";

    return new Promise((resolve, reject) => {
      const { exec } = require("child_process");
      exec(command, (error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  }

  // Expecting a Jimp image
  _manipulateImage(image) {
    const _FUNCTION = "System:_manipulateImage";

    // *manipulations here, if any

    return image;
  }

  CurrentMousePosition() {
    return robot.getMousePos();
  }

  getPrimaryMonitorInfo() {
    const primaryMonitorId = WindowManager.getPrimaryMonitor().id;
    return WindowManager.getMonitorInfo(primaryMonitorId);
  }

  // ----------------- commands -----------------

  async Taskkill(processId) {
    const _FUNCTION = "System:Taskkill";

    try {
      return await this._executeCommand(`taskkill /F /PID ${processId}`);
    } catch (error) {
      throw new Error(
        `Failed to kill process "${processId}": ${error.message}`
      );
    }
  }

  async StartUrl(url) {
    const _FUNCTION = "System:StartUrl";

    try {
      return await this._executeCommand(`start "" "${url}"`);
    } catch (error) {
      throw new Error(`Failed to start url "${url}": ${error.message}`);
    }
  }

  // ----------------- screenshot buffer related -----------------

  // take coordinate [x1, y1] to [x2, y2] and return a buffer
  // returns { buffer: Buffer, width: number, height: number }
  CoordinateToRawBuffer(coordinates, config = {}) {
    const _FUNCTION = "System:CoordinateToRawBuffer";

    // const {
    // } = config;
    const [[x1, y1], [x2, y2]] = coordinates;
    const width = x2 - x1;
    const height = y2 - y1;

    try {
      const screenshot = robot.screen.capture(x1, y1, width, height);
      const image = Buffer.alloc(screenshot.width * screenshot.height * 4); // RGBA (4 bytes por pixel)

      // Copiando dados do bitmap do robotjs para o buffer
      for (let i = 0; i < screenshot.width * screenshot.height; i++) {
        const index = i * 4;
        const color = screenshot.image.readUInt32LE(i * 4);

        // corrigindo a ordem dos canais de cores (BGRa -> RGBa)
        image[index] = (color >> 16) & 0xff;  // R (vem de B)
        image[index + 1] = (color >> 8) & 0xff; // G (permanece igual)
        image[index + 2] = color & 0xff;  // B (vem de R)
        image[index + 3] = 255;  // A (opacidade total)
      }

      const ourBuffer = {
        buffer: image,
        width: screenshot.width,
        height: screenshot.height,
      }
      return ourBuffer;

      // return screenshot.image;
    } catch (error) {
      log.error(`${_FUNCTION}: Failed to Screenshot ${coordinates}. Reason: ${error.message}`);
      throw error;
    }

  }

  // take screenshot from coordinate. 
  // save at  src/tests/images/screenshot-${Date.now()}.png
  // returns nothing
  async Screenshot(coordinates, config = {}) {
    const _FUNCTION = "System:Screenshot";

    // const {
    //   DELETE_AFTER_READ = config?.DELETE_AFTER_READ || true,
    //   DELETE_ON_ERROR = config?.DELETE_ON_ERROR || false,
    //   RETURN_RAW_TESSERACT_RESULT = config?.RETURN_RAW_TESSERACT_RESULT ||
    //   false,
    // } = config;

    const imageName = `screenshot-${Date.now()}.png`;
    const image = path.resolve(`src/tests/images/${imageName}`);

    const rawBuffer = this.CoordinateToRawBuffer(coordinates);
    await this.SaveRawBufferToFile(rawBuffer, image);
    return;
  }

  // filter color from buffer
  // returns { buffer: Buffer, width: number, height: number }
  async ApplyColorMatrixToRawBuffer(bitmap, matrix) {
    const _FUNCTION = "System:ApplyColorMatrixToRawBuffer";

    const data = bitmap.buffer;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]; // Red
      const g = data[i + 1]; // Green
      const b = data[i + 2]; // Blue
      const a = data[i + 3]; // Alpha

      // Aplica a matriz de cores
      data[i] = Math.min(
        255,
        Math.max(0, matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a)
      ); // New Red
      data[i + 1] = Math.min(
        255,
        Math.max(0, matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a)
      ); // New Green
      data[i + 2] = Math.min(
        255,
        Math.max(
          0,
          matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a
        )
      ); // New Blue
      // Alpha não é alterado
    }

    return bitmap;
  }

  // resize image from buffer
  // returns { buffer: Buffer, width: number, height: number }
  async ResizeFromRawBuffer(bitmap, newWidth, newHeight) {
    const _FUNCTION = "System:ResizeFromRawBuffer";

    let resizedBuffer = await sharp(bitmap.buffer, {
      raw: {
        width: bitmap.width,
        height: bitmap.height,
        channels: 4,
      },
    })
      .resize(newWidth, newHeight)
      .raw()
      .toBuffer();

    return {
      buffer: resizedBuffer,
      width: newWidth,
      height: newHeight,
    };
  }

  // save buffer to filesystem
  // returns { buffer: Buffer, width: number, height: number }
  async SaveRawBufferToFile(bitmap, output) {
    const _FUNCTION = "System:SaveRawBufferToFile";

    // Converte o buffer raw (RGBA) para PNG e salva no sistema
    return sharp(bitmap.buffer, {
      raw: {
        width: bitmap.width,  // Largura do bitmap
        height: bitmap.height, // Altura do bitmap
        channels: 4            // Número de canais (RGBA - 4 canais)
      }
    })
      .png()
      .toFile(output)
      .then(info => {
        log.unit(`${_FUNCTION} - Image saved successfully:`, JSON.stringify(info));
      })
      .catch(err => {
        log.error(`${_FUNCTION} - Error saving image: ${err.message}`);
        throw new Error(`${_FUNCTION} - Failed to write image: ${err.message}`);
      });
  }

  // read text from buffer
  // returns { text: string, confidence: number } // (and some other things from Tesseract.js ocr)
  async OCRfromRawBuffer(bitmap) {
    const _FUNCTION = "System:OCRfromRawBuffer";
    try {

      // convertendo o buffer raw RGBA para PNG
      const pngBuffer = await sharp(bitmap.buffer, {
        raw: {
          width: bitmap.width,
          height: bitmap.height,
          channels: 4 // RGBA
        }
      })
      .withMetadata({density: 300}) // tesseract, i do not care about the dpi, please just read my image
      .png()
      .toBuffer();

      const TESSERACT_OPTIONS = {
        tessedit_pageseg_mode: 6, // 0:auto, 3:default:block, 6:single line, 7:single word
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", // no special chars
        dpi: 300
      }

      // passando o buffer pro tesseract reconhecer
      const { data: ocrResult } = await Tesseract.recognize(pngBuffer, 'eng', TESSERACT_OPTIONS);

      log.unit(`${_FUNCTION} - OCR result: "${ocrResult.text.replace(/\n/g, "")}"`);
      return ocrResult
    } catch (err) {
      log.error(`${_FUNCTION} - Error recognizing text:`, err);
      throw err;
    }
  }

  // ----------------- input actions -----------------

  MouseClick(x, y) {
    robot.moveMouse(x - 5, y - 5); // teleports near objective
    robot.moveMouseSmooth(x, y); // adjust "slowly" to objective
    this.sleep(200)
    robot.mouseClick("left")
  }

  MouseMove(x, y, config = {}) {
    const _FUNCTION = "System:MouseMove";

    const {
      SLOW = config?.SLOW || false,
    } = config;

    if (SLOW) {
      robot.moveMouseSmooth(x, y);
    } else {
      robot.moveMouse(x, y);
    }

  }
}

module.exports = {
  System: new System(),
};
