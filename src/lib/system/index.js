// should have code related to ocr:
// screenshot function
// readscreen function
// taskkill command
const path = require("path");
const robot = require("robotjs"); // screen to bitmap, and user input
const { Jimp } = require("jimp"); // bitmap to image, and image manipulation
const Tesseract = require("tesseract.js"); // image to text (ocr)
const fs = require("fs"); // check file exists, unlink image files
const nwm = require("node-window-manager");
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

  // output should be the ENTIRE file path, WITH extension
  // i.e: C:\Users\<USER>\Desktop\screenshot.png
  Screenshot(coordinates, output, config = {}) {
    const _FUNCTION = "System:Screenshot";

    const { RETURN_IMAGE_PATH = config?.RETURN_IMAGE_PATH || true } = config;

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

      if (RETURN_IMAGE_PATH) {
        return output;
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
