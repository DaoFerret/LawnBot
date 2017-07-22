const { Command } = require('discord-akairo');

// used for Twitch API call
const request = require('request');

// DataBase code
// Schema:
// CREATE TABLE twitch_streams ( table_id INTEGER PRIMARY KEY ASC, 
//      server_id INTEGER, discord_id INTEGER, 
//      discord_name TEXT, twitch_name TEXT );

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('LawnBot.db');


//--------------------------------------------
// Function to monitor Twitch activity of our users.
//--------------------------------------------

// Function to handle the interactive commands.
async function exec(message, args) {
    // if the user is not authorized, then just ignore the Command
    if (!is_authorized(message)){ 
        return message.reply('unauthorized user'); 
    }
    
    //--------------------------------------------
    // If we get this far, then we are authorized.
    //--------------------------------------------
    
    // If the subcommand is empty, list the help
    if (args.subcommand == '') {
        return message.channel.send('command:\n'
                            +'\t!twitch list - list the streamers/users being watched\n'
                            +'\t!twitch del <discord_id> - delete the listed discord user\n'
                            +'\t!twitch add <discord id> <twitch id>- add the user to the "Streamers Showcase" list\n'
        );
    // List the users we're watching
    } else if (args.subcommand == 'list') {

        // Check if we have a "Streamers" channel, find it so we can output
        const stream_channel = message.guild.channels.find('name', 'streamers');

        // Check if we have a "Streamer Showcase" Role
        const stream_role = message.guild.roles.find("name", "Streamer Showcase");

        // Call the subroutine that iterates over the list of users.
        // This function is also used by the Timer function that monitors active users.
        iterateMonitored(message.guild, message.channel, stream_role, stream_channel, this.client);

    // add a user we want to watch
    } else if (args.subcommand == 'add') {
        // Make sure both arguments aren't blank.
        // If one of them is, then return with an error message.
        if ((args.param1 == '') || (args.param2 == '')) {
            message.channel.send('param1='+args.param1+', param2='+args.param2);
            message.channel.send('missing parameter: Usage\n!twitch add <discord id> <twitch id>- add the user to the "Streamers Showcase" list\n');
            return;
        }
    
        // compute the User ID number:
        let arg_id = stripToID(args.param1);

        message.channel.send('add: message.guild.id='+message.guild.id
            +', discord_name='+args.param1+', discord_id='+arg_id
            +', twitch_name='+args.param2);
        //Check if the twitch streamer is already being watched:
        
        //If it isn't, then perform INSERT operation:
        db.run("INSERT into twitch_streams(server_id,discord_id,discord_name,twitch_name) VALUES ('"
                +message.guild.id+"', '"+arg_id+"', '"+args.param1+"', '"+args.param2+"')");

    // del a user we were watching
    } else if (args.subcommand == 'del') {
        message.channel.send('del: server_id='+message.guild.id+', discord_name='+args.param1);
        //Perform DELETE operation
        db.run("DELETE from twitch_streams where server_id="+message.guild.id
                +" and discord_name ='"+args.param1+"'");
    }
//    return message.reply('');
}

module.exports = new Command('twitch', exec, {
    aliases: ['twitch', 'streamer'],
    args:[        
        {
            // Subcommand
            id: 'subcommand',
            type: [
                ['add', 'new'],
                ['del', 'delete'],
                ['list', 'show']
            ],
            default: ''
        },
        {
            id: 'param1',
            type: String,
            default: ''
        },
        {
            id: 'param2',
            type: String,
            default: ''
        }
    ]
});


// Function to determine if a user is authorized to run this Command
async function is_authorized(message){
    // debug dump of user permissions
    let roleMods = message.guild.roles.find("name", "fun police");

    // if the user is the server owner then they are authorized
    // if the user has server "admin" permissions then they are authorized
    if (message.member.hasPermission("ADMINISTRATOR")) {
        return true;
    } else if(message.member.roles.has(roleMods.id)) {
        return true;
    }
    
    // Otherwise the user is not authorized
    return false;
}

// Function to iterate on the list of Monitored IDs.
// if a list_channel is passed, that is where the output will be sent, otherwise it
//      will be silent
// if a role is passed, then that is the role that is updated.
// if a stream_channel is passed, then that is where a "Guess who's streaming" message goes
async function iterateMonitored(guild, list_channel, stream_role, stream_channel, client) {
        if (list_channel) {
            list_channel.send('list: server_id='+guild.id);
        };
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
            // if the current_user isn't at least a Promise ... return
//            if (!current_user) { return; }

            // Force the user_object promise to resolve before continuing
            current_user.then( (result2) => {
//                console.log('result (is_streaming):');
//                console.log(result);
//                console.log('result2 (current_user):');
//                console.log(result2);

                // Grab the current user object from the guild object
                var current_member = guild.fetchMember(result2);

                current_member.then( (result3) => {
                    console.log("guild="+guild.id+", discord_id="+row.discord_id, ", current_member="+result2);
//                    console.log(result3);

                    var has_role = result3.roles.has(stream_role.id);

                    // If we're outputting to a List command ... output
                    if (list_channel) {
                        list_channel.send("Discord User: "+row.discord_id+", Discord Name="+row.discord_name
                        +", twitch_name="+row.twitch_name+", is_streaming="+result+", has_role="+has_role ); 
                    }

                    // if a stream_role is defined then check if our user is streaming.
                    // if they are, make sure they have the role, if they aren't 
                    // make sure they don't.
                    if (stream_role) {
                        // If the member has the role and isn't streaming ... 
                        // remove the role.
                        if ( has_role == true && result == false ) {
                            list_channel.send("Remove Streamer Showcase");
                            result3.removeRole(stream_role);
                        // else If the member doesn't have the role and is streaming ...
                        // add the role.
                        } else if ( has_role == false && result == true ) {
                            list_channel.send("Add Streamer Showcase");
                            result3.addRole(stream_role);
                        } else if ( has_role == true && result == true ) {
                            list_channel.send("Keep Streamer Showcase");
                        } else if ( has_role == false && result == false ) {
                            list_channel.send("Stay Normal User");
                        }

                    } // if (stream_role)
                });  // result3
            });  // result2
        });  // result
    });  // db.each
}

function stripToID(var_in) {
        var_in = var_in.slice(2);
        var_in = var_in.slice(0, (var_in.length-1));
	first_char = var_in.slice(0, 1);
        // hack to handle MeatlessComic having a Snowflake ID that had a "!" in it.
        if (first_char == '!') {
            var_in = var_in.slice(1, (var_in.length));
        }
        return var_in;
}

// External declaration of main function.
exports.externalIterate = function(guild, list_channel, stream_role, stream_channel, client) {
    iterateMonitored(guild, list_channel, stream_role, stream_channel, client);
}

// takes in an ID Guild and ID number and returns a bool
// indicating if the ID is being watched for that guild
/*module.exports.isWatchedID = function(guildid_in, id_in) {
    db.get('SELECT discord_id, discord_name FROM twitch_streams where server_id="'
                +guildid_in+" and discord_id="+id_in, (err, row) => {
                if (row == undefined) { return false; }
                else { return true; }
                });
}
*/

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

// helper function to take the Twitch tree and serialize it/clean it up
async function serializeFromAPI(twitch_name) {
    var endpoint = 'streams/'+twitch_name;
    var data = twitchAPI(endpoint);
    data.then(function(result) {
        console.log('serializeFromAPI1:');
        console.log(result);
        return result;
    });
    console.log('serializeFromAPI2:'+data);
    return data;
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



// code snipped from an earlier version of the list function
// (saved for reference and in case I need it)
/*        message.channel.send('list: server_id='+message.guild.id+', discord_id='+args.param1);
        // pull the list of users from the database
        db.each('SELECT discord_id, discord_name, twitch_name FROM twitch_streams where server_id="'
                +message.guild.id+'"', (err, row) => {

            // Check if the user is streaming
            var is_streaming = isStreaming(`streams/${row.twitch_name}`);
//            twitchObj = twitchAPI(`streams/${row.twitch_name}`);
//            serializeFromAPI(row.twitch_name);
//                console.log('after log:'+twitchObj);


*//*            let is_streaming = false;
            let is_streaming_url = '';
            // Is the Game property defined?
//            console.log( (this.client.fetchUser(row.discord_id) ));
//            console.log( this.client.fetchUser(155363784712650752) );
//DF            let check_user = this.client.users.get(row.discord_id);
            
            if (check_user.presence.game) {
                // If so, then if streaming is true, then toggle the bit 
                // and grab the URL
                if (check_user.presence.game.streaming == true) { 
                    is_streaming = true;
                    is_streaming_url = check_user.presence.game.url;
                }
            } *//*
            is_streaming.then( function(result) {
                message.channel.send("Discord User: "+row.discord_id+", Discord Name="+row.discord_name
                    +", twitch_name="+row.twitch_name+", streaming="+result 
//                    +", url="+is_streaming_url+", check_user="+check_user
                );
            });
        }); 
*/
