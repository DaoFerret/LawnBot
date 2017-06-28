const { Command } = require('discord-akairo');

function exec(message, args) {
    // pull out the user
    mUser = message.author;
    
    mID = mUser.id;

    // pull out the channel
    mChannel = message.channel;

    // pull out the server
    mGuild = message.guild;

    // Guild Owner
    mGuildOwner = mGuild.owner;

    // see if the Calendar channel exists.
    // write a new message to the calendar channel    
    // Guilds/Channels
    mGuildsChannels=mGuild.channels
    const channelName='calendar'
    const channel = message.guild.channels.find('name', channelName);

    // If we find the channel, use it ... otherwise let the user know
    if (channel) {
        // Send the message, mentioning the member
        channel.send(`Hi, ${mUser}`);
    } else {
        mUser.send('Server:'+mGuild+', Channel='+channelName+' not found');
    }
    
    //error(message);
    return message.reply('Pong! User='+mUser+', id='+mID+', Channel='+mChannel+', Server='+mGuild+', Server Owner='+mGuildOwner+'Server\'s Channels='+mGuildsChannels.array() );
}

module.exports = new Command('ping', exec, {
    aliases: ['ping']
});
