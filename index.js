const fs = require('fs');
const os = require('os');
const request = require("request");
const json = require("@javaisnotmagic/json-parser");
const path = require("path");
const proc = require('process');

//Constants and globals
var nuovo_home = os.homedir() + "/.nuovo"
var nuovo_libraries = nuovo_home + "/libraries";
var nuovo_assets = nuovo_home + "/launcher-assets";

var minecraft_obj_root = nuovo_home + "/assets";
var minecraft_indexes = minecraft_obj_root + "/indexes";
var minecraft_objects = minecraft_obj_root + "/objects";
var game_root = nuovo_home + "/game";

var version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
var version_manifest = os.homedir() + "/.nuovo/launcher-assets/version_manifest.json";

//Pretty self explanitory, create directiries given a path
//@param directory: The directory path

function createDirectory(directory) {
	if(! fs.existsSync(directory)) {
		fs.mkdirSync(directory);
	}
}

//Download a file of the internet
//@param url: Url of the file to download
//@param dest: Destination, where to save the file
async function download(url, path) {
	await new Promise((resolve,reject) => {
		let file = fs.createWriteStream(path)
		let stream = request({
			url: url,
			encoding: null
		})
		.pipe(file)
		.on('finish', () => {
			//console.log(`File ${file.path} downloaded!`);
			file.close();				
			resolve();
		})
		.on('error', (error) => {
			reject(error);
		})
	}).catch(err => {
		console.error("Something happend: ", err);
	}); 
};

//Main
console.log("Create needed directories");

createDirectory(nuovo_home); // Launcher root
createDirectory(nuovo_libraries); // Libraries
createDirectory(nuovo_assets); // Launcher assets
createDirectory(nuovo_assets + "/object_indexes");
createDirectory(minecraft_obj_root); // Assets root
createDirectory(minecraft_indexes); // Indexes
createDirectory(minecraft_objects); // Game assets
createDirectory(game_root); // Game dir, where minecraft is launched from

console.log("Download Launcher assets...");

 //Downloads the version manifest (A list of all minecraft versions), and parses the JSON (JavaScript Object Notation) 
 //looking for the version id (ex. 1.7.10) as well as any libraries that this specific version needs as well as the object manifest (Minecraft's gamefiles).
 //The object manifest will be processed in a later block

 download(version_manifest_url, version_manifest).then(() => {		
	//console.log(require(version_manifest).versions);	
	for(x of require(version_manifest).versions) {
		//console.log(x.url, x.id, minecraft_indexes)
		let json_path = minecraft_indexes + "/" + x.id + ".json";				
		download(x.url, json_path).then(() => {
			let json_file = require(json_path);			
			console.log(`Objects file ${x.url}`);
			download(x.url, nuovo_assets + `/object_indexes/obj_${x.id}.json`).then(() => {
				//Now parse the object manifest and prepare to download the objects
				object_json = require(nuovo_assets + `/object_indexes/obj_${x.id}.json`);
				for(obj in object_json) {
					console.log(obj.hash);
				}
			}).catch((err) => {
				if(err.name == "Error") { //File wasn't found. Just exit peacefully.
					console.log("Object index not found for version", x.id);
					proc.exit(1);
				} if(err.name == "SyntaxError") { //Unexpected end of JSON input, the json file was malformed. Just exit peacefully.
					console.log("There was an error parsing the object file for version", x.id);
					proc.exit(1);
				} else {
					console.error(err);
				}
			})
			let lib_info = [];			
			for(lib of json_file.libraries) {
				if(lib.downloads.artifact) {
					lib_info.push({					 
						url: lib.downloads.artifact.url,
						path: path.parse(lib.downlods.artifact.path).dir,
						id: x.id
					});
				}
			}
			return lib_info;
		}).then((lib_info) => {
			for(y of lib_info.id) {			
				//TODO: Get selected version				
				if(y == "1.7.10") {
					for(z of lib_info) {
						download(x.url, x.path);
					}
				}
		}}).catch((err) => {
			if(err.name == "SyntaxError" || "TypeError") {
			//do nothing
			} else {
				console.error(err);	
			}
		}) 		
	}
}).catch((err) => {
	console.error(err);
});