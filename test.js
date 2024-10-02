const path = require('path');
const { Roblox } = require(path.resolve('src/lib/roblox'));

// console.log(Roblox.Position())

console.log(Roblox.isOpen())
// const { windowManager } = require("node-window-manager");

// // Listar todas as janelas
// const windows = windowManager.getWindows()

// // Procurar, na lista de janelas, qual tem o termo "Roblox" nela
// const robloxWindow = windows.find(window => window.getTitle().includes('Roblox')) // this failed for @skies, gotta make some tests if possible

// // Pegar o tamanho, as bounds da janela
// if (robloxWindow) {
//     const bounds = robloxWindow.getBounds();
//     const { x: rX, y: rY, width: rW, height: rH } = bounds
//     console.log(`Roblox is at [${rX},${rY}], with width: ${rW} and height: ${rH}`)
// }