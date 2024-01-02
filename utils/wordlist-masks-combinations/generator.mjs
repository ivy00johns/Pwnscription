import fs from "fs";
import * as path from "path";
import { dirname } from "path";
import inquirer from "inquirer";
import config from "../config.js";
import { fileURLToPath } from "url";

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Set the project directory
const projectDirectory = __dirname;

const readFile = filePath => {
	try {
		return fs.readFileSync(filePath, "utf8").split(/[\s,]+/).filter((v, i, a) => a.indexOf(v) === i).filter(e => e === 0 || e);
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
};

const readMasks = filePath => {
	try {
		return fs.readFileSync(filePath, "utf8").split("\n").map(line => line.trim()).filter(line => line !== "");
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
};

const applyMask = (string, mask) => {
	if (typeof mask !== "string") {
		console.error(`Invalid mask: ${mask}`);
		return string;
	}

	const repeatedMask = mask.repeat(Math.ceil(string.length / mask.length));
	const adjustedMask = repeatedMask.slice(0, string.length);

	try {
		return string.split("").map((char, index) => (adjustedMask.charAt(index) === "?" ? char : adjustedMask.charAt(index))).join("");
	} catch (error) {
		console.error(`Error applying mask "${mask}" to string "${string}": ${error.message}`);
		return string;
	}
};

const generate = (data, masks) => {
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

const generateAndSave = async () => {
	const exclusions = [".gitkeep", ".gz"];
	const wordlistFiles = fs.readdirSync(config.LOCAL_WORLISTS_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));
	const maskFiles = fs.readdirSync(config.LOCAL_MASKS_DIRECTORY).filter(file => exclusions.every(exclusion => !file.includes(exclusion)));

	const { selectedWordlist, selectedMask } = await inquirer.prompt([
		{
			type: "rawlist",
			name: "selectedTxtFile",
			message: "Select a .txt file:",
			choices: ["base-word.txt", ...wordlistFiles, "Exit"]
		}, {
			type: "rawlist",
			name: "selectedMaskFile",
			message: "Select a mask file:",
			choices: ["ALL", ...maskFiles, "Exit"]
		}
	]);

	if (selectedWordlist === "Exit" || selectedMask === "Exit") {
		console.log(chalk.yellow("Goodbye!"));
		process.exit(0);
	}

	for (const wordlist of wordlistFiles) {
		for (const maskFile of maskFiles) {
			const inputData = readFile(path.join(projectDirectory, "..", config.LOCAL_WORLISTS_DIRECTORY, wordlist));
			const maskData  = readMasks(path.join(projectDirectory, "..", config.LOCAL_MASKS_DIRECTORY, maskFile));

			const result = generate(inputData, maskData);

			const outputFileName = `${path.basename(wordlist, path.extname(wordlist))}-${path.basename(maskFile, path.extname(maskFile))}-${config.GENERIC_MASKS_RESULTS_FILENAME}`;
			const outputPath = path.join(config.WORDLIST_MASKS_RESULTS_DIRECTORY, outputFileName);

			try {
				fs.writeFileSync(outputPath, result);
				console.log(`Generation successful for ${outputFileName}. Lines written: ${result.split("\n").length}`);
			} catch (error) {
				console.error(`Error writing to ${outputFileName}: ${error.message}`);
			}
		}
	}
};

generateAndSave();
