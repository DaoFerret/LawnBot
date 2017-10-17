const { Listener } = require('discord-akairo');

const DEBUG = 0;

//---------------------------------------------------
// Variables that control the iterate loop control/output:
//---------------------------------------------------

function exec(guild_member) {

    // Check if we have a bot-debug channel for debug output.
    const debug_channel = guild_member.guild.channels.find('name', 'bot-debug');

    // Check if we have a "Clan Maintenance" channel, find it so we can output
    const clan_maintenance_channel = guild_member.guild.channels.find('name', 'clan_maintenance');

//        DEBUG && debug_channel.send(`key=${key}, value=${value}`);
//        DEBUG && debug_channel.send(`\tchannel=${stream_channel}, role=${stream_role.name}`);

    if (clan_maintenance_channel) {
        clan_maintenance_channel.send("**Removed Member**: "+guild_member.displayName+" ,( <@"+guild_member.id+"> ) has left the OMC Discord");
    }
};

module.exports = new Listener('guildMemberRemove', exec, {
    emitter: 'client',
    eventName: 'guildMemberRemove'
});
