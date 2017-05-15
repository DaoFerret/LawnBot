const { Inhibitor } = require('discord-akairo');

function exec(message) {
    // He's a meanie!
    const blacklist = ['312515268339433472'];
    return blacklist.includes(message.author.id);
}

module.exports = new Inhibitor('blacklist', exec, {
    reason: 'blacklist',
    type: 'all'
});
