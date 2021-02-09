const fs = require('fs');
const os = require('os');
const request = require("request");
//const json = require("@javaisnotmagic/json-parser");
const path = require("path");
const proc = require('process');
//Constants and globals
var nuovo_home = os.homedir() + "/.nuovo"
var nuovo_libraries = nuovo_home + "/libraries";
var nuovo_assets = nuovo_home + "/launcher-assets";
var nuovo_obj_indexes = nuovo_assets + "/object_indexes";
var minecraft_obj_root = nuovo_home + "/assets";
var minecraft_indexes = minecraft_obj_root + "/indexes";
var minecraft_objects = minecraft_obj_root + "/objects";
var game_root = nuovo_home + "/game";
var version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
var version_manifest = os.homedir() + "/.nuovo/launcher-assets/version_manifest.json";
var resources_base = "http://resources.download.minecraft.net/";

//Pretty self explanitory, create directiries given a path
//@param directory: The directory path
function createDirectory(directory) {
	//Check to see if the directory exists
	if(fs.existsSync(directory)) {
		console.log(`Directory ${directory} already exists!`);
	} else {
		fs.mkdirSync(directory, {recursive: true});
	}
}

//Download a file of the internet
//@param url: Url of the file to download
//@param dest: Destination, where to save the file
async function download(url, path) {
	console.log(`Downloading ${url}`);
	await new Promise((resolve,reject) => {
		let file = fs.createWriteStream(path)
		let stream = request({
			url: url,
			encoding: null
		})
		.pipe(file)
		.on('finish', () => {
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
createDirectory(nuovo_obj_indexes); //Object indexes
createDirectory(minecraft_obj_root); // Assets root
createDirectory(minecraft_indexes); // Indexes
createDirectory(minecraft_objects); // Game assets
createDirectory(game_root); // Game dir, where minecraft is launched from

console.log("Download Launcher assets...");

 //Downloads the version manifest (A list of all minecraft versions), and parses the JSON (JavaScript Object Notation) 
 //looking for the version id (ex. 1.7.10) as well as any libraries that this specific version needs as well as the object manifest (Minecraft's gamefiles).

 download(version_manifest_url, version_manifest).then(() => {		
	for(version of require(version_manifest).versions) {
		let json_path = minecraft_indexes + "/" + version.id + ".json";
		download(version.url, json_path).then(() => {
			let json_file = require(json_path);
			for(lib of json_file.libraries) {
				if(lib.downloads.artifact != undefined) {
					console.log(`Creating dcirectory ${nuovo_libraries}/${path.parse(lib.downloads.artifact.path).dir}`);
					//TODO: Figure out why the file doesn't download, and why the file is attempting to download more than onces
					console.log(`Downloading ${lib.downloads.artifact.url} to ${nuovo_libraries}/${lib.downloads.artifact.path}`);
					if(fs.existsSync(`${nuovo_libraries}/${lib.downloads.artifact.path}`)) {
						console.log(`${nuovo_libraries}/${lib.downloads.artifact.path} already exists!`);
					} else {
						createDirectory(`${nuovo_libraries}/${path.parse(lib.downloads.artifact.path).dir}`);
						download(lib.downloads.artifact.url, `${nuovo_libraries}/${lib.downloads.artifact.path}`);
						console.log("Done!");
					}
				} else {
					console.log("No artifact");
				}
			}
			//Now parse the object manifest and prepare to download the objects
			version_json = require(`${minecraft_indexes}/${version.id}.json`).assetIndex;
			if(version.id.includes('rd')) {
				console.log("Alpha versions are not currently supported");
			} else {
				download(version_json.url, nuovo_obj_indexes + `/${version.id}.json`);
			}
			
			let object_json = "";
			if(version.id.includes('rd')) {
				console.log("Alpha versions are not currently supported");
			} else {
				object_json = require(nuovo_obj_indexes + `/${version.id}.json`).objects;
			}
			for(obj in object_json) {
				let full_hash = object_json[obj].hash;
				let hash_first_two = full_hash.slice(0, 2);
				createDirectory(`${minecraft_objects}/${hash_first_two}/${full_hash}`);
				//Now download the objects
				console.log(`Downloading ${resources_base}${hash_first_two}/${full_hash} to ${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
				download(`${resources_base}${hash_first_two}/${full_hash}`, `${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
			}
		})
	}
}).catch((err) => {
	if(err.name == "SyntaxError" || "TypeError") {
		//do nothing
	} else {
		console.error(err);	
	}
});
