// should have code related to ocr:
// screenshot function
// readscreen function
// taskkill command
const path = require("path");
const robot = require("robotjs"); // screen to bitmap, and user input
const { Jimp } = require("jimp"); // bitmap to image, and image manipulation
const sharp = require("sharp"); // bitmap to image and image manipulation (manipulates better than jimp)
const Tesseract = require("tesseract.js"); // image to text (ocr)
const fs = require("fs"); // check file exists, unlink image files
const nwm = require("node-window-manager");
const { error } = require("console");
const windowManager = {
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

  // ----------------- screen-related -----------------

  async ResizeBitmap(bitmap, newWidth, newHeight) {
    const _FUNCTION = "System:ResizeBitmap";

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

  async BitmapToFile(bitmap, output) {
    const _FUNCTION = "System:BitmapToFile";

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
        console.log(`${_FUNCTION} - Image saved successfully:`, JSON.stringify(info));
      })
      .catch(err => {
        throw new Error(`${_FUNCTION} - Failed to write image: ${err.message}`);
      });
  }

  CoordinateToBitmap(coordinates, config = {}) {
    const _FUNCTION = "System:CoordinateToBitmap";

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

      // console.log('------------------')
      // console.log('RobotJS buffer: ', screenshot.image)
      // console.log('------------------')
      // console.log('Our buffer: ', ourBuffer)

      return ourBuffer;

      // return screenshot.image;
    } catch (error) {
      console.error(
        `${_FUNCTION}: Failed to Screenshot ${coordinates}. Reason: ${error.message}`
      );
      throw error;
    }

  }

  // output should be the ENTIRE file path, WITH extension
  // i.e: C:\Users\<USER>\Desktop\screenshot.png
  Screenshot(coordinates, output, config = {}) {
    const _FUNCTION = "System:Screenshot";

    const {
      RETURN_BITMAP = config?.RETURN_BITMAP || true
    } = config;

    const [[x1, y1], [x2, y2]] = coordinates;
    const width = x2 - x1;
    const height = y2 - y1;

    try {
      const screenshot = robot.screen.capture(x1, y1, width, height);
      const bitmapBuffer = screenshot.image;

      let image = Jimp.fromBitmap({
        data: bitmapBuffer,
        width: screenshot.width,
        height: screenshot.height,
      });

      image = this._manipulateImage(image);

      image.write(output);

      if (RETURN_BITMAP) {
        return bitmapBuffer;
      }

      return;
    } catch (error) {
      console.error(
        `${_FUNCTION}: Failed to save image to "${output}". Reason: ${error.message}`
      );
      throw error;
    }
  }

  // TODO(adrian): implement ocr from bitmap
  async OCRfromBitmap(bitmapBuffer, config = {}) {
    const _FUNCTION = "System:OCRfromBitmap";
    const {
      DELETE_AFTER_READ = config?.DELETE_AFTER_READ || true,
      DELETE_ON_ERROR = config?.DELETE_ON_ERROR || false,
      RETURN_RAW_TESSERACT_RESULT = config?.RETURN_RAW_TESSERACT_RESULT ||
      false,
    } = config;

    const image = path.resolve(`src/tests/images/${imageName}`);
    let ocrResult;
    try {
      // reading the image
      ocrResult = await Tesseract.recognize(bitmapBuffer);
    } catch (error) {
      if (DELETE_ON_ERROR) {
        console.log(
          `${_FUNCTION}: Deleting image file: "${image}" because we got an error.`
        );
        if (fs.existsSync(image)) {
          fs.unlinkSync(image);
        }
      } else {
        console.log(
          `${_FUNCTION}: We got an error, but config says to not delete the image! "${image}"`
        );
      }
      throw error;
    }
  }

  async OCRfromScreen(coordinates, config = {}) {
    const _FUNCTION = "System:OCRFromScreen";

    const {
      DELETE_AFTER_READ = config?.DELETE_AFTER_READ || true,
      DELETE_ON_ERROR = config?.DELETE_ON_ERROR || false,
      RETURN_RAW_TESSERACT_RESULT = config?.RETURN_RAW_TESSERACT_RESULT ||
      false,
    } = config;

    // generating a random image name
    const imageName = `screenshot-${Date.now()}.png`;
    const image = path.resolve(`src/tests/images/${imageName}`);
    let ocrResult;
    try {
      // taking the screenshot
      this.Screenshot(coordinates, image);
      // reading the image
      ocrResult = await Tesseract.recognize(image);
    } catch (error) {
      if (DELETE_ON_ERROR) {
        console.log(
          `${_FUNCTION}: Deleting image file: "${image}" because we got an error.`
        );
        if (fs.existsSync(image)) {
          fs.unlinkSync(image);
        }
      } else {
        console.log(
          `${_FUNCTION}: We got an error, but config says to not delete the image! "${image}"`
        );
      }

      console.error(
        `${_FUNCTION}: Failed to read screen at "${coordinates}". Reason: ${error.message}`
      );
    }

    if (DELETE_AFTER_READ) {
      fs.unlinkSync(image);
    }

    if (!ocrResult) {
      throw new Error(`Failed to read screen at "${coordinates}".`);
    }

    if (RETURN_RAW_TESSERACT_RESULT) {
      return ocrResult;
    }

    return { text: ocrResult.data.text, confidence: ocrResult.data.confidence };
  }
}

module.exports = {
  System: new System(),
};
