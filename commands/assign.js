const { Command } = require('discord-akairo');

// Toggle debug messages on/off.
let DEBUG = 0;

function exec(message, args) {
    (DEBUG) && message.reply ('user='+message.member+', assign: args='+args.location);
    //---
    // Check if the user is currently a member of any TZ Groups
    //---
    // grab the roles we're interested in.
    let rolePST = message.guild.roles.find("name", "USWest");
    let roleEST = message.guild.roles.find("name", "USEast");
    let roleGMT = message.guild.roles.find("name", "EUWest");
    let roleMSK = message.guild.roles.find("name", "EUEast");
    let roleLST = message.guild.roles.find("name", "Other");
    let currentRole;
    (DEBUG) && message.reply ("\n"+'Roles: rolePST='+rolePST+
                        "\n"+'Roles: roleEST='+roleEST+
                        "\n"+'Roles: roleGMT='+roleGMT+
                        "\n"+'Roles: roleMSK='+roleMSK+
                        "\n"+'Roles: roleLST='+roleLST);

    // Determine if the member is a part of any of the groups
    if(message.member.roles.has(rolePST.id)) {
        currentRole = rolePST;
    } else if(message.member.roles.has(roleEST.id)) {
        currentRole = roleEST;
    } else if(message.member.roles.has(roleGMT.id)) {
        currentRole = roleGMT;
    } else if(message.member.roles.has(roleMSK.id)) {
        currentRole = roleMSK;
    } else if(message.member.roles.has(roleLST.id)) {
        currentRole = roleLST;
    }

    // Determine the new location Role
    let newRole
    if (args.location === 'PST') {
        newRole = rolePST;
    } else if (args.location === 'EST') {
        newRole = roleEST;
    } else if (args.location === 'GMT') {
        newRole = roleGMT;
    } else if (args.location === 'MSK') {
        newRole = roleMSK;
    } else if (args.location === 'LST') {
        newRole = roleLST;
    }
    
    (DEBUG) && message.reply ("Currently Assigned Location Role="+currentRole+
                            ", New Location Role="+newRole);
    
    // If we don't have an arg, spit out the help message and exit
    if (args.location == '') {
        (DEBUG) && message.reply ("processing blank location");
        return message.reply('command: !assign [ USWest | USEast | EUWest | EUEast | Other | none (to remove)]');

    } else if (args.location == 'none') {
        // Unassign from former location role
        //member.removeRole(currentRole).catch(console.error);
        if (currentRole) { message.member.removeRole(currentRole); }

    // Otherwise we use the new location role to process the user
    } else {
        (DEBUG) && message.reply ("processing new location role");
        // if the new role is the same as the current, ignore it all and exit.
        if (currentRole == newRole) {
            return message.reply('Already assigned to '+currentRole+'.');
        } else {
            // Unassign from former location role
            //member.removeRole(currentRole).catch(console.error);
            if (currentRole) { message.member.removeRole(currentRole); }
            // Assign to new location role
            //member.addRole(newRole).catch(console.error);
            message.member.addRole(newRole);
            return message.reply('Welcome to '+newRole);
        }
    }



    
    //return message.reply('Pong!');
}

module.exports = new Command('assign', exec, {
    aliases: ['assign'],
    cooldown: 15000,
    ratelimit: 3,
    args: [
        {
            id: 'location',
            type: [
                ['PST', 'PDT', 'US West', 'Western US', 'USWest'],
                ['EST', 'EDT', 'US East', 'Eastern US', 'USEast'],
                ['GMT', 'UK', 'Europe West', 'Western Europe', 'EUWest'],
                ['MSK', 'Europe East', 'Eastern Europe', 'EUEast'],
                ['LST', 'AETZ', 'Other', 'Lunar'],
                ['none']
            ],
            default: ''
        }
    ]
});
