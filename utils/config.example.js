module.exports = {
	LOCAL_WORLISTS_DIRECTORY: "../hashcat/wordlists", // Local wordlists directory
	LOCAL_RULES_DIRECTORY: "../hashcat/rules", // Local rules directory
	LOCAL_MASKS_DIRECTORY: "../hashcat/masks", // Local masks directory

	// General configurations
	PRINT_ITEMS: 5, // Number of items to print in the terminal
	GENERATE_PERMUTATIONS: 2000, // Number of permutations to generate and add to the .txt file
	EXPORT_FILE_NAME: "../hashcat/wordlists/generated-passwords.txt", // Name of the exported file
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
	TEST_RULES_WORD_LIST: "../utils/base-word.txt",
	TEST_MASKS_WORD_LIST: "../utils/base-word.txt",
	WORDLIST_RULES_RESULTS_DIRECTORY: "../utils/wordlist-rules-combinations/results",
	WORDLIST_MASKS_RESULTS_DIRECTORY: "../utils/wordlist-masks-combinations/results",
  	GENERIC_RULES_RESULTS_FILENAME: "wordlist-rules-combinations.txt",
	GENERIC_MASKS_RESULTS_FILENAME: "wordlist-masks-combinations.txt"
};
