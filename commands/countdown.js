const { Command } = require('discord-akairo');
const Discord = require("discord.js");
//const moment = require('moment');

// hash of dates we're counting down to
var countdown_dates = new Map();
//
//countdown_dates.set(moment.utc('2017-07-18 17:00:00 UTC'), 'PS4 Preoder Only');
countdown_dates.set("2017-07-18 17:00:00 UTC",'PS4 Preoder Only - 2017-07-18 5pm UTC');
// 'D2 Beta Start - PS4 Preoder Only' - 2017-07-18 10am PST
// 'D2 Beta Start - XB1 Preoder Only' - 2017-07-19 10am PST
// 'D2 Beta Start - Open Beta' - 2017-07-21 10am PST
// 'The Farm (1 hour only!)' - 2017-07-23 10am PST
// 'D2 Beta End - 2017-07-23 9pm PST'


function exec(message, args) {

//    var now = moment([]);

    // call the display_countdowns function with the current channel
//    for (var [key, value] of countdown_dates.entries()) {
//        message.channel.send(`${value} = ${getTimeRemaining(key)}`);
//    }
    display_countdowns(message.channel);

    //error(message);
//    return message.reply('Pong! User='+mUser+', id='+mID+', Channel='+mChannel+', Server='+mGuild+', Server Owner='+mGuildOwner+'Server\'s Channels='+mGuildsChannels.array() );
}

module.exports = new Command('countdown', exec, {
    aliases: ['countdown']
});

function display_countdowns(channel) {
    const embed = new Discord.RichEmbed()
        .setTitle("Early Warning Sat-Net Offline!")
        .setColor(0x3333ff)
        .setDescription(" All Guardians Report to the Tower A.S.A.P.")
        .setURL("https://www.youtube.com/watch?v=bagCdMUuevQ&t=21")
        .setFooter("From LawnBot, \"when you care enough to, 'GTFO my lawn!'\"")
//        .setImage("http://images.eurogamer.net/2017/articles/2017-07-07-15-07/beta_access.jpg/EG11/resize/600x-1/quality/80/format/jpg")
//        .setImage("https://images.discordapp.net/attachments/331772288913375234/338759686318850058/unknown.png")
        .setThumbnail("https://lh5.googleusercontent.com/8TMhq5xIJpqTtDpfm8aSX3gDrjvBOx8CqmcBZV3yHOJeSSFN6Q2HhZPtb9EnVoNz8fiI6tCTpsSGRimcPvfk2KnOmO4MGH-YU9o-H1p7Mdr3xTYWOPYIXEKXw9jnkBLZOMstSyd5")
        .setTimestamp()
// Title/Contents
//        .addField("PS4 Pre-Order Only - 2017-07-18 5pm UTC", getTimeRemaining("2017-07-18 17:00:00 UTC"))
//        .addField("XB1 Pre-Order Only - 2017-07-19 5pm UTC", getTimeRemaining("2017-07-19 17:00:00 UTC"))
//        .addField("Open Beta Start - 2017-07-21 5pm UTC", getTimeRemaining("2017-07-21 17:00:00 UTC"))
//        .addField("The Farm __(1hr Only!)__ - 2017-07-23 5pm UTC", getTimeRemaining("2017-07-23 17:00:00 UTC"))
//        .addField("Beta Ends - 2017-07-26 1am UTC **(UPDATED)**", getTimeRemaining("2017-07-26 01:00:00 UTC"))
//        .addField("Early Warning Net Offline", "All Guardians Report to the Tower")
//        .addField("Console Launch (rolling Midnight release) - 2017-09-06 UTC", getTimeRemaining("2017-09-06 00:00:00 UTC"))
//        .addField("Console Launch USA- 2017-09-06 EDT", getTimeRemaining("2017-09-06 00:00:00 EDT"))
        .addField("PC Simultaneous Worldwide Launch - 2017-10-24 19:00 UTC", getTimeRemaining("2017-10-24 19:00:00 UTC"))
//        .addField("This is a field title, it can hold 256 characters",
//            "This is a field value, it can hold 2048 characters.")
//        .addField("Inline Field", "They can also be inline.", true)
//        .addBlankField(true)
//        .addField("Inline Field 3", "You can have a maximum of 25 fields.", true)
        ;

    channel.send({embed});
}


function getTimeRemaining(endtime){
  var t = Date.parse(endtime) - Date.parse(new Date());
  var seconds = Math.floor( (t/1000) % 60 );
  var minutes = Math.floor( (t/1000/60) % 60 );
  var hours = Math.floor( (t/(1000*60*60)) % 24 );
  var days = Math.floor( t/(1000*60*60*24) );
  if (days < 0) { return 'LIVE NOW!'; }
  return `Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
//  return `Total: ${t}, Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
/*  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
*/
}
