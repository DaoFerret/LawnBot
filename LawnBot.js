// Node.js file for LawnBot


const { AkairoClient } = require('discord-akairo');
const DISCORD_API_KEY = process.env.DISCORD_API_KEY;

const client = new AkairoClient({
    ownerID: '312518044205187072', // or ['123992700587343872', '86890631690977280']
    prefix: '!', // or ['?', '!']
    commandDirectory: './commands/',
    listenerDirectory: './listeners/',
    inhibitorDirectory: './inhibitors/'
}, {
    disableEveryone: true
});

//console.log('lawnbot: DISCORD_API_KEY=%j', DISCORD_API_KEY);

client.login(DISCORD_API_KEY);
