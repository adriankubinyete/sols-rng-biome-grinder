// so i can remember to implement this

// Função para capturar a tela e converter em buffer de imagem
function captureScreenAsBuffer(x, y, width, height) {
    const screenCapture = robot.screen.capture(x, y, width, height);
    const image = Buffer.alloc(screenCapture.width * screenCapture.height * 4); // RGBA (4 bytes por pixel)
  
    // Copiando dados do bitmap do robotjs para o buffer
    for (let i = 0; i < screenCapture.width * screenCapture.height; i++) {
      const index = i * 4;
      const color = screenCapture.image.readUInt32LE(i * 4);
      image[index] = color & 0xff; // R
      image[index + 1] = (color >> 8) & 0xff; // G
      image[index + 1] = (color >> 16) & 0xff; // B
      image[index + 3] = 255; // A (opacidade total)
    }
  
    return {
      buffer: image,
      width: screenCapture.width,
      height: screenCapture.height,
    };
  }
  
  // Função para aplicar a matriz de cores
  function applyColorMatrix(imageData, matrix) {
    const data = imageData.data;
  
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
  
    return imageData;
  }
  
  // Função para aplicar múltiplos efeitos e identificar bioma
  async function identifyBiomes(x, y, width, height) {
    for (let index = 1; index <= 10; index++) {
      // Captura a tela e processa a imagem
      const {
        buffer,
        width: capturedWidth,
        height: capturedHeight,
      } = captureScreenAsBuffer(x, y, width, height);
  
      // Redimensiona a imagem
      const newWidth = Math.round(300 + index * 38);
      const newHeight = Math.round(70 + index * 7.5);
  
      // Usando sharp com o buffer capturado
      const resizedImage = await sharp(buffer, {
        raw: {
          width: capturedWidth,
          height: capturedHeight,
          channels: 4,
        },
      })
        .resize(newWidth, newHeight) // Redimensiona a imagem
        .raw() // Garante que estamos trabalhando com os dados brutos da imagem
        .toBuffer();
  
      // Definindo a matriz de cores
      const colorMatrix = [
        2, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0.2,
        0, 1,
      ];
  
      // Aplicar a matriz de cor
      const imageData = {
        data: resizedImage,
        width: newWidth,
        height: newHeight,
      };
      const transformedData = applyColorMatrix(imageData, colorMatrix);
  
      // Aplicar o OCR (exemplo fictício)
      const ocrResult = await ocrFromBitmap(transformedData.data); // Você precisa implementar o OCR a partir do bitmap
      const identifiedBiome = identifyBiome(ocrResult);
  
      // Verifica se o bioma foi identificado
      if (identifiedBiome) {
        console.log(`Bioma identificado: ${identifiedBiome}`);
        break; // Sai do loop se o bioma foi identificado
      }
  
      // Se necessário, limpe ou descarte a imagem
    }
  }
  
  // Exemplo de uso: Chame identifyBiomes com a posição e dimensões desejadas
  identifyBiomes(0, 0, 500, 500).catch((err) => console.error("Erro:", err));
  
  
  // todo(adrian): reimplement everything thats here about image processing, but better and organized.