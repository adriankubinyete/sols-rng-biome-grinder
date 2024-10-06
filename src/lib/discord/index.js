const path = require("path");
const { CONFIGURATION } = require(path.resolve("src/config"));
const { System } = require(path.resolve("src/lib/system"));
const { getCurrentTimeFormatted } = require(path.resolve("src/lib/utils"));
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { Logger } = require( path.resolve("src/lib/utils/logger") );
const log = new Logger('Discord', false).setLevel(999).setLocation(path.resolve("logs/srbg.log")).create()

class Discord {
    constructor(debug = true) {
        this.debug = debug;
        this.webhook_url = CONFIGURATION.discord.webhook_url;
        this.hook = new Webhook(this.webhook_url);
        this.message = null;
    }

    Message(data) {
        const _FUNCTION = "Discord:Message";
        
        const {
            embed = data?.embed || true,              // true   / false // by default assumes we are sending an embed.
            text = data?.text || false,               // string / false
            color = data?.color || false,             // string / false
            title = data?.title || false,             // string / false
            link = data?.link || false,               // string / false
            description = data?.description || false, // string / false
            timestamp = data?.timestamp || false,     // true   / false
        } = data;

        if (embed) {
            this.message = new MessageBuilder()
            if (text) this.message.setText(text)
            if (color) this.message.setColor(color)
            if (title) this.message.setTitle(title)
            if (description) this.message.setDescription(description)
            if (link) this.message.setURL(link)
            if (timestamp) this.message.setTimestamp()
        } else {
            if (!text) throw new Error('Discord:Message - text is required when embed is false');
            if (color || title || description || timestamp || link) {
                log.warn('Discord:Message - color, title, description and timestamp are only applied when embed is true');
            }
            this.message = text;
        }

        return this;
    }

    // biome_duration / ping_interval = amount of pings (to fill 1 ping every interval for entire duration)
    async SpamPing(pings, amount, interval = 5000) {
        const _FUNCTION = "Discord:PingSpam";

        for (let i = 0; i < amount; i++) {

            try {
                await this.Message({ embed: false, text: pings }).Send();
            } catch (error) {
                log.error(`${_FUNCTION} - Failed to send message: ${error.message}`);
                log.error(error.stack);
            }

            await System.sleep(interval);
        }

    }

    async Send() {
        return await this.hook.send(this.message)
    }
}

module.exports = {
    Discord: new Discord(),
};
