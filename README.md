Crucible Radio's Discord Gunsmith bot uses a Hubot framework (which sadly doesn't seem as maintained for Discord).

It had been suggested by Xastey who is maintaing that codebase (here: https://github.com/kclay/leaguebot/tree/master/src/commands/gunsmith ) to port the code to the Akairo framework ( https://github.com/1Computer1/discord-akairo ).  This framework is based on the Discord.js framework for Discord on node.js.

All in all, it was a fun weekend getting it all working, and my apologies to the rough nature of the code due to it being my first experience dealing with
- Discord API
- Bungie API
- Node.js
- Akairo & Discord.js frameworks
- JavaScript (pretty much)

As such the Gunsmith code is pretty much just copy/paste, move things around till they work, and learn as you go.
(for instance, while the showoff-constants.js constants are included ... the bungie-data-helper.js functions were just copy-pasted into the gunsmith.js command when I got tired of trying to get it to integrate).

Subsequently my Clan decided to add the ability for members to "self-assign" into roles on Discord so they tag themselves into regional groups.
The assign module (located in the commands directory) was born and is a from scratch bit of my own code allowing them to do just that.
It relies on 4 pre-existing Roles (USWest, USEast, Europe, Daytime), and it relies on this bot being allowed to make modifications to those roles.

The latest module that's been requested is a module to monitor those streamers in our group so we can assign and unassign them to a "Streamer" category to pop their names up on the roster when they are streaming.

Latest update:
- complete rework of the assign module so it now has four mutually exclusive "roles" and a single togglable role (and can easily be extended, modified, changed)
- twitch monitoring mod done. simple DB that monitors selected twitch_ids (saved in an sqlite3 database) and queries the twitch_API to see if they are streaming every x minutes.  If they are, then it makes sure they are in the Streamer Showcase Role (which is preset to "twitch" purple and pops up to the top of the logged in users).
- add the countdown command for the beta (its been a hit).  Will rewrite the command with the release date post beta (and the PC release date after that? ... probably rewrite for future DLC?)

ToDo:
- Refactor the twitch module so the code is cleaner (as I learn about async and await).
- Update the code so the twitch module produces stats.
- add try/catch/.catch blocks where needed to properly handle errors in the whole thing.
- add the "say" module.
