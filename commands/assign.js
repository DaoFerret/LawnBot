const { Command } = require('discord-akairo');

// Toggle debug messages on/off.
let DEBUG = 0;

function exec(message, args) {
    (DEBUG) && message.reply ('user='+message.member+', assign: args='+args.location);
    //---
    // Check if the user is currently a member of any TZ Groups
    //---
    // grab the roles we're interested in:
    // mutually exclusive TZ roles
    let rolePST = message.guild.roles.find("name", "USWest");
    let roleEST = message.guild.roles.find("name", "USEast");
    let roleGMT = message.guild.roles.find("name", "EUWest");
    let roleMSK = message.guild.roles.find("name", "EUEast");
    let roleLST = message.guild.roles.find("name", "Other");
    
    // toggle roles:
    let roleRaidRookie = message.guild.roles.find("name", "raidrookie");
    
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
        return message.reply('command: !assign [ USWest | USEast | EUWest | EUEast | Other | none (to remove)]\n'
                            +'\t[raidrookie] - toggles raidrookie status on/off');

    } 
    
    // if we do have a location:
    if (args.location == 'none') {
        // Unassign from raidrookie (if its set)
        if (message.member.roles.has(roleRaidRookie.id)) {
            // clear the role from the member
            message.member.removeRole(roleRaidRookie);
            message.reply('Removed from role: '+roleRaidRookie+'.');
        }
        // Unassign from former location role (if there is one)
        //member.removeRole(currentRole).catch(console.error);
        if (currentRole) { 
            (DEBUG) && message.reply ("processing 'none'");
            message.member.removeRole(currentRole);
            return message.reply('Removed from role: '+currentRole+'.');
        }
    } 
    
    // Otherwise we use the new location role to process the user
    if ((args.location == 'PST') || (args.location == 'EST') || 
        (args.location == 'GMT') || (args.location == 'MSK') || 
        (args.location == 'LST')) {
        (DEBUG) && message.reply ("processing new location role");
        // if the new role is the same as the current, ignore it all and exit.
        if (currentRole == newRole) {
            return message.reply('Already assigned to: '+currentRole+'.');
        } else {
            // Unassign from former location role
            //member.removeRole(currentRole).catch(console.error);
            if (currentRole) { message.member.removeRole(currentRole); }
            // Assign to new location role
            //member.addRole(newRole).catch(console.error);
            message.member.addRole(newRole);
            return message.reply('Welcome to: '+newRole+'.');
        }
    }

    // if we're toggling raidrookie:
    if (args.location == 'raidrookie') {
        // If the member has the role already
        if (message.member.roles.has(roleRaidRookie.id)) {
            // clear the role from the member
            message.member.removeRole(roleRaidRookie);
            return message.reply('Removed from: '+roleRaidRookie+'.');
        } else {
            // else assign the role to the member
            message.member.addRole(roleRaidRookie);
            return message.reply('Welcome to: '+roleRaidRookie+'.');
        }
    }

    return message.reply('Guru Meditation Error: Please tell the sysadmin the left front wheel fell off of LawnBot');
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
                ['none'],
                ['raidrookie']
            ],
            default: ''
        }
    ]
});
