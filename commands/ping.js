const { Command } = require('discord-akairo');

function exec(message) {
    return message.reply('Pong!');
}

module.exports = new Command('ping', exec, {
    aliases: ['ping']
});
