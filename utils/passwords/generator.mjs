#!/usr/bin/env node

import fs from "fs/promises"; // Use promises for file system operations
import chalk from "chalk";
import inquirer from "inquirer";
import config from "../config.js";

// Function to check if a file exists
const fileExists = async (filePath) => {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
};

// Function to generate combinations of a given array of words
const generateCombinations = (words) => {
	const combinations = new Set();

	// Recursive function to generate combinations
	const generateCombo = (currentCombo, remainingWords) => {
		combinations.add(currentCombo); // Add current combination

		if (remainingWords === 0) {
			return; 
		}

		for (let i = 0; i < words.length; i++) {
			// Avoid repeating the same word within the combination
			if (!currentCombo.includes(words[i])) {
				generateCombo(currentCombo + words[i], remainingWords - 1);
			}
		}
	};

	for (let k = 1; k <= config.MAX_WORDS_USED; k++) {
		for (let i = 0; i < words.length; i++) {
			generateCombo(words[i], k - 1);
		}
	}

	return Array.from(combinations);
};

// Function to add a word to the array
const addWordToArray = async () => {
	const { word } = await inquirer.prompt({
		type: "input",
		message: "Enter a word (press enter to finish):",
		name: "word",
	});
	return word.trim(); 
};

// Function to start the input process
const inputWords = async () => {
	const wordsArray = [];

	while (true) {
		const word = await addWordToArray();
		if (!word) {
			break;
		}
		wordsArray.push(word);
	}

	console.log("Entered words:", wordsArray);

	return wordsArray;
};

// Function to save words to a file
const saveWordsToFile = async (wordsArray, fileName) => {
	try {
		await fs.writeFile(`${fileName}`, `module.exports = {\n\tWORD_LIST: ${JSON.stringify(wordsArray)}\n};`);
		console.log(`Manually entered words written to ${fileName}.`);
	} catch (error) {
		console.error(`Error writing to ${fileName}: ${error.message}`);
	}
};

// Main function to handle wordlist generation
const generateWordlist = async () => {
	let allCombinations = [];
	const choices = [".config.js", "manual", "Exit"];
	if (await fileExists(config.DEFAULT_CUSTOM_WORDLIST_FILENAME)) {
		choices.splice(1, 0, config.DEFAULT_CUSTOM_WORDLIST_FILENAME);
	}

	const { selectedAction } = await inquirer.prompt([{
		type: "list",
		name: "selectedAction",
		message: "Select generation process:",
		choices
	}]);

	if (selectedAction === ".config.js") {
		allCombinations = generateCombinations(config.WORD_LIST);
	} else if (selectedAction === "manual") {
		const wordsArray = await inputWords();
		allCombinations = generateCombinations(wordsArray);

		// Ask to save the file
		const { saveFile } = await inquirer.prompt({
			type: "confirm",
			name: "saveFile",
			message: "Do you want to save the words to a file?",
			default: true
		});

		if (saveFile) {
			const { fileName } = await inquirer.prompt({
				type: "input",
				name: "fileName",
				message: "Enter the file name:",
				default: config.DEFAULT_CUSTOM_WORDLIST_FILENAME
			});
			await saveWordsToFile(wordsArray, fileName);
		}
	} else if (selectedAction === config.DEFAULT_CUSTOM_WORDLIST_FILENAME) {
		try {
			const customConfig = await import(`../${config.DEFAULT_CUSTOM_WORDLIST_FILENAME}`);
			if (customConfig.default && customConfig.default.WORD_LIST) {
				allCombinations = generateCombinations(customConfig.default.WORD_LIST);
			} else {
				console.error(`Error: WORD_LIST not found in ${config.DEFAULT_CUSTOM_WORDLIST_FILENAME}`);
				return;
			}
		} catch (error) {
			console.error(`Error importing ${config.DEFAULT_CUSTOM_WORDLIST_FILENAME}: ${error.message}`);
			return;
		}
	} else if (selectedAction === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		return;
	}

	// Custom sorting function
	const sortCombinations = (a, b) => {
		if (config.SORT_BY_LENGTH) {
			if (a.length !== b.length) {
				return config.SORT_LENGTH_ASCENDING ? a.length - b.length : b.length - a.length;
			}
		}
		return config.SORT_ALPHABETICALLY ? a.localeCompare(b) : 0;
	};

	const sortedCombinations = allCombinations.sort(sortCombinations);
	const filteredCombinations = sortedCombinations.filter((combo) => {
		const length = combo.length;
		return ((!config.MIN_LENGTH || length >= config.MIN_LENGTH) &&
				(!config.MAX_LENGTH || length <= config.MAX_LENGTH));
	});

	const itemsToPrint = Math.min(config.PRINT_ITEMS, filteredCombinations.length);
	console.log(`Printing ${itemsToPrint} items:`);
	console.log(filteredCombinations.slice(0, itemsToPrint));
	console.log(`Generated ${filteredCombinations.length} unique combinations.`);

	const combinationsToWrite = Math.min(config.GENERATE_PERMUTATIONS, filteredCombinations.length);
	const outputFileName = config.EXPORT_FILE_NAME;

	try {
		await fs.writeFile(outputFileName, filteredCombinations.slice(0, combinationsToWrite).join("\n"));
		console.log(`${combinationsToWrite} combinations written to ${outputFileName}.`);
	} catch (error) {
		console.error(`Error writing to ${outputFileName}: ${error.message}`);
	}
};

generateWordlist();
