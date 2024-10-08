#!/usr/bin/node

// NOTE :: Adrian, @masutty
//
// Hello! This is the configuration file.
//
// You should only really change whats under here. 
//
// Pay attention to lines that starts with "//", 
// they are comments and should explain and guide you 
// through the configuration file.
//
// You wil need to manually edit the values here to your liking. I can't do menus yet :P
// You do not need manually edit any other file besides this one.
//
// Good luck and have fun!

const USER_CONFIGURATION = {
    general: {
        // Set your desired general configs under here.
        // You dont really need to change anything here unless you know what you're doing.
        debug: false,
        fails_until_stop: 5, // how many times can unexpected errors happen before stopping once and for all
    },
    roblox: {
        // Set your desired roblox configuration under here.
        // Should only need to change the private server link. It should be the same used in Dolphsols.
        private_server_link: "https://www.roblox.com/games/15532962292/Sols-RNG-Era-9?privateServerLinkCode=83338549084739556308838773836658", // your entire private server link
    },
    discord: {
        // Set your desired discord configuration under here.
        // Should only need to change URL and ping list.
        spam_ping_interval: 1000 * 2.5, // how many milliseconds between each ping, if spam_ping is enabled. DONT set this too low, your webhook might break
        webhook_url: "https://discord.com/api/webhooks/1289755340547555359/0nTIdEsr0E3ZDal8NmsngfKvKKr6Ng51Sl3WF1NoaJJATxI0Z6dERGRH3g5LUrtDD3EP", // your entire webhook url
        ping: ["@188851299255713792"], // should be ["@<your discord id>"]. You can ping multiple users by adding another one, separated by a comma. You can also use & to ping a role, instead of @ for user. Example: ["&<role_id>","@<user_id>"] will ping both the role and the user once a ping happens.
    },
    biomes: {

        // Set your desired biomes configuration under here.
        // Should be easy enough to understand
        // just change between true and false. True means enabled, false means disabled.
        // the same configuration works for every other biome, too; I only detailed the first one.

        'Glitch': {
            send_private_server_link: true, // send private server link to discord  :: if this is enabled, notify will also happen
            auto_pop_hp: false, // auto use your heavenlies once this comes around  :: NOT YET IMPLEMENTED
            spam_ping: false,   // spam ping you when biome shows up                :: if this is enabled, ping and notify will also happen
            ping: true,         // notify AND ping you                              :: if enabled, notify will also happen
            notify: true,       // send a notification to discord
            wait_biome_end: true, // wait for biome to end before continuing
        },

        'Null': {
            notify: true,
            ping: true,
        },

        'Corruption': {
            notify: true,
            ping: true,
        },

        'Starfall': {
            notify: true,
            ping: true,
        },

        'Hell': {
            notify: true,
            ping: true,
        },

        'SandStorm': {
            notify: true,
            ping: true,
        },

        'Rainy': {
            notify: true,
            ping: false,
        },

        'Snowy': {
            notify: true,
            ping: false,
        },

        'Windy': {
            notify: true,
            ping: false,
        },

        'Normal': {
            notify: false,
            ping: false,
        },

    },
}

// You should not edit anything below here!
// This is used to export the user configuration to the rest of the code 
// with some functions and base-biome-config stuff that won't really change
//
// I repeat, DO NOT edit below here unless you know what you're doing. User-editable config is above, stinky!

const DONT_FUCKING_EDIT_THIS = {
    ...USER_CONFIGURATION,
    // biome settings that the user shouldn't bother to edit (duration, category, chance, embed color, etc)
    biomes: { 
        'Glitch': {
            // copy the user configuration for this biome
            ...USER_CONFIGURATION.biomes['Glitch'],
            // add extra stuff
            category: "biome",
            color: "#bfff00",
            chance: 30000,
            duration: 164,
        },

        'Null': {
            ...USER_CONFIGURATION.biomes['Null'],
            category: "biome",
            color: "#838383",
            chance: 13333,
            duration: 90,
        },

        'Corruption': {
            ...USER_CONFIGURATION.biomes['Corruption'],
            category: "biome",
            color: "#6d32a8",
            chance: 9000,
            duration: 660,
        },

        'Starfall': {
            ...USER_CONFIGURATION.biomes['Starfall'],
            category: "biome",
            color: "#011ab7",
            chance: 7500,
            duration: 600,
        },

        'Hell': {
            ...USER_CONFIGURATION.biomes['Hell'],
            category: "biome",
            color: "#ff4719",
            chance: 6666,
            duration: 660,
        },

        'SandStorm': {
            ...USER_CONFIGURATION.biomes['SandStorm'],
            category: "biome",
            color: "#ffc600",
            chance: 3000,
            duration: 600,
        },

        'Rainy': {
            ...USER_CONFIGURATION.biomes['Rainy'],
            category: "weather",
            color: "#027cbd",
            chance: 750,
            duration: 120,
        },

        'Snowy': {
            ...USER_CONFIGURATION.biomes['Snowy'],
            category: "weather",
            color: "#dceff9",
            chance: 600,
            duration: 120,
        },

        'Windy': {
            ...USER_CONFIGURATION.biomes['Windy'],
            category: "weather",
            color: "#9ae5ff",
            chance: 500,
            duration: 120,
        },

        'Normal': {
            ...USER_CONFIGURATION.biomes['Normal'],
            color: "#dddddd",
            notify: false,
        },

        // needed for ocr
        'Unknown': {
            color: "#838383",
            notify: false,
        }
    },

    general: {
        // copy the user configuration for this biome
        ...USER_CONFIGURATION.general,
        // add extra stuff
        WAIT_AFTER_DISCONNECT: 1000 * 10, // 10 seconds, TODO(adrian): should implement an exponential backoff on this so we get ideal timing?
        MAX_UNKNOWN_DETECTION: 5, // how many times ocr can fail to detect a biome before we say Biomes.HandleBiome() failed
        MAX_UNKNOWN_FAILS: 5, // how many times Biomes.HandleBiome() can fail before stop trying // should return a FailedToDetect error
        MAX_RECONNECTS: 5, // how many times we can try to reconnect to the game (should happen when we expect play button, for instance)
        INTERVAL_CHECK_NORMAL_BIOME_ENDED: 1000 * 5, // how many milliseconds between each check if normal biome ended
        SAVE_UNKNOWN_BIOMES: false, // should we save the screenshots used that resulted in unknown biome OCR?
    },

    getDiscordPings() { return USER_CONFIGURATION.discord.ping.map(ping => `<${ping}>`).join(' ') },
    getBiomesToPing() { return Object.keys(this.biomes).filter(biome => this.biomes[biome].ping) },
    getBiomesToSpamPing() { return Object.keys(this.biomes).filter(biome => this.biomes[biome].spam_ping) },
    getBiomesToNotify() { return Object.keys(this.biomes).filter(biome => this.biomes[biome].notify) },
    getBiomesToPop() { return Object.keys(this.biomes).filter(biome => this.biomes[biome].auto_pop_hp) }

}

module.exports = { CONFIGURATION: DONT_FUCKING_EDIT_THIS }
