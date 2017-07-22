const { Listener } = require('discord-akairo');

//const  twitch  = require('../commands/twitch');
// used for Twitch API call (since I can't get calls to other files working ...
// we're copying the whole structure into here ... these three lines and the
// last three subroutines.
const request = require('request');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('LawnBot.db');

const DEBUG = 1;

function exec() {

    // For each guild the bot is a member of:
    for (var [key, value] of this.client.guilds.entries()) {
        // Check if we have a bot-debug channel for debug output.
        const debug_channel = value.channels.find('name', 'bot-debug');

        // Check if we have a "Streamers" channel, find it so we can output
        const stream_channel = value.channels.find('name', 'streamers');

        // Check if we have a "Streamer Showcase" Role
        const stream_role = value.roles.find("name", "Streamer Showcase");

        DEBUG && debug_channel.send(`key=${key}, value=${value}`);
        DEBUG && debug_channel.send(`\tchannel=${stream_channel}, role=${stream_role.name}`);

        // If the role is defined, then it exists, otherwise its undefined and
        // we skip this section.
        if (stream_role) {
            // Check each member of the Role
            // remove any members
            for (var [rkey, rvalue] of stream_role.members) {
                DEBUG && debug_channel.send(`\tremove existing streamer on startup rkey=${rkey}, rvalue=${rvalue}`);
                // If any of the members in it aren't streaming, remove them.
//                DEBUG && debug_channel.send(`\t\t presence=${rvalue.presence}`);
//                DEBUG && debug_channel.send(`\t\t presence.game=${rvalue.presence.game}`);
//                DEBUG && debug_channel.send(`\t\t presence.game.streaming=${rvalue.presence.game.streaming}`);
//                if (!rvalue.presence.game || !(rvalue.presence.game.streaming)) {
//                    DEBUG && debug_channel.send(`\t\t\tremove user from streaming`);
                    rvalue.removeRole(stream_role);
//                }
            }
        }
        
        // Run the iterateMonitored function once.
//        twitch.externalIterate(guild, list_channel, stream_role, stream_channel, client) {
//        console.log('value='+value+', debug_channel='+debug_channel+', stream_role='+stream_role+', stream_channel='+stream_channel+', client='+this.client);
//        console.log('twitch='+twitch);
        //twitch.externalIterate(value, debug_channel, stream_role, stream_channel, this.client);
        
        // Call once
//        iterateMonitored(value, debug_channel, stream_role, stream_channel, this.client);

        //kick off a setInterval to call iterateMonitored function every minute.
        setInterval(iterateMonitored, 120000, value, debug_channel, stream_role, stream_channel, this.client);
    }

}

module.exports = new Listener('ready', exec, {
    emitter: 'client',
    eventName: 'ready'
});

async function theTime(value, debug_channel, stream_role, stream_channel, client) {
    debug_channel.send(Date());
}


//---------------------------------------------------------------------------
// COPIED FROM TWITCH COMMAND MODULE
// Function to iterate on the list of Monitored IDs.
// if a list_channel is passed, that is where the output will be sent, otherwise it
//      will be silent
// if a role is passed, then that is the role that is updated.
// if a stream_channel is passed, then that is where a "Guess who's streaming" message goes
async function iterateMonitored(guild, list_channel, stream_role, stream_channel, client) {
        let log_message = "\n"+Date()+'list: server_id='+guild.id;
        console.log(log_message);
        if (list_channel) {
            list_channel.send(log_message);
        };

        // define stats for summary message
        let total_checked = 0;      // total entries checked for this server
        let total_still_streaming = 0;
        let total_still_not_streaming = 0;
        let total_started_streaming = 0;
        let total_stopped_streaming = 0;
        // define accumulator variables for summary message
        let ids_started_streaming = [];
        let ids_stopped_streaming = [];

        // pull the list of users from the database
        db.each('SELECT discord_id, discord_name, twitch_name FROM twitch_streams where server_id="'
                +guild.id+'"', (err, row) => {

        // Check if the user is streaming
        var is_streaming = isStreaming(`streams/${row.twitch_name}`);
//        twitchObj = twitchAPI(`streams/${row.twitch_name}`);
//        serializeFromAPI(row.twitch_name);
//        console.log('after log:'+twitchObj);

        is_streaming.then( (result) => {
            // Fetch the user object
//            console.log(client);
//            console.log('row.discord_id:');
//            console.log(row.discord_id);

            var current_user = client.fetchUser(row.discord_id);

//            console.log('current_user:');
//            console.log(current_user);

            // Force the user_object promise to resolve before continuing
            current_user.then( (result2) => {
//                console.log('result (is_streaming):');
//                console.log(result);
//                console.log('result2 (current_user):');
//                console.log(result2);

                // Grab the current user object from the guild object
                var current_member = guild.fetchMember(result2);

                current_member.then( (result3) => {
                    //console.log("guild="+guild.id+", discord_id="+row.discord_id, ", current_member="+result2);
//                    console.log(result3);

                    var has_role = result3.roles.has(stream_role.id);

                    log_message = "DiscID="+row.discord_id
                        +", twitchID="+row.twitch_name
                        +", streaming="+result
                        +", role="+has_role;

                    total_checked++;

                    // if a stream_role is defined then check if our user is streaming.
                    // if they are, make sure they have the role, if they aren't 
                    // make sure they don't.
                    if (stream_role) {
                        // If the member has the role and isn't streaming ... 
                        // remove the role.
                        if ( has_role == true && result == false ) {
                            log_message +=" ... Remove Streamer Showcase";
                            total_stopped_streaming++;
                            ids_stopped_streaming.push(row.twitch_name, true);
                            result3.removeRole(stream_role);
                        // else If the member doesn't have the role and is streaming ...
                        // add the role.
                        } else if ( has_role == false && result == true ) {
                            log_message +=" ... Add Streamer Showcase";
                            result3.addRole(stream_role);
                            total_started_streaming++;
                            ids_started_streaming.push(row.twitch_name, true);
                        } else if ( has_role == true && result == true ) {
                            log_message +=" ... Keep Streamer Showcase";
                            total_still_streaming++;
                        } else if ( has_role == false && result == false ) {
                            log_message +=" ... Stay Normal User";
                            total_still_not_streaming++;
                        }
                    } // if (stream_role)

                    console.log(guild.id+': '+log_message);
                    
                    // If we're outputting to a List command ... output
//                    if (list_channel) {
//                        list_channel.send("Discord ID="+row.discord_id+", Discord Name="+row.discord_name
//                        list_channel.send(log_message); 
//                    }

                });  // result3
            });  // result2
        });  // result
    });  // db.each

    var summary_message = `Total TwitchIDs checked: ${total_checked}, Total Streaming: ${total_still_streaming}, Total Not Streaming: ${total_still_not_streaming}\n`;
    summary_message += `Started Streaming (${total_started_streaming}): `+ids_started_streaming.join(', ')+`\n`;
    summary_message += `Stopped Streaming (${total_stopped_streaming}): `+ids_stopped_streaming.join(', ')+`\n`;
    console.log(summary_message);

    if (list_channel) {
        list_channel.send(summary_message);
    }

}

// function that checks streaming status
async function isStreaming(twitch_name) {
        let obj = twitchAPI(twitch_name);
        return obj.then(function(result) {
//            console.log('isStreaming:');
//            console.log(result);
            if (result.stream) { return true; }
            else { return false; }
            //return obj;
        });
}

// function for accessing the the Twitch API
async function twitchAPI(endpoint, params) {
    const TWITCH_API_CLIENTID = process.env.TWITCH_API_CLIENTID;
    const baseUrl = 'https://api.twitch.tv/kraken/';
    const trailing = '';
    const queryParams = params ? `?${params}` : '';
    const url = baseUrl + endpoint + trailing + queryParams;
    return new Promise((resolve, reject) => {
        request({
            url: url,
            headers: {
                'Client-ID': TWITCH_API_CLIENTID
            }
        }, (err, res, body) => {
//            console.log('api: err=%j', err);
//            console.log('api: res=%j', res);
//            console.log('api: body=%j', body);			
            let object = JSON.parse(body);
//            console.log('api: object=%j', object);
            resolve(object);
        });
    });
}
