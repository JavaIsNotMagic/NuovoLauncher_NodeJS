base = require("./src/base");

//Main
async function main() {

	console.log("Create needed directories");

	base.createDirectory(nuovo_home); // Launcher root
	base.createDirectory(nuovo_libraries); // Libraries
	base.createDirectory(nuovo_assets); // Launcher assets
	base.createDirectory(nuovo_obj_indexes); //Object indexes
	base.createDirectory(minecraft_obj_root); // Assets root
	base.createDirectory(minecraft_indexes); // Indexes
	base.createDirectory(minecraft_objects); // Game assets
	base.createDirectory(game_root); // Game dir, where minecraft is launched from
	
	console.log("Download Launcher assets...");
	
	/*if(selected_version == "") {
		downlodLibsAndObjects()
	} else {
		downlodLibsAndObjects(selected_version);
	}*/

	let ver = await base.dumpVersions();
	for(obj of ver) {
		if(obj.type == "release") {
			console.log(`Release: ${obj.version} Index URL ${obj.url}`);
		} else if(obj.type == "snapshot") {
			console.log(`Snapshot: ${obj.version} Index URL ${obj.url}`);
		} else if(obj.type == "beta") {
			console.log(`Beta: ${obj.version} Index URL ${obj.url}`)
		} else {
			console.log(`Alpha: ${obj.version} Index URL ${obj.url}`)
		}
	}

}

main();