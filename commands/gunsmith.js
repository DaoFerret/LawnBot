//  Command to "Showoff" a piece of gear on a given Character
// Expected usage is:
// !gunsmith <gear> <user> <platform>
// where gear is: primary, special/secondary, heavy, ghost, head/helm/helmet,
//				chest, arm/arms/gloves/gauntlets, leg/legs/boots,
//				class/mark/bond/cape/cloak/towel
//       user is:
//       platform is: psn, xbox

const { Command } = require('discord-akairo');

//import BaseCommand from "../base";
//const Promise = require('bluebird');
const request = require('request');
const _ = require('lodash');
const constants = require('./gunsmith-util/showoff-constants');
const {DataHelper} = require('./gunsmith-util/bungie-data-helper');
////request.debug = true;
const SHOW_ARMOR = true;

// callback handler function:
// (when the command runs, this is what gets called)
async function exec(message, args) {
	// instantiate a new instance of the Bungie Data Helper class
	// (from the bungie-data-helper.js library)

//    dataHelper = new DataHelper();
    
    // Resolve network/platform type
    platform = 0;
    if (args.platform === 'psn') { platform = 2; }
    else if (args.platform === 'xbox') { platform = 1; }
	
	// Validate user
	let player, characterId, itemId, details;
        try {
        	console.log('exec: gear=%j, name=%j, platform=%j:%j', args.gear_piece, args.user, args.platform, platform);
            player =  await 
            	_resolveId(platform, args.user);
        } catch (e) {
/*            let nickname = resp.envelope.user.nickname;

            if (nickname) {

                membershipType = this._parseNetwork(nickname);
                name = _parseName(nickname);
                try {
                    player = await
                        _resolveId(membershipType, name);
                    e = null;
                } catch (e2) {
                    e = e2;
                }

            }
            if (e)
                return _handleError(message, e)
*/        }

        console.log('exec: player.platform=%j, player.id=%j', player.platform, player.id);

        try {
            characterId = await
            	_getCharacterId(player.platform, player.id);
            	
            	
        } catch (e) {
            return _handleError(message, e)
        }
        console.log('exec: characterId=%j', characterId);

	// Retrieve gear item
        try {
            itemId = await _getItemIdFromSummary(
                player.platform, player.id,
                characterId, _getBucket(args.gear_piece));
        } catch (e) {
            return _handleError(message, e)
        }
        console.log('exec: itemId=%j', itemId);        

        try {
            itemDetails = await _getItemDetails(
                player.platform, player.id, characterId, itemId);
        } catch (e) {
            return _handleError(message, e)
        }
        console.log('exec: itemDetails=%j', itemDetails);

/*DF
        let message = dataHelper.parsePayload(itemDetails);
        this.log.debug('message = %j', message);
        return message.reply(message)
*/
//    	return message.reply(args.gear_piece+''+args.user+''+args.platform+platform);
  	
}


// register the callback for the "gunsmith" command with the Akairo framework
module.exports = new Command('gunsmith', exec, {
	// the aliases that the bot will respond to
	// (i.e. "!gunsmith")
	aliases: ['gunsmith'],
    args: [
    	{
    		// argument to hold the piece of gear being checked
    		// any listed names resolve to the first one in each array
            id: 'gear_piece',
            type: [
            	['primary'],
            	['special','secondary'],
            	['heavy'],
            	['ghost'],
            	['head','helm','helmet'],
            	['chest'],
            	['arm','arms','gloves','gauntlets'],
            	['leg','legs','boots'],
            	['class','mark','bond','cape','cloak','towel']
            ],
			default: 'primary'
    	},
        {
        	// userID used to check against the Bungie API
            id: 'user',
            type: 'string',
            default: ''
        },
        {
        	// Platform (converts most of the choices to psn/xbox)
        	// defaulted to PSN
            id: 'platform',
            type: [
                 ['psn', 'playstation', 'ps', 'ps3', 'ps4', 'playstation3','playstation4'],
                 ['xbox', 'xb1', 'xbox1', 'xboxone', 'xbox360', 'xb360', 'xbone', 'xb']
            ],
            default: 'psn'
        }
    ]
        
});

// Function to take the membershipType (i.e. platform) and the name (userName)
// and return whether the character exists.
async function _resolveId(membershipType, name) {
	if (membershipType) {
		console.log('_resolveId: membershipType=%j, name=%j', membershipType, name);
		return _getPlayerId(membershipType, name);
	}
	return Promise.all([
		_getPlayerId(1, name.split('_').join(' ')),
		_getPlayerId(2, name)
	]).then(results => {
		if (results[0] && results[1]) {
			throw new GunsmithError(`Mutiple platforms found for: ${name}. use "xbox" or "playstation"`);
		}
		if (results[0]) {
			return results[0]
		} else if (results[1]) {
			return results[1]
		}
		throw new GunsmithError(`Could not find guardian with name: ${name} on either platform.`)
	})

}

// Function to take the membershipType (i.e. platform) and the name (userName)
// and return the playerID number.
async function _getPlayerId(membershipType, name) {
	const endpoint = `SearchDestinyPlayer/${membershipType}/${name}`;
	let networkName = (membershipType === 1 ? 'xbox' : 'psn');
	console.log('_getPlayerId: networkName=%j, endpoint=%j', networkName, endpoint);
	
	return api(endpoint)
		.then(resp => {
			if (!resp) throw new GunsmithError(`Could not find guardian with name: ${name} on ${networkName}.`);
			let [data] = resp;
			return data && data.membershipId ? {
				platform: membershipType,
				id: data.membershipId
			} : null

		})

}

// Function to take the membershipType (i.e. platform) and the playerId (bungie)
// and return the characterId number.
async function _getCharacterId(membershipType, playerId) {
	const endpoint = `${membershipType}/Account/${playerId}`;
	console.log('_getCharacterId: networkName=%j, playerId=%j, endpoint=%j', membershipType, playerId, endpoint);

	return api(endpoint)
		.then(resp => {
			if (!resp) {
				throw new GunsmithError('Something went wrong, no characters found for this user.');
			}

			let [character] = resp.data.characters;
			return character.characterBase.characterId;
		});
}

// Function to take the membershipType,playerId,characterId pull the Inventory
// and find the Id of the item in the requested slot.
async function _getItemIdFromSummary(membershipType, playerId, characterId, bucket) {
	const endpoint = `${membershipType}/Account/${playerId}/Character/${characterId}/Inventory/Summary`;
	console.log('_getItemIdFromSummary: networkName=%j, playerId=%j, characterId=%j, endpoint=%j', membershipType, playerId, characterId, endpoint);
	return api(endpoint)
		.then(resp => {

			let {items} = resp.data;

			let item = _.find(items, object => {
				return object.bucketHash === bucket;
			});

			if (!item)
				throw new GunsmithError("Something went wrong, couldn't find the requested item for this character.");

			return item.itemId;

		})
}

// Subroutine that takes the specific itemId and pulls the details on that
// item from the Destiny DB
async function _getItemDetails(membershipType, playerId, characterId, itemInstanceId) {
	const endpoint = `${membershipType}/Account/${playerId}/Character/${characterId}/Inventory/${itemInstanceId}`;
	const params = 'definitions=true';
	console.log('_getItemIdDetails: endpoint=%j, params=%j', endpoint, params);
	return api(endpoint, params)
		.then(resp => {
			return dataHelper.serializeFromApi(resp)
		})
}


// Subroutine that takes the gear item "name" fed into the command line
// and returns the JSON id tied to the Character Slot we're looking for.
function _getBucket(slot) {
	switch (slot) {
		case 'primary':
			return constants.TYPES.PRIMARY_WEAPON;
			break;
		case 'special':
			return constants.TYPES.SPECIAL_WEAPON;
			break;
		case 'heavy':
			return constants.TYPES.HEAVY_WEAPON;
			break;
		case 'ghost':
			if (SHOW_ARMOR) {
				return constants.TYPES.GHOST;
			}
			break;
		case 'head':
			if (SHOW_ARMOR) {
				return constants.TYPES.HEAD;
			}
			break;
		case 'chest':
			if (SHOW_ARMOR) {
				return constants.TYPES.CHEST;
			}
			break;
		case 'arm':
			if (SHOW_ARMOR) {
				return constants.TYPES.ARMS;
			}
			break;
		case 'leg':
			if (SHOW_ARMOR) {
				return constants.TYPES.LEGS;
			}
			break;
		case 'class':
			if (SHOW_ARMOR) {
				return constants.TYPES.CLASS_ITEMS;
			}
			break;
		default:
			null;
	}
}


// Function to take access the Bungie JSON API via the supplied "endpint"
// and "params"
async function api(endpoint, params) {
	const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY;
	const baseUrl = 'https://www.bungie.net/Platform/Destiny/';
	const trailing = '/';
	const queryParams = params ? `?${params}` : '';
	const url = baseUrl + endpoint + trailing + queryParams;
	return new Promise((resolve, reject) => {
		request({
			url: url,
			headers: {
				'X-API-Key': BUNGIE_API_KEY
			}
		}, (err, res, body) => {
			console.log('api: err=%j', err);
//			console.log('api: res=%j', res);
//			console.log('api: body=%j', body);			
			let object = JSON.parse(body);
			resolve(object.Response);
		});
	});
}

// Generic Error Handler to dump error code back to console
function _handleError(message, e) {
	//log.error(e.stack || e);
	return message.reply(e.message);
}

// Function to handle Error messages
function GunsmithError(message, extra) {
    name = constructor.name;
    message = message;
    extra = extra;
    Error.captureStackTrace(this, this.constructor);
}

