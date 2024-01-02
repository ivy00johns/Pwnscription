#!/usr/bin/env node

import util from "util";
import fs from "fs/promises";
import config from "../config.js";
import { exec } from "child_process";
import * as logos from "../scripts/logos.mjs";

let successfulPMKIDs  = 0;
let successfulHCCAPXs = 0;

//======================================
// Get all pcap files in the directory.
//======================================
const readDir = async () => {
	try {
		const files = await fs.readdir(config.LOCAL_PCAP_DIRECTORY);
		return files;
	} catch (error) {
		throw new Error(`Unable to scan directory: ${error.message}`);
	}
};

const convertFile = async (file) => {
	try {
		// Exclude ".gitkeep" files.
		if (file === ".gitkeep") {
			console.log(`Skipping: ${file}`);
			return `${file} successfully skipped.`;
		}

		// We favour PMKID"s, if we find that we ignore handshakes, if no PMKID is found then we look for a handshake.
		const execPromisified = util.promisify(exec);
		const pmkidResult = await execPromisified(`hcxpcapngtool -o ${config.LOCAL_PMKID_DIRECTORY}/${file.replace(".pcap", "")}.pmkid ${config.LOCAL_PCAP_DIRECTORY}/${file}`);

		if (pmkidResult.stdout.includes("PMKID(s) written.")) {
			console.log(`Found PMKID in ${file}.`);
			successfulPMKIDs++;
			return "pmkid";
		}

		// If PMKID is not found, try converting to HCCAPX.
		const hccapxResult = await execPromisified(`hcxpcapngtool -o ${config.LOCAL_HCCAPX_DIRECTORY}/${file.replace(".pcap", "")}.hc22000 ${config.LOCAL_PCAP_DIRECTORY}/${file}`);

		if (hccapxResult.stdout.includes("Handshake(s) written.")) {
			console.log(`Found HCCAPX in ${file}.`);
			successfulHCCAPXs++;
			return "hccapx";
		}

		return "No PMKID or HCCAPX found.";
	} catch (error) {
		// console.error(`${error}`);
		// console.error(`${error.stdout}`);
	}
};

//==============
// Main Process
//==============
const main = async () => {
	try {
		logos.printPwnagetty();

		let files = await readDir();

		// if "/pmkid" doesn"t exist, create it.
		try {
			await fs.access(config.LOCAL_PMKID_DIRECTORY);
		} catch {
			await fs.mkdir(config.LOCAL_PMKID_DIRECTORY, {
				recursive: true
			});
		}

		// if "/hccapx" doesn"t exist, create it.
		try {
			await fs.access(config.LOCAL_HCCAPX_DIRECTORY);
		} catch {
			await fs.mkdir(config.LOCAL_HCCAPX_DIRECTORY, {
				recursive: true
			});
		}

		// Loop over all pcap files.
		for (let file of files) {
			console.log(`\nProcessing: ${file}`);

			let result = await convertFile(file);
			console.log(`Results: ${result}`);
		}

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
};

main();
