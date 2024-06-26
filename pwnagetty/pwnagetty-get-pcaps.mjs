#!/usr/bin/env node

import fs from "fs";
import config from "../config.js";
import sftpClient from "ssh2-sftp-client";
import { Client as sshClient } from "ssh2";
import * as logos from "../scripts/logos.mjs";

// Set the maximum number of listeners globally for all event emitters to unlimited.
import events from "events";
events.EventEmitter.defaultMaxListeners = 0;

const sshConfig = {
	host: config.PWNAGOTCHI_SSH.HOST_ADDRESS,
	username: config.PWNAGOTCHI_SSH.USERNAME,
	password: config.PWNAGOTCHI_SSH.PASSWORD,
	port: config.PWNAGOTCHI_SSH.PORT,
	localDir: config.LOCAL_PCAP_DIRECTORY,
	handshakeDir: config.HANDSHAKE_DIRECTORY
};

const sftpConfig = {
	host: config.PWNAGOTCHI_SSH.HOST_ADDRESS,
	username: config.PWNAGOTCHI_SSH.USERNAME,
	password: config.PWNAGOTCHI_SSH.PASSWORD,
	port: config.PWNAGOTCHI_SSH.PORT
};

//=================================================================
// Copy all .pcap files to an accessible folder on the Pwnagotchi.
//=================================================================
const moveFiles = async () => {
	const ssh = new sshClient();
	ssh.setMaxListeners(0); // Set to 0 for unlimited listeners.

	const commandToExecute = `
		sudo rm -rf ${config.HANDSHAKE_DIRECTORY} 2>/dev/null &&
		mkdir -p ${config.HANDSHAKE_DIRECTORY} 2>/dev/null &&
		sudo cp -r /root/handshakes/ ~/ &&
		ls -a ${config.HANDSHAKE_DIRECTORY}
	`;

	ssh.on("ready", () => {
		console.log("Connected to the Pwnagotchi.");

		ssh.exec(commandToExecute, (err, stream) => {
			if (err) throw err;

			stream
				.on("close", (code, signal) => {
					console.log(`Command execution closed with code ${code}.`);
					ssh.end();
				})
				.on("data", data => {
					console.log(`Command output:\n${data}`);
				})
				.stderr.on("data", data => {
					console.error(`Error output:\n${data}`);
				});
		});
	}).connect(sshConfig);
};

//=====================================
// Download all files from Pwnagotchi.
//=====================================
const getFiles = async () => {
	const client = new sftpClient();

	// if "/pcap" doesn't exist, create it.
	if (!fs.existsSync(config.LOCAL_PCAP_DIRECTORY)) {
		fs.mkdirSync(config.LOCAL_PCAP_DIRECTORY);
	}

	// connect to pwnagotchi and get files.
	try {
		await client.connect(sftpConfig);
		console.log("Connecting to Pwnagotchi...\n");

		let count = 0;
		client.on("download", info => {
			count++;
			process.stdout.write(`Downloaded ${count} captures...` + "\r");
		});

		let rslt = await client.downloadDir(config.PWNAGOTCHI_HANDSHAKES, config.LOCAL_PCAP_DIRECTORY);
		console.log(`\n`);
		return rslt;
	} finally {
		client.end();
	}
};

//==============
// Main Process
//==============
const main = async () => {
	try {
		logos.printPwnagetty();

		await moveFiles();
		await getFiles();

		// if "./handshakes/pmkid" doesn't exist, create it.
		if (!fs.existsSync(config.LOCAL_PMKID_DIRECTORY)) {
			fs.mkdirSync(config.LOCAL_PMKID_DIRECTORY);
		}

		// if "./handshakes/hccapx" doesn't exist, create it.
		if (!fs.existsSync(config.LOCAL_HCCAPX_DIRECTORY)) {
			fs.mkdirSync(config.LOCAL_HCCAPX_DIRECTORY);
		}

		process.exit(0);
	} catch (err) {
		console.log(`Main catch: ${err}`);
	}
};

main();
