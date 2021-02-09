const { launchVanilla } = require("./src/base");

base = require("./src/base");

//Main
async function main() {
	
	console.log("Create needed directories");

	base.createDirectory(base.nuovo_home); // Launcher root
	base.createDirectory(base.nuovo_libraries); // Libraries
	base.createDirectory(base.nuovo_assets); // Launcher assets
	base.createDirectory(base.nuovo_obj_indexes); //Object indexes
	base.createDirectory(base.minecraft_obj_root); // Assets root
	base.createDirectory(base.minecraft_indexes); // Indexes
	base.createDirectory(base.minecraft_objects); // Game assets
	base.createDirectory(base.game_root); // Game dir, where minecraft is launched from
	
	console.log("Download Launcher assets...");
	
	let selected_version = "1.7.10";
	if(selected_version == "") {
		base.downlodLibsAndObjects()
	} else {
		//await base.downloadClient(selected_version);
		base.launchVanilla(selected_version);
	}

	/*let ver = await base.dumpVersions();
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
	}*/

}

main();