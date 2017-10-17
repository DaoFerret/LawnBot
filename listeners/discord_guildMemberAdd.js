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
        clan_maintenance_channel.send("**New Member**: "+guild_member.displayName+" ,( <@"+guild_member.id+"> ) has joined the OMC Discord");

        guild_member.send('Welcome to the **OMC** (**O**ld **M**an **C**lan) discord server\n'
+"**Please Set Your Displayed Name To The Same As Your PSN ID**\n"
+"```fix\n"
+"Clan Overview and Rules:```\n"
+"1)  Be respectful to everyone here (no racial slurs or personal attacks).\n"
+"2)  This group started as (and is still primarily) a Destiny Clan.\n"
+"3)  We ask that you socialize and team up with other members for a couple days first to ensure this is the type of environment you are looking for. (Clan tags will come after interaction)\n"
+"4)  Be chill.  We are a relatively relaxed community.\n"
+"5)  Keep Channels to their purpose. (LFG posts in LFG channel, General in General)\n"
+"6)  LFG requests should not include requirements. This also means you should not expect to be carried while dual-wielding Sidearms.\n"
+"7)  When you use lfg, if you do want to \"ping\" people to flag a message use the @(their name) directly. @here & @everyone is disabled to everyone but moderators.\n"
+"8)  No Spamming or NSFW posts.\n"
+"9)  If a Mod says stop then stop.\n"
+"10)  In other words, when in doubt:\n"
+"http://new4.fjcdn.com/pictures/Only+commandments+you+need_dacd99_5095521.jpg"
);
        guild_member.send("Please read through the #welcome-and-faq channel on our server, and then come say 'hi' in the #general_chat channel");
    }
};

module.exports = new Listener('guildMemberAdd', exec, {
    emitter: 'client',
    eventName: 'guildMemberAdd'
});
