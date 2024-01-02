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
			console.log(`Skipping: ${file}\n`);
			return `${file} successfully skipped.`;
		}

		const execPromisified = util.promisify(exec);

		// Try converting to PMKID
		const pmkidResult = await execPromisified(`hcxpcapngtool -o ${config.LOCAL_PMKID_DIRECTORY}/${file.replace(".pcap", "")}.pmkid ${config.LOCAL_PCAP_DIRECTORY}/${file}`);

		if (pmkidResult.stdout.includes("EAPOL pairs written to 22000 hash file")) {
			successfulPMKIDs++;
		}

		// If PMKID is not found, try converting to HCCAPX.
		const hccapxResult = await execPromisified(`hcxpcapngtool -o ${config.LOCAL_HCCAPX_DIRECTORY}/${file.replace(".pcap", "")}.hc22000 ${config.LOCAL_PCAP_DIRECTORY}/${file}`);

		if (hccapxResult.stdout.includes("EAPOL pairs written to 22000 hash file")) {
			successfulHCCAPXs++;
		}
	} catch (error) {
		console.error(`${error}`);
		console.error(`${error.stdout}`);
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
			console.log(`Processing: ${file}`);

			await convertFile(file);
		}

		let numFilesWithNoKeyMaterial = files.length - ((successfulHCCAPXs + successfulPMKIDs) / 2);
		let percentFilesWithNoKeyMaterial = Math.round(((numFilesWithNoKeyMaterial * 100) / files.length) * 100) / 100;

		console.log(`\n${files.length} total PCAP files found.`);
		console.log(`${successfulPMKIDs} PMKIDs successfully created.`);
		console.log(`${successfulHCCAPXs} HCCAPXs successfully created.\n`);
		console.log(`${numFilesWithNoKeyMaterial} files (${percentFilesWithNoKeyMaterial}%) did not have key material.`);

		process.exit(0);
	} catch (err) {
		console.log(`Main catch: ${err}`);
	}
};

main();
