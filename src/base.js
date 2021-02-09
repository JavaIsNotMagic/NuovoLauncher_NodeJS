const fs = require('fs');
const os = require('os');
const request = require("request");
const path = require("path");
const proc = require('process');
const { version } = require('punycode');

//Constants and globals

nuovo_home = os.homedir() + "/.nuovo"
nuovo_libraries = nuovo_home + "/libraries";
nuovo_assets = nuovo_home + "/launcher-assets";
nuovo_obj_indexes = nuovo_assets + "/object_indexes";
minecraft_obj_root = nuovo_home + "/assets";
minecraft_indexes = minecraft_obj_root + "/indexes";
minecraft_objects = minecraft_obj_root + "/objects";
game_root = nuovo_home + "/game";
game_versions = game_root + "/versions";
version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
version_manifest = os.homedir() + "/.nuovo/launcher-assets/version_manifest.json";
resources_base = "http://resources.download.minecraft.net/";

//Pretty self explanitory, create directiries given a path
//@param directory: The directory path
createDirectory = function(directory) {
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
download = async function(url, path) {
	console.log(`Downloading ${url}`);
	await new Promise((resolve,reject) => {
		let file =fs.createWriteStream(path)
		let stream =request({
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

//Downloads the version manifest (A list of all minecraft versions), and parses the JSON (JavaScript Object Notation) 
//looking for the version id (ex. 1.7.10) as well as any libraries that this specific version needs as well as the object manifest (Minecraft's gamefiles).
//@param sel_version: Selection version to launch.
downlodLibsAndObjects = async function() {
	download(version_manifest_url, version_manifest).then(() => {		
		for(version of require(version_manifest).versions) {
			let json_path =minecraft_indexes + "/" + version.id + ".json";
			console.log(json_path);
			download(version.url, json_path).then(() => {
			let json_file =require(json_path);
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
			version_json =require(`${minecraft_indexes}/${version.id}.json`).assetIndex;
			if(version.id.includes('rd')) {
				console.log("Alpha versions are not currently supported");
			} else {
				download(version_json.url, nuovo_obj_indexes + `/${version.id}.json`);
			}
		
			let object_json ="";
			if(version.id.includes('rd')) {
				console.log("Alpha versions are not currently supported");
			} else {
				object_json =require(nuovo_obj_indexes + `/${version.id}.json`).objects;
			}
			for(obj in object_json) {
				let full_hash =object_json[obj].hash;
				let hash_first_two =full_hash.slice(0, 2);
				createDirectory(`${minecraft_objects}/${hash_first_two}/${full_hash}`);
				//Now download the objects
				console.log(`Downloading ${resources_base}${hash_first_two}/${full_hash} to ${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
				download(`${resources_base}${hash_first_two}/${full_hash}`, `${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
			}
				
			}).catch((err) => {
				if(err.name == "SyntaxError" || "TypeError") {
					//do nothing
				} else {
					console.error(err);	
				}
			})
		}
	})
}
downloadClient = async function(sel_version) {
	download(version_manifest_url, version_manifest).then(() => {
		for(mcVersion of require(version_manifest).versions) {
			if(mcVersion.url.includes(sel_version)) {
				let json_path = minecraft_indexes + "/" + sel_version + ".json";
				download(mcVersion.url, json_path).then(() => {
					let json_file =require(json_path);
					for(lib of json_file.libraries) {
						if(lib.downloads.artifact != undefined) {
							console.log(`Creating dcirectory ${nuovo_libraries}/${path.parse(lib.downloads.artifact.path).dir}`);
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
					download(version_json.url, nuovo_obj_indexes + `/${sel_version}.json`).then(() => {
						object_json =require(nuovo_obj_indexes + `/${sel_version}.json`).objects;
						for(obj in object_json) {
							let full_hash =object_json[obj].hash;
							let hash_first_two =full_hash.slice(0, 2);
							createDirectory(`${minecraft_objects}/${hash_first_two}/${full_hash}`);
							//Now download the objects
							console.log(`Downloading ${resources_base}${hash_first_two}/${full_hash} to ${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
							download(`${resources_base}${hash_first_two}/${full_hash}`, `${minecraft_objects}/${hash_first_two}/${full_hash}/${full_hash}`);
						}
					})
				}).catch((err) => {
					if(err.name == "SyntaxError" || "TypeError") {
						//do nothing
					} else {
						console.error(err);	
					}
				})
			} else {
				//so nothing
			}
		}
	})
}

dumpVersions = async function() {
	let	version_dict =[];
	await download(version_manifest_url, version_manifest).then(() => {
		for(versionMC of require(version_manifest).versions) {
			version_dict.push({
				version: versionMC.id,
				url: versionMC.url,
				type: versionMC.type				
			})
		}
	})
	return version_dict;
}

launchVanilla = async function(version_mc) {
	client_url = require(`${minecraft_indexes}/${version_mc}.json`).downloads.client.url;
	client_json = require(`${minecraft_indexes}/${version_mc}.json`);
	download(client_url, `${game_versions}/${version_mc}.jar`).then(() => {
		console.log("Downloaded Minecraft ", version_mc);
		downloadClient(version_mc).then(() => {
			for(obj in client_json) {
				if(obj.includes("natives")) {
					console.log(obj);
				} else {
					console.log("No native found.");
				}
			}
		}).catch((err) => {console.error(err)})
	}).catch((err) => {console.error(err)});
}

/*------------------------------------------------------------*/

//Exports

exports.nuovo_home = nuovo_home;
exports.nuovo_libraries = nuovo_libraries;
exports.nuovo_assets = nuovo_assets;
exports.nuovo_obj_indexes = nuovo_obj_indexes;
exports.minecraft_obj_root = minecraft_obj_root;
exports.minecraft_indexes = minecraft_indexes;
exports.minecraft_objects = minecraft_objects;
exports.game_root = game_root;
exports.version_manifest_url = version_manifest_url;
exports.version_manifest = version_manifest;
exports.resources_base = resources_base;

exports.createDirectory = createDirectory;
exports.dumpVersions = dumpVersions;
exports.downlodLibsAndObjects = downlodLibsAndObjects;
exports.download = download;
exports.launchVanilla = launchVanilla;
exports.downloadClient = downloadClient;

/*------------------------------------------------------------*/
