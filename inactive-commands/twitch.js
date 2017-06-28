const { Command } = require('discord-akairo');

// DataBase code
// Schema:
// CREATE TABLE twitch_streams ( table_id INTEGER PRIMARY KEY ASC, 
//                  server_id INTEGER, discord_id INTEGER, discord_name TEXT );
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('LawnBot.db');


//--------------------------------------------
// Function to monitor Twitch activity of our users.
// On startup: we clean out the Streamer Role
// then check each person in our database, and set their status appropriately.
//
// Every "interval" we run the check again.
//--------------------------------------------
// open the table and slurp in the existing data into the map of objects we're
// tracking




// Function to handle the interactive commands.
function exec(message, args) {
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
                            +'\t!twitch add <discord id> - add the user to the "Streamers Showcase" list\n'
        );
    // List the users we're watching
    } else if (args.subcommand == 'list') {
        message.channel.send('list: server_id='+message.guild.id+', discord_id='+args.param1);
        // pull the list of users from the database
        db.each('SELECT discord_id, discord_name FROM twitch_streams where server_id="'
                +message.guild.id+'"', (err, row) => {
                
            let is_streaming = false;
            let is_streaming_url = '';
            // Is the Game property defined?
//            console.log(this.client);
//DF            let check_user = this.client.users.get(row.discord_id);
            
/*            if (check_user.presense.game) {
                // If so, then if streaming is true, then toggle the bit 
                // and grab the URL
                if (check_user.presense.game.streaming == true) { 
                    is_streaming = true;
                    is_streaming_url = check_user.presense.game.url;
                }
            }*/
//DF            message.channel.send("Discord User: "+row.discord_id+", streaming="
//DF                +is_streaming+", url="+is_streaming_url+", check_user="+check_user);  
        }); 

    // add a user we want to watch
    } else if (args.subcommand == 'add') {
        // compute the User ID number:
        let arg_id = stripToID(args.param1);
        
        message.channel.send('add: message.guild.id='+message.guild.id
            +', discord_name='+args.param1+', discord_id='+arg_id);
        //Check if the twitch streamer is already being watched:
        
        //If it isn't, then perform INSERT operation:
        db.run("INSERT into twitch_streams(server_id,discord_id,discord_name) VALUES ('"
                +message.guild.id+"', '"+arg_id+"', '"+args.param1+"')");

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


// Code to check every X if they are on-line or not.
async function CheckUser() {
    let online = CheckOnlineStatus('daoferret');
    console.log("online status="+online);
    
    
    // If they are online and they weren't ... add them to streamers role.

    // If they aren't online and they were ... remove them from the streamers role.
}


function stripToID(var_in) {
        var_in = var_in.slice(2);
        var_in = var_in.slice(0, (var_in.length-1));
        return var_in;
}