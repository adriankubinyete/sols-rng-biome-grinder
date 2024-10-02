
const CONFIGURATION = {
    roblox: {
        private_server_link: "",
    },
    discord: {
        webhook_url: "",
        ping: [""], // if its an discord role, prefix with & : i.e &123129312312
    },
    biomes: {
        'Glitch': {
            auto_pop_hp: false,
            spam_ping: false,
            notify: true,
            ping: true,
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
            notify: true,
            ping: false,
        },
    },
}

module.exports = CONFIGURATION