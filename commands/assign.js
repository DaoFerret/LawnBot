const { Command } = require('discord-akairo');

// Toggle debug messages on/off.
let DEBUG = 0;

// Array of mutually exclusive roles
// Array of independent roles
let locations = ['USWest', 'USEast', 'Europe', 'Daytime'];
let statuses = ['raidrookie'];

function exec(message, args) {
    (DEBUG) && message.reply ('user='+message.member+', assign: args='+args.location);

    //-------------------------------------------------------
    // Build current lookup tables
    //-------------------------------------------------------
    // temp role used during lookup table setup to minimize API calls.
    let temp_role;
    
    // build the map of location roles (in both directions).
    let location_to_role = new Map();
    let role_to_location = new Map();
    
    // used to hold the current role ... we check for it as we build the Maps.
    let current_role;
    
    // for each entry in locations
    for (let i=0; i<locations.length; i++) {
        // if there is a corresponding Role in this server, add it to the Maps.
        if (temp_role = message.guild.roles.find("name", locations[i])) {
            location_to_role.set(locations[i], temp_role);
            role_to_location.set(temp_role, locations[i]);
            
            // Check if the current Role is the one the user has,
            // if so, then set the currentRole variable.
            if(message.member.roles.has(temp_role.id)) {
                current_role = temp_role;
            }            
        } else {
        // otherwise, only complain if we're debugging things.
            (DEBUG) && message.reply ('Location Role not found on Server: '+locations[i]);
        }
    }

    // build the map of staus roles.
    let status_to_role = new Map();
    let role_to_status = new Map();
    // for each entry in locations
    for (let i=0; i<statuses.length; i++) {
        // if there is a corresponding Role in this server, add it to the Maps.
        if (temp_role = message.guild.roles.find("name", statuses[i])) {
            status_to_role.set(statuses[i], temp_role);
            role_to_status.set(temp_role, statuses[i]);
        } else {
        // otherwise, only complain if we're debugging things.
            (DEBUG) && message.reply ('Status Role not found on Server: '+statuses[i]);
        }
    }

    // TODO print debug of all the new maps
    
    // Determine the new location Role
    let new_role = location_to_role.get(args.location);
    (DEBUG) && message.reply ("Currently Assigned Location Role="+current_role+
                            ", New Location Role="+new_role);

    //-------------------------------
    // Process an Assignment Request:
    //-------------------------------    
    // If we don't have an arg, spit out the help message and exit
    if (args.location == '') {
        (DEBUG) && message.reply ("processing blank location");
        return message.reply('command: !assign [ USWest | USEast | Europe | Daytime | none (to remove)]\n'
                            +'\t[raidrookie] - toggles raidrookie status on/off');
    }

    // Process the 'none' command to strip all assigned Roles from the user.
    if (args.location == 'none') {
        // Iterate through the toggle-able Roles
        // If any are set, if they are set, unset them.
        for (var [key, value] of role_to_status.entries()) {
            if (message.member.roles.has(key.id)) {
                // clear the role from the member
                message.member.removeRole(key);
                message.reply('Removed from Status Role: '+value+'.');
            }
        }
        
        // Unassign from former location role (if there is one)
        //member.removeRole(currentRole).catch(console.error);
        if (current_role) { 
            (DEBUG) && message.reply ("processing 'none'");
            message.member.removeRole(current_role);
            return message.reply('Removed from Location Role: '+role_to_location.get(current_role)+'.');
        }
    }

    // Otherwise we are processing a new Location Role
    if (location_to_role.has(args.location)) {
        (DEBUG) && message.reply ("processing new Location Role");
        // if the new role is the same as the current, ignore it all and exit.
        if (current_role == new_role) {
            return message.reply('Already assigned to '+role_to_location.get(current_role)+'.');
        } else {
            // Unassign from former location role
            //member.removeRole(currentRole).catch(console.error);
            if (current_role) { message.member.removeRole(current_role); }
            // Assign to new location role
            //member.addRole(newRole).catch(console.error);
            message.member.addRole(new_role);
            return message.reply('Welcome to '+role_to_location.get(new_role));
        }
    }

    // Otherwise we are toggling a Status Role
    if (status_to_role.has(args.location)) {
        let status_role = status_to_role.get(args.location);
        // If the member has the role already
        if (message.member.roles.has(status_role.id)) {
            // clear the role from the member
            message.member.removeRole(status_role);
            return message.reply('Removed from: '+role_to_status.get(status_role)+'.');
        } else {
            // else assign the role to the member
            message.member.addRole(status_role);
            return message.reply('Welcome to: '+role_to_status.get(status_role)+'.');
        }
    }
    
    return message.reply('Guru Meditation Error: Please tell the sysadmin the left front wheel fell off of LawnBot');
}

module.exports = new Command('assign', exec, {
    aliases: ['assign'],
    args: [
        {
            id: 'location',
            type: [
                ['USWest', 'PST', 'PDT', 'US West', 'Western US'],
                ['USEast', 'EST', 'EDT', 'US East', 'Eastern US'],
                ['Europe', 'GMT', 'UK', 'Europe West', 'Western Europe', 'EUWest', 
                    'MSK', 'Europe East', 'Eastern Europe', 'EUEast'],
                ['Daytime', 'LST', 'AETZ', 'Other', 'Lunar'],
                ['none'],
                ['raidrookie']
            ],
            default: ''
        }
    ]
});
