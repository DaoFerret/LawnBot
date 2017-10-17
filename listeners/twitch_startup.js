const { Listener } = require('discord-akairo');

//const  twitch  = require('../commands/twitch');
// used for Twitch API call (since I can't get calls to other files working ...
// we're copying the whole structure into here ... these three lines and the
// last three subroutines.
const request = require('request');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('LawnBot.db');

const DEBUG = 0;

//---------------------------------------------------
// Variables that control the iterate loop control/output:
//---------------------------------------------------
const iterate_seconds = 120;
const iterate_ms = iterate_seconds*1000;

// Keeps track of how many iterate loops we've run.
var iterate_count = 0;
// Always output every 30 minutes
const iterate_always_output = ((60*60)/iterate_seconds)/2;
//---------------------------------------------------

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
                // relies on Discord values triggered by entering/leaving "Streaming Mode"
                // Not enough for what we're doing.
//                DEBUG && debug_channel.send(`\t\t presence=${rvalue.presence}`);
//                DEBUG && debug_channel.send(`\t\t presence.game=${rvalue.presence.game}`);
//                DEBUG && debug_channel.send(`\t\t presence.game.streaming=${rvalue.presence.game.streaming}`);
//                if (!rvalue.presence.game || !(rvalue.presence.game.streaming)) {
//                    DEBUG && debug_channel.send(`\t\t\t remove user from streaming`);
                    rvalue.removeRole(stream_role);
//                }
            }
        }
        
        if (debug_channel) {
            debug_channel.send(Date()+": LawnBot restarted");
        }
        
        //kick off a setInterval to call iterateMonitored function every minute.
        setInterval(iterateMonitored, iterate_ms, value, debug_channel, stream_role, stream_channel, this.client);
    }
};

module.exports = new Listener('ready', exec, {
    emitter: 'client',
    eventName: 'ready'
});


//---------------------------------------------------------------------------
// COPIED FROM TWITCH COMMAND MODULE
// Function to iterate on the list of Monitored IDs.
// if a list_channel is passed, that is where the output will be sent, otherwise it
//      will be silent
// if a role is passed, then that is the role that is updated.
// if a stream_channel is passed, then that is where a "Guess who's streaming" message goes
async function iterateMonitored(guild, list_channel, stream_role, stream_channel, client) {
    iterate_count++;
    let log_message = "\n"+Date()+'list: server_id='+guild.id+' Iteration:'+iterate_count;

    console.log(log_message);
//    if (list_channel) {
//        list_channel.send(log_message);
//    };

    // define stats for summary message
    var total_checked = 0;      // total entries checked for this server
    var total_still_streaming = 0;
    var total_still_not_streaming = 0;
    var total_started_streaming = 0;
    var total_stopped_streaming = 0;
    // define accumulator variables for summary message
    var ids_started_streaming = [];
    var ids_stopped_streaming = [];


    // pull the list of users from the database
    db.all('SELECT discord_id, discord_name, twitch_name FROM twitch_streams where server_id="'
                +guild.id+'"', async (err, rows) => {

        for( var [index, row] of rows.entries()) {

            // Check if the user is streaming
            var is_streaming = await isStreaming(`streams/${row.twitch_name}`);

            // Get the User Object based on the DiscordID
            var current_user = await client.fetchUser(row.discord_id);

            // Grab the current user object from the guild object
            var current_member = await guild.fetchMember(current_user);

            // Check if the current_member has the Streamer Role currently
            var has_role = current_member.roles.has(stream_role.id);

            log_message = Date()+" ["+index
                    +"] DiscID="+row.discord_id
                    +", twitchID="+row.twitch_name
                    +", streaming="+is_streaming
                    +", role="+has_role;

            // increment the counter of rows checked
            total_checked++;

            // if a stream_role is defined then check if our user is streaming.
            // if they are, make sure they have the role, if they aren't 
            // make sure they don't.
            if (stream_role) {
                // If the member has the role and isn't streaming ... 
                // remove the role.
                if ( has_role == true && is_streaming == false ) {
                    log_message +=" ... Remove Streamer Showcase";
                    total_stopped_streaming++;
                    total_still_not_streaming++;
                    ids_stopped_streaming.push(row.twitch_name);
                    current_member.removeRole(stream_role);
                // else If the member doesn't have the role and is streaming ...
                // add the role.
                } else if ( has_role == false && is_streaming == true ) {
                    log_message +=" ... Add Streamer Showcase";
                    current_member.addRole(stream_role);
                    total_started_streaming++;
                    total_still_streaming++;
                    ids_started_streaming.push(row.twitch_name);
                } else if ( has_role == true && is_streaming == true ) {
                    log_message +=" ... Keep Streamer Showcase";
                    total_still_streaming++;
                } else if ( has_role == false && is_streaming == false ) {
                    log_message +=" ... Stay Normal User";
                    total_still_not_streaming++;
                }
            } // if (stream_role)

            console.log(guild.id+': '+log_message);
        
            // If we're outputting to a List command ... output
//            if (list_channel) {
//                list_channel.send(log_message); 
//            }

        } // for loop

        let summary_message = "\n"+Date()+'list: server_id='+guild.id +"\n";
        summary_message += `Total TwitchIDs checked: ${total_checked} = Total Streaming: ${total_still_streaming} / Total Not Streaming: ${total_still_not_streaming}\n`;
        summary_message += `Started Streaming (${total_started_streaming}): `+ids_started_streaming.join(', ')+`\n`;
        summary_message += `Stopped Streaming (${total_stopped_streaming}): `+ids_stopped_streaming.join(', ')+`\n`;
        console.log(summary_message);

        if (
            list_channel && (
                (total_started_streaming>0) || (total_stopped_streaming>0)
                || (iterate_count%iterate_always_output==0)
            )
        ) {
            list_channel.send(summary_message);
        }
    }); // db.all
}


// function that checks streaming status
async function isStreaming(twitch_name) {
        let obj = await twitchAPI(twitch_name);
        if (obj.stream) { return true; }
        else { return false; }
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

            // if we have an error, then we assume that we don't
            // have a body, so we process and output the error ...
            if (err) {
                console.log(`Error in Request: ${err}`);
                
            // otherwise we assume we have a body and keep processing through the event flow.
            } else {
                try {
                let object = JSON.parse(body);
//                console.log('api: object=%j', object);
                resolve(object);
                } catch (e) {
                    console.log("Error in JSON parsing");
                    console.log(e);
                    return;
                }
            }
        });
    });
}
