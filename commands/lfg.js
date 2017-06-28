const { Command } = require('discord-akairo');

function exec(message) {
    return message.reply("OMC currently uses the100 for our scheduling needs: <https://www.the100.io/g/3975?r=174816>");
}

module.exports = new Command('lfg', exec, {
    aliases: ['lfg']
});
