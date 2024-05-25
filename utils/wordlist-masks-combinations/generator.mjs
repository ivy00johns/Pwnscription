#!/usr/bin/env node

import fs from "fs/promises";
import * as path from "path";
import { dirname } from "path";
import inquirer from "inquirer";
import config from "../config.js";
import { fileURLToPath } from "url";
import chalk from "chalk";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to read a file and process its content
const readFile = async (filePath) => {
	try {
		const content = await fs.readFile(filePath, "utf8");
		return content.split(/[\s,]+/).filter((v, i, a) => a.indexOf(v) === i).filter(e => e === 0 || e);
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
};

// Function to read mask data from a file
const readMasks = async (filePath) => {
	try {
		const content = await fs.readFile(filePath, "utf8");
		return content.split("\n").map((line) => line.trim()).filter((line) => line !== "");
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
};

// Function to apply a mask to a string
const applyMask = (string, mask) => {
	if (typeof mask !== "string") {
		console.error(`Invalid mask: ${mask}`);
		return string;
	}

	const repeatedMask = mask.repeat(Math.ceil(string.length / mask.length));
	const adjustedMask = repeatedMask.slice(0, string.length);

	try {
		return string
			.split("")
			.map((char, index) =>
				adjustedMask.charAt(index) === "?" ? char : adjustedMask.charAt(index)
			)
			.join("");
	} catch (error) {
		console.error(
			`Error applying mask "${mask}" to string "${string}": ${error.message}`
		);
		return string;
	}
};

// Function to generate masked words
const generate = async (data, masks) => {
	const resultArray = [];

	for (let string of data) {
		for (let mask of masks) {
			const maskResult = applyMask(string, mask);

			// Check for uniqueness
			if (!resultArray.includes(maskResult)) {
				resultArray.push(maskResult);
			}
		}
	}

	return resultArray.join("\n");
};

// Function to generate and save masked words
const generateAndSave = async () => {
	const fileExclusions = [".gitkeep", ".gz"];
	const wordlistFiles = (
		await fs.readdir(config.LOCAL_WORLISTS_DIRECTORY)
	).filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));
	const maskFiles = (
		await fs.readdir(config.LOCAL_MASKS_DIRECTORY)
	).filter((file) => fileExclusions.every((exclusion) => !file.includes(exclusion)));

	const { selectedWordlist, selectedMaskFile } = await inquirer.prompt([
		{
			type: "rawlist",
			name: "selectedWordlist",
			message: "Select a .txt file:",
			choices: ["base-word.txt", ...wordlistFiles, "Exit"],
		},
		{
			type: "rawlist",
			name: "selectedMaskFile",
			message: "Select a mask file:",
			choices: ["ALL", ...maskFiles, "Exit"],
		},
	]);

	if (selectedWordlist === "Exit" || selectedMaskFile === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	if (selectedMaskFile === "ALL") {
		// Process all mask files
		for (const wordlist of wordlistFiles) {
			for (const maskFile of maskFiles) {
				const inputData = await readFile(
					path.join(
						__dirname,
						"..",
						config.LOCAL_WORLISTS_DIRECTORY,
						wordlist
					)
				);
				const maskData = await readMasks(
					path.join(
						__dirname,
						"..",
						config.LOCAL_MASKS_DIRECTORY,
						maskFile
					)
				);

				const result = await generate(inputData, maskData);

				const outputFileName = `${path.basename(
					wordlist,
					path.extname(wordlist)
				)}-${path.basename(maskFile, path.extname(maskFile))}-${
					config.GENERIC_MASKS_RESULTS_FILENAME
				}`;
				const outputPath = path.join(
					config.WORDLIST_MASKS_RESULTS_DIRECTORY,
					outputFileName
				);

				try {
					await fs.writeFile(outputPath, result);
					console.log(
						`Generation successful for ${outputFileName}. Lines written: ${result.split(
							"\n"
						).length}`
					);
				} catch (error) {
					console.error(
						`Error writing to ${outputFileName}: ${error.message}`
					);
				}
			}
		}
	} else {
		// Process a single mask file
		// Remove the loop for wordlistFiles, we only need to process one
		let inputData;
		if (selectedWordlist === "base-word.txt") {
			// Read base-word.txt from the script's directory
			inputData = await readFile(
				path.join(__dirname, "..", selectedWordlist)
			);
		} else {
			// Read other wordlists from the specified directory
			inputData = await readFile(
				path.join(
					__dirname,
					"..",
					config.LOCAL_WORLISTS_DIRECTORY,
					selectedWordlist
				)
			);
		}

		const maskData = await readMasks(
			path.join(
				__dirname,
				"..",
				config.LOCAL_MASKS_DIRECTORY,
				selectedMaskFile
			)
		);

		const result = await generate(inputData, maskData);

		const outputFileName = `${path.basename(
			selectedWordlist,
			path.extname(selectedWordlist)
		)}-${path.basename(selectedMaskFile, path.extname(selectedMaskFile))}-${
			config.GENERIC_MASKS_RESULTS_FILENAME
		}`;
		const outputPath = path.join(
			config.WORDLIST_MASKS_RESULTS_DIRECTORY,
			outputFileName
		);

		try {
			await fs.writeFile(outputPath, result);
			console.log(
				`Generation successful for ${outputFileName}. Lines written: ${result.split(
					"\n"
				).length}`
			);
		} catch (error) {
			console.error(
				`Error writing to ${outputFileName}: ${error.message}`
			);
		}
	}
};

generateAndSave();
