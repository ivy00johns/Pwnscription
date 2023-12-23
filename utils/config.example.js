module.exports = {
	// General configurations
	PRINT_ITEMS: 10, // Number of items to print in the terminal
	GENERATE_PERMUTATIONS: 2000, // Number of permutations to generate and add to the .txt file
	EXPORT_FILE_NAME: "./hashcat/wordlists/generated-passwords.txt", // Name of the exported file
	WORD_LIST: [], // List of words for generation
	MAX_WORDS_USED: 6, // Max number of words that can be combined to form a given string

	// Sorting configurations
	SORT_BY_LENGTH: false, // Whether to sort permutations by length
	SORT_LENGTH_ASCENDING: false, // If sorting by length, whether to sort in ascending order
	SORT_ALPHABETICALLY: true, // Whether to sort alphabetically

	// Length constraints for generated strings
	MIN_LENGTH: 8, // Minimum length of generated strings
	MAX_LENGTH: 25, // Maximum length of generated strings

	// Rule list permutations configurations
	TEST_WORD_LIST: "./utils/wordlist-rules-combinations/base-word.txt",
	TEST_RULES_FILE: "./hashcat/rules/__NSAKEY.v2.dive.rule",
	RESULTS_DIRECTORY: "./utils/wordlist-rules-combinations/results",
  	GENERIC_RESULTS_FILENAME: "wordlist-plus-rule-combinations.txt"
};
