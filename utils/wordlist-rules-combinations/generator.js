const fs     = require("fs");
const config = require("../../config");
const logos = require("../../scripts/logos");

const inputData = readFile(config.TEST_WORD_LIST);
const ruleData  = readRules(config.TEST_RULES_FILE);

function readFile(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8").split(/[\s,]+/).filter((v, i, a) => a.indexOf(v) === i).filter(function(e) {
			return e === 0 || e
		});
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
}

function readRules(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8")
			.split('\n')
			.map(line => line.trim())
			.filter(line => line !== "");
	} catch (error) {
		console.error(`Error reading file ${filePath}: ${error.message}`);
		process.exit(1);
	}
}

function convertN(chr) {
	if (chr >= "0" && chr <= "9") {
		return Number(chr);
	}
	return Number(chr.toUpperCase().charCodeAt(0) - 55);
}

function Nothing(string) {
	return string;
}

function Lowercase(string) {
	return string.toLowerCase();
}

function Uppercase(string) {
	return string.toUpperCase();
}

function Capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function InvertCapitalize(string) {
	return string.charAt(0).toLowerCase() + string.slice(1).toUpperCase();
}

function TogglePosition(string, pos) {

	if (isNaN(parseInt(pos)))
		pos = convertN(pos);
	if (string.charAt(pos) === string.charAt(pos).toUpperCase()) {
		return string.slice(0, pos) + string.charAt(pos).toLowerCase() + string.slice(pos + 1);
	}
	if (string.charAt(pos) === string.charAt(pos).toLowerCase()) {
		return string.slice(0, pos) + string.charAt(pos).toUpperCase() + string.slice(pos + 1);
	}
}

function ToggleCase(string) {
	for (var i = 0; i < string.length; i++) {
		string = TogglePosition(string, i);
	}
	return string;
}

function Reverse(string) {
	return string.split("").reverse().join("");
}


function Duplicate(string) {
	return string + string;
}

function DuplicateN(string, n) {
	var tmp = "";
	n = convertN(n);
	for (var i = 0; i < n; i++) {
		tmp += string;
	}
	return tmp;
}

function Reflect(string) {
	return string + Reverse(string);
}

function RotateLeft(string) {
	return string.slice(1) + string.charAt(0);
}


function RotateRight(string) {
	return string.charAt(string.length - 1) + string.slice(0, string.length - 1);
}

function AppendCharacter(string, chr) {
	return string + chr;
}

function PrependCharacter(string, chr) {
	return chr + string;
}

function TruncateLeft(string) {
	return string.slice(1);
}

function TruncateRight(string) {
	return string.slice(0, string.length - 1);
}


function DeleteN(string, n) {
	n = convertN(n);
	return string.slice(0, n) + string.slice(n + 1);
}

function ExtractRange(string, start, end) {
	start = convertN(start);
	end = convertN(end);
	return string.slice(start, end);
}

function OmitRange(string, start, end) {
	start = convertN(start);
	end = convertN(end);
	return string.slice(0, start) + string.slice(start + end);
}

function InsertN(string, n, chr) {
	n = convertN(n);
	return string.slice(0, n) + chr + string.slice(n);
}

function OverwriteN(string, n, chr) {
	n = convertN(n);
	if (n >= string.length) return string;
	return string.slice(0, n) + chr + string.slice(n + 1);
}

function TruncateN(string, n) {
	return string.slice(0, n);
}

function Replace(string, find, replace) {
	return string.replaceAll(find, replace);
}

function Purge(string, chr) {
	return Replace(string, chr, "");
}

function DuplicateFirstN(string, n) {
	return DuplicateN(string.charAt(0), n) + string;
}

function DuplicateLastN(string, n) {
	if (string.length === 0) return string;
	return string + DuplicateN(string.charAt(string.length - 1), n);
}

function DuplicateAll(string) {
	var result = "";
	var length = string.length;
	for (var i = 0; i < length; i++) {
		result += string.charAt(i) + string.charAt(i);
	}
	return result;
}

function applyRule(string, rule) {
	if (rule.trim().charAt(0) === "#") return false;
	if (rule.trim().length === 0) return false;
	for (var i = 0; i < rule.length;) {
		switch (rule.charAt(i)) {
			case ":":
				string = Nothing(string);
				i++;
				break;
			case "l":
				string = Lowercase(string);
				i++;
				break;
			case "u":
				string = Uppercase(string);
				i++;
				break;
			case "c":
				string = Capitalize(string);
				i++;
				break;
			case "C":
				string = InvertCapitalize(string);
				i++;
				break;
			case "t":
				string = ToggleCase(string);
				i++;
				break;
			case "T":
				string = TogglePosition(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "r":
				string = Reverse(string);
				i++;
				break;
			case "d":
				string = Duplicate(string);
				i++;
				break;
			case "p":
				string = DuplicateN(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "f":
				string = Reflect(string);
				i++;
				break;
			case "{":
				string = RotateLeft(string);
				i++;
				break;
			case "}":
				string = RotateRight(string);
				i++;
				break;
			case "$":
				string = AppendCharacter(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "^":
				string = PrependCharacter(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "[":
				string = TruncateLeft(string);
				i++;
				break;
			case "]":
				string = TruncateRight(string);
				i++;
				break;
			case "D":
				string = DeleteN(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "x":
				string = ExtractRange(string, rule.charAt(i + 1), rule.charAt(i + 2));
				i += 3;
				break;
			case "O":
				string = OmitRange(string, rule.charAt(i + 1), rule.charAt(i + 2));
				i += 3;
				break;
			case "i":
				string = InsertN(string, rule.charAt(i + 1), rule.charAt(i + 2));
				i += 3;
				break;
			case "o":
				string = OverwriteN(string, rule.charAt(i + 1), rule.charAt(i + 2));
				i += 3;
				break;
			case "\"":
				string = TruncateN(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "s":
				string = Replace(string, rule.charAt(i + 1), rule.charAt(i + 2));
				i += 3;
				break;
			case "@":
				string = Purge(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "z":
				string = DuplicateFirstN(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "Z":
				string = DuplicateLastN(string, rule.charAt(i + 1));
				i += 2;
				break;
			case "q":
				string = DuplicateAll(string);
				i++;
				break;
			default:
				i++;
				break;
		}
	}
	return string;
}

function generate(data, rules, filterWiFi) {
	var list = new Set();
	for (let string of data) {
		for (let rule of rules) {
			var ruleResult = applyRule(string, rule);
			if (ruleResult !== false) {
				if (filterWiFi) {
					if (ruleResult.length < 8) continue;
				}
				list.add(ruleResult);
			}
		}
	}

	const result = Array.from(list).join("\n");
	return result;
}

logos.printWeakpass();

const result = generate(inputData, ruleData, true);

// Build the output filename based on the rule file name
const ruleFileName = config.TEST_RULES_FILE.split("/").pop().replace(/\.[^/.]+$/, "");
const outputFileName = `${ruleFileName}-${config.GENERIC_RESULTS_FILENAME}`;

// Write result to the specified directory and filename
const outputPath = `${config.RESULTS_DIRECTORY}/${outputFileName}`;
try {
	fs.writeFileSync(outputPath, result);
	console.log(`Generation successful. Check ${outputFileName} for the result. Lines written: ${result.split('\n').length}`);
} catch (error) {
	console.error(`Error writing to ${outputFileName}: ${error.message}`);
}
