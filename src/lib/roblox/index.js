const path = require('path');
const { windowManager } = require("node-window-manager");

// should have code related to roblox process
// get roblox window size
// join server
// confirm join
// leave server
// confirm leave

class RobloxNotOpen extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class Roblox {
    constructor(debug = true) {
        this.debug = debug;
        this.robloxProcessId = null;
        this.ROBLOX_EXECUTABLE_NAME="RobloxPlayerBeta.exe" 
    }
    
    Window() {
        const windows = windowManager.getWindows();
        const robloxWindow = windows.find(window => window.path.includes(this.ROBLOX_EXECUTABLE_NAME))
        // If everything goes right, we're expecting to see "RobloxPlayerBeta.exe" at the end of executable path of this window
        // path: 'C:\\Users\\<USER>\\AppData\\Local\\Roblox\\Versions\\version-b591875ddfbc4294\\RobloxPlayerBeta.exe'

        if (!robloxWindow) { throw new RobloxNotOpen("Could not find the Roblox process.")}

        console.log('Roblox window found:')
        console.log(robloxWindow)

        return robloxWindow;
    }

    ProcessId() {
        const robloxWindow = this.Window();

        return robloxWindow.processId
    }
    

    Position() {
        const robloxWindow = this.Window();
        const robloxBounds = robloxWindow.getBounds();

        return robloxBounds
    }

    isMinimized() {
        const robloxPos = this.Position();

        // NOTE: In theory you could set the bastard to this exact position, but I'll assume no one has a monitor this big. My bad if you do!
        return (robloxPos.x === -32000 && robloxPos.y === -32000)
    }

    isOpen() {
        try {
            this.Window(); // be aware that the game could be on closing process... (i.e: you clicked X button, it clears the window but takes a while to remove the process)
        } catch (err) {
            if (!err instanceof RobloxNotOpen) { throw err } // its not the error we expected, throw miserably
            return false // roblox is not open
        }
        return true // roblox is open
    }
}

module.exports = {
    Roblox : new Roblox()
}