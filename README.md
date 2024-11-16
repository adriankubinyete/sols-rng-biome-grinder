# >>> <!> PEOPLE COMING FROM SKIES VIDEO, READ THIS <!> <<<
PLEASE do not use this anymore. **It does NOT work for Eon 1**. It was meant for Era 9. // (alignment issues that I am meant to update because the UI changed in this new update)

I can't promise I'll make an Eon 1+ version of this, as I've grown tired of this game.
You might be able to find someone working on a similar project of this.

Good luck glitched hunting!

# - What?
This is a hobby project I tried to implement from an idea I had, after noticing you could create a fresh private server and spawn into a biome directly.

It aims to keep the player in the Normal biome for the longest amount of time possible.because that way we can roll any biome.

# - Considerations!
Huge thanks to [dolphSol-Macro](https://github.com/BuilderDolphin/dolphSol-Macro), which I utilized some of it's logic to implement biome-identification (because mine was quite bad) and position for OCR readings based on roblox's window position (holy damn, thats annoying). This project is not meant to undertake or compete with dolphSol-macro in no way shape or form, but be an extra utility which dolphSol-macro currently doesn't have! You are free to utilize my parts of this code if it helps you in any way.

# - Why?
If we stay in Normal biome, we can go to any other biome, we just need to roll the dice. We don't want to waste precious 10 minutes waiting on an useless Starfall or Corruption.

You can't go from Starfall to Glitch, for instance. Starfall has to end first.

"Oh, but It happened to me once, it went from Starfall straight to another biome!" 

- No, it did not. The previous biome ended, it became Normal, and on the first second (or first frame) of the Normal biome, you rolled another biome. Thats why it went "straight" to the new biome. To be perfectly clear, you can't `Starfall -> Starfall`. You have to `Starfall -> Normal -> Starfall`. Since Normal biome isn't announced in chat, if you roll on the first second, it seems seamless.

# - How?
The idea is simple: we join a fresh private server, and monitor (through reading the screen) the current biome. If its Normal biome, we keep monitoring it until it changes.

Once the biome changes, we check if it's of interest to us: notify about it, ping on discord, etc. Also, if it's an biome of interest, we will NOT create a new server until the biome ends.

If it's not a biome of interest for us, we simply create a new server, and repeat the process.


This opens the potential for multiple peoples to run this script at the same time, every one of them in their respective private server, but announcing interesting biomes in a single discord. This actually gives meaning to Glitch Hunting parties. Simply run the program, set interest only in Glitch, and announce to the same server everyone else does. Once someone finds Glitch, the program automatically sends the discord notification (if configured), and with that, the private server link so everyone else can join.

^ If someone follows up on the idea above, I would suggest 20-player parties, so you all can fill a single server without problem.

# - Estimates?
With really rough estimates, it should take about 250 hours for ONE player running this program to find glitch biome.
If we scale that using the same estimate, it should take around 12.5 hours for TWENTY players to find glitch biome.

(PS: this is PROBABLY wrong, it's from the old version where we didn't wait biome-change! don't quote me on that! correct me and ill update this!)

# - The future?
Well, I would love to see this idea implemented on a real macro. This is basically just a proof-of-concept that this works, it's not very user-friendly to utilize too...
```
[ ] User interface (not sure if possible with my abilities) (probably can do with NodeJS electron-app)
[ ] Auto use heavenly potions on specific, configurable biomes (scary!)
[X] 1920x1080 (FHD) support
[X] 2560x1440 (QHD) support
[ ] 3840x2160 (UHD) support ( I'll fix this eventually, I don't have a UHD monitor to test unfortunately )
```

# - How to set up?
This project is NOT very user-friendly to utilize, it does not have an interface nor keys to stop the program easily.

To start, you will need to have NodeJS (20.17.0+) (Not tested in <20.17.0) installed. You will need to install the Chocolatey pre-requisites too, that is also available on the NodeJS installer, or else you won't be able to install the dependencies.
You will also need a Sols RNG private server link, and a discord for webhook notifications.

It will help if you can understand how to read JSON Files, because the configuration is in one of those. You will have to edit it manually to your likings (minor adjustments). It's not that hard to read, and it's well documented with comments (//).

I will assume you are running on Windows. This program has no confirmed compatibility with any other type of OS. (I only have Windows LOL)

I will also assume your screen resolution is AT LEAST 1920x1080 (FullHD). Things gets bad on lower resolution. (Clicks happens at wrong elements) (It might work, but it can't be REALLY SMALL)

I have tested the program in FHD, QHD (2k) and UHD (4k). FHD and QHD works as intended, UHD is broken (sorry for now!).

* First, install NodeJS. https://nodejs.org/en/download/prebuilt-installer
* Pay attention to the install menu. You will need to install the Chocolatey pre-requisites too.
* Download this repository as a .zip.
* Extract the zip and access the folder (this is the root folder).
* Navigate to folders "src" -> "config".
* Open file "index.js" on any text editor of your liking.
* Read through the comments (Starts with //) and configure the application to your liking.
* Return to the repository's root folder (folder before "src").
* Open your Command Prompt and run "`node -v`" to confirm NodeJS is installed.
* Run `npm install` to install the necessary dependencies for this project.
* Run `npm run app` to run the application. Before running the application, pay close attention: if you need to STOP the application, you need to go to that Command Prompt and press "CTRL+C", or simply close it.

PS: I strongly recommend you clone this repository using git, so it gets easier for you to update it. You will probably have to configure things again (sorry for now!)
