#!/usr/bin/env node
const fs = require("fs");
const util = require("util");
const config = require("../config");
const { exec } = require("child_process");
const logos = require("../scripts/logos");

let successfulPMKIDs = 0;
let successfulHCCAPXs = 0;

//=================================
// Get all pcap files in the directory
//=================================
async function readDir() {
	return new Promise((resolve, reject) => {
		fs.readdir(config.LOCAL_PCAP_DIRECTORY, function (err, files) {
			if (err) {
				reject(`Unable to scan directory: ${err}`);
			}
			resolve(files);
		});
	})
}

async function convertFile(file) {
	return new Promise((resolve, reject) => {
		// Exclude ".gitkeep" files
		if (file === ".gitkeep") {
			console.log(`Skipping: ${file}`);
			resolve(`${file} successfully skipped.`);
			return;
		}

		// We favour PMKID's, if we find that we ignore handshakes, if no PMKID is found then we look for a handshake.
		util.promisify(exec)(`hcxpcapngtool -o ${config.LOCAL_PMKID_DIRECTORY}/${file.replace(".pcap", "")}.pmkid ${config.LOCAL_PCAP_DIRECTORY}/${file}`, function (error, stdout) {
			if (error) {
				reject(error); // Reject the promise on error
			}

			if (stdout.includes("PMKID(s) written.")) {
				console.log(`Found PMKID in ${file}.`);
				successfulPMKIDs++;
				resolve("pmkid");
			} else {
				// If PMKID is not found, try converting to HCCAPX
				util.promisify(exec)(`hcxpcapngtool -o ${config.LOCAL_HCCAPX_DIRECTORY}/${file.replace(".pcap", "")}.hc22000 ${config.LOCAL_PCAP_DIRECTORY}/${file}`, function (error, stdout) {
					if (error) {
						reject(error); // Reject the promise on error
						console.log(error);
					}

					if (stdout.includes("Handshake(s) written.")) {
						console.log(`Found HCCAPX in ${file}.`);
						successfulHCCAPXs++;
						resolve("hccapx");
					} else {
						resolve("No PMKID or HCCAPX found.");
					}
				});
			}
		});
	});
}

//===============
// Main Process
//===============
async function main() {
	try {
		logos.printPwnagetty();

		let files  = await readDir();
		
		// if "/pmkid" doesn"t exist, create it.
		if (!fs.existsSync(config.LOCAL_PMKID_DIRECTORY)) {
			fs.mkdirSync(config.LOCAL_PMKID_DIRECTORY, { recursive: true });
		}

		// if "/hccapx" doesn"t exist, create it.
		if (!fs.existsSync(config.LOCAL_HCCAPX_DIRECTORY)) {
			fs.mkdirSync(config.LOCAL_HCCAPX_DIRECTORY, { recursive: true });
		}

		// Loop over all pcap files
		for (let file of files) {
			console.log(`\nProcessing: ${file}`);

			let result = await convertFile(file);
			console.log(`Results: ${result}`);
		};

		let numFilesWithNoKeyMaterial = files.length - (successfulHCCAPXs + successfulPMKIDs);
		let percentFilesWithNoKeyMaterial = Math.round(((numFilesWithNoKeyMaterial * 100) / files.length) * 100) / 100;

		console.log(`\n${files.length} total PCAP files found.`);
		console.log(`${successfulPMKIDs} successful PMKIDs found.`);
		console.log(`${successfulHCCAPXs} successful HCCAPXs found.\n`);
		console.log(`${numFilesWithNoKeyMaterial} files (${percentFilesWithNoKeyMaterial}%) did not have key material.\n\n`);

		process.exit(0);
	} catch (err) {
		console.log(`Main catch: ${err}`);
	}
}

main();
