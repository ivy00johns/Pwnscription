# Pwnscription
```
██████╗ ██╗    ██╗███╗   ██╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗██║    ██║████╗  ██║██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
██████╔╝██║ █╗ ██║██╔██╗ ██║███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║
██╔═══╝ ██║███╗██║██║╚██╗██║╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║
██║     ╚███╔███╔╝██║ ╚████║███████║╚██████╗██║  ██║██║██║        ██║   ██║╚██████╔╝██║ ╚████║
╚═╝      ╚══╝╚══╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

# DISCLAIMER
## This project is for WiFi security education purposes ONLY!
## Hacking WiFi networks that you DO NOT OWN IS ILLEGAL!

----

# Utilities
* `npm run passwords`: Generate a custom wordlist containing all combinations of the `WORD_LIST` in the `config.js` file.
* `npm run combos`: Generate the results of what happens when a `.rule` file is applied to a wordlist file for a better understanding of what `.rule` files do in `hashcat`.

----

# Table Of Contents
* [Wordlists](#wordlists)
	* [Custom Wordlists](#custom-wordlists)
* [Rules](#rules)
	* [.rule * .txt Combinations](#rule-combinations-generation)

----

# Utilities Configuration
1. `cp .config.example .config`

# Wordlists
## Custom Wordlists
You can generate a list of possible passwords based on a couple of clues that could have be used to build the password you want to crack.

```javascript
...
// General configurations
PRINT_ITEMS: 10, // Number of items to print in the terminal
GENERATE_PERMUTATIONS: 2000, // Number of permutations to generate and add to the .txt file
EXPORT_FILE_NAME: "./hashcat/wordlists/generated-passwords.txt", // Name of the exported file
WORD_LIST: [], // List of words for generation
MAX_WORDS_USED: 2, // Max number of words that can be combined to form a given string
...
```

1. Edit the `config.js` file and add your clues to the `WORD_LIST: []` array.
	- `WORD_LIST: [A, B, C, D, E]`
2. Set the `MAX_WORDS_USED` variable to configure how many words will be contained in the final results:
	* 1 => `[A, B, C, D, E]` - 5 results
	* 2 => `[A, B, C, D, E, AB, AC, AD, AE, BA, BC, BD, BE, CA, CB, CD, CE, DA, DB, DC, DE, EA, EB, EC, ED]` - 25 results
	* Etc...
3. Run the `npm run passwords` command to generate a list of possible password combinations.
	* `["A", "AB", "AC", "AD", "AE", "B", "BA", "BC", "BD", "BE", "C", "CA", "CB", "CD", "CE", "D", "DA", "DB", "DC", "DE", "E", "EA", "EB", "EC", "ED"]`
4. It will export the list to a `.txt` file at the specificed location, `EXPORT_FILE_NAME`, by default:
	* `./hashcat/wordlists/generated-passwords.txt`
5. For example say you set the `WORD_LIST:` to `["cat", "dog", "rat"]`, you would get the following results:
	```text
	cat
	catdog
	catrat
	dog
	dogcat
	dograt
	rat
	ratcat
	ratdog
	```
6. You can then use the `generated-passwords.txt` file to try and crack the network passowrd by running `npm run scripts` again and looking for the wordlist in the generated script file for a given network.

----

# Rules
## Rule Combinations Generation 
Are you interested in what a `.rule` file generates? I've include the logic to help answer this questions.

* In the `config.js` file there are a few variables to help with this process. In them you can point to specific `.rule` and `.txt` files to create a list of the results when they are combined. By default it uses the `base-word.txt` file that contains the word `password`, and points to the `base64` rule set.
	```javascript
	...
	// Rule list permutations configurations
	TEST_WORD_LIST: "./hashcat/generator/base-word.txt",
	TEST_RULES_FILE: "./hashcat/rules/_NSAKEY.v2.dive.rule",
	RESULTS_DIRECTORY: "./hashcat/generator/results",
  	GENERIC_RESULTS_FILENAME: "wordlist-plus-rule-combinations.txt"
	...
	```

1. Run the `npm run combos` command to generate the list of strings that `hashcat` will generate in its work.
2. With the default configuration you will get the following results, truncated for readability.
	```text
	password
	sswordpasswordpa
	swordpas
	wordpass
	ordpassw
	rdpasswo
	passwore
	passwora
	dpasswor
	sswordpa
	```
3. By default the results each of the provided `.rule` files applied to the word `password` is provided in the `./hashcat/generator/results` directory.

**PLEASE NOTE**: There are certain rules in some `.rule` files that are not currently implemented in the `wordlist-combinations-generator.js` logic so the `x variations` counts can be lower than expected.

----

