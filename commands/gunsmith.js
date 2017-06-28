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
//const dataHelper = require('./gunsmith-util/bungie-data-helper');
////request.debug = true;
const SHOW_ARMOR = true;

// callback handler function:
// (when the command runs, this is what gets called)
async function exec(message, args) {
	// instantiate a new instance of the Bungie Data Helper class
	// (from the bungie-data-helper.js library)
	// CODE BROUGHT INTO THIS FILE
//    dataHelper = new DataHelper();
    
    // Resolve network/platform type
    platform = 0;
    if (args.platform === 'psn') { platform = 2; }
    else if (args.platform === 'xbox') { platform = 1; }
	
	if (args.user === '') { return message.reply('command: !gunsmith <slot> <character_name> [console]') }
	
	// Validate user
	let player, characterId, itemId, details;
        try {
        	console.log('exec: gear=%j, name=%j, platform=%j:%j', args.gear_piece, args.user, args.platform, platform);
            player =  await 
            	_resolveId(platform, args.user);
        } catch (e) {
            let nickname = message.author;
        	console.log('exec: no userid using author=%j', message.author);
            if (nickname) {

                membershipType = _parseNetwork(nickname);
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
        }

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
//        console.log('exec: itemDetails=%j', itemDetails);

        let outputMessage = parsePayload(itemDetails);
        console.log('message = %j', outputMessage);
        return message.reply(outputMessage)

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
			return serializeFromApi(resp)
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
//			console.log('api: err=%j', err);
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
	return message.author.send(e.message);
}

// Function to handle Error messages
function GunsmithError(message, extra) {
    name = constructor.name;
    message = message;
    extra = extra;
    Error.captureStackTrace(this, this.constructor);
}


// helper function to take the item tree and serialize it/clean it up
function serializeFromApi(response) {
	let damageTypeName;
	let {item} = response.data;
	let hash = item.itemHash;
	let itemDefs = response.definitions.items[hash];

//	console.log('serialzeFromApi: response=%j', response);

	// some weapons return an empty hash for definitions.damageTypes
	if (Object.keys(response.definitions.damageTypes).length !== 0) {
		({damageTypeName} = response.definitions.damageTypes[item.damageTypeHash]);
	} else {
		damageTypeName = 'Kinetic';
		console.log(Object.keys(response.definitions.damageTypes).length);
		console.log(`damageType empty for ${itemDefs.itemName}`);
	}
	let stats = {};
	// for stat in item.stats
	let itemStats = item.stats;

	if (item.damageType !== 0) {
		// to expand using all the hidden stats, use the code below
		// itemStatHashes = ( "#{x.statHash}" for x in item.stats )
		// for h, s of response.definitions.items[hash].stats when h not in itemStatHashes
		//   itemStats.push s

		// to expand using a smaller list, match against EXTENDED_WEAPON_STATS
		for (let extHash of Array.from(constants.EXTENDED_WEAPON_STATS)) {
			let s = response.definitions.items[hash].stats[extHash];
			if (s !== null) {
				itemStats.push(s);
			}
		}
	}

	let statHashes = constants.STAT_HASHES;
	for (let stat of Array.from(itemStats)) {
		if ((stat !== null ? stat.statHash : undefined) in statHashes) {
			stats[statHashes[stat.statHash]] = stat.value;
		}
	}

	let prefix = 'https://www.bungie.net';
	let iconSuffix = itemDefs.icon;
	let itemSuffix = `/en/Armory/Detail?item=${hash}`;

	return {
		itemName: itemDefs.itemName,
		itemDescription: itemDefs.itemDescription,
		itemTypeName: itemDefs.itemTypeName,
		color: parseInt(constants.DAMAGE_COLOR[damageTypeName], 16),
		iconLink: prefix + iconSuffix,
		itemLink: prefix + itemSuffix,
		nodes: response.data.talentNodes,
		nodeDefs: response.definitions.talentGrids[item.talentGridHash].nodes,
		damageType: damageTypeName,
		stats
	};
}

// Parse the Item Data into the displayed output
function parsePayload(item) {
	let name = `${item.itemName}`;
	if (item.damageType !== "Kinetic") {
		name += ` [${item.damageType}]`;
	}
	let filtered = filterNodes(item.nodes, item.nodeDefs);
	let textHash = buildText(filtered, item.nodeDefs, item);
	let footerText = buildFooter(item);

	return {
		text: '',
		embed: {
			title: name,
			description: item.itemDescription,
			url: item.itemLink,
			color: item.color,
			fields: _.map(textHash, (string, column) => {
				return {
					name: `Column ${column}`,
					value: string
				}
			}),


			footer: {
				text: footerText
			},
			thumbnail: {
				url: item.iconLink,
				width: 60,
				height: 60
			}
		}

	};
}

// removes invalid nodes, orders according to column attribute
function filterNodes(nodes, nodeDefs) {
	let validNodes = [];
	let invalid = function (node) {
		let name = nodeDefs[node.nodeIndex].steps[node.stepIndex].nodeStepName;
		let skip = ["Upgrade Damage", "Void Damage", "Solar Damage", "Arc Damage", "Kinetic Damage", "Ascend", "Reforge Ready", "Deactivate Chroma", "Red Chroma", "Blue Chroma", "Yellow Chroma", "White Chroma"];
		return (node.stateId === "Invalid") || (node.hidden === true) || Array.from(skip).includes(name);
	};

	for (var node of Array.from(nodes)) {
		if (!invalid(node)) {
			validNodes.push(node);
		}
	}

	let orderedNodes = [];
	let column = 0;
	while (orderedNodes.length < validNodes.length) {
		let idx = 0;
		while (idx < validNodes.length) {
			node = validNodes[idx];
			let nodeColumn = nodeDefs[node.nodeIndex].column;
			if (nodeColumn === column) {
				orderedNodes.push(node);
			}
			idx++;
		}
		column++;
	}
	return orderedNodes;
}

// takes the filtered text and builds the displayed node values
function buildText(nodes, nodeDefs, item) {
	let getName = function (node) {
		let step = nodeDefs[node.nodeIndex].steps[node.stepIndex];
		return step.nodeStepName;
	};

	let text = {};
	let setText = function (node) {
		let step = nodeDefs[node.nodeIndex].steps[node.stepIndex];
		let {column} = nodeDefs[node.nodeIndex];
		let name = step.nodeStepName;
		if (node.isActivated) {
			name = `**${step.nodeStepName}**`;
		}
		if (!text[column]) {
			text[column] = "";
		}
		return text[column] += (text[column] ? ' | ' : '') + name;
	};

	for (let node of Array.from(nodes)) {
		setText(node);
	}
	return text;
}

// orders the stats that go in the footer for display
function buildFooter(item) {
	let stats = [];
	for (let statName in item.stats) {
		let statValue = item.stats[statName];
		stats.push(`${statName}: ${statValue}`);
	}
	return stats.join(', ');
}