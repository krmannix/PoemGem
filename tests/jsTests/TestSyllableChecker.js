var sylCheck = require("../../js/syllableCounter.js") ;
var cheerio = require('cheerio');
var request = require('request');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var Jetty = require("jetty");

// All words we're going to test
var words = [];
var stats = [];

// We store all our words in a seperate file so we can read them in
var getWords = new Promise(function(resolve, reject) {
	fs.readFile(path.join(__dirname, 'files/wordList.txt'), 'utf8', function(error, data) {
		if (error) {
			reject("Error reading file: " + error)
		} else {
			// Remove last possible newline character
			if (data[data.length - 1] === "\n") 
				data = data.slice(0, -1);
			var newWords = data.split("\n");
			for (var j = 0; j < newWords.length; j++) {
				words.push(newWords[j].toLowerCase().trim());
			}
			resolve("Finished reading files");
		}
	});
});

// This is runs an individual test for every word pushes them to a stack
//		This returns to runTest, which will then take these stats and compile them
var sylTest = new Promise(function(resolve, reject) {
	var wordsDoNotExist = 0;
	getWords.then(function(response) {
		for (var i = 0; i < words.length; i++) {
			getWordInfo(words[i]).then(function(response) {
				// If the word didn't exist on online database, don't add it
				if (response.syllableExtra === "") {
					wordsDoNotExist++;
				} else {
					stats.push(response);
				}
				if (stats.length === (words.length - wordsDoNotExist)) {
					resolve(stats);
				}
			});	
		}
	});
});

// Search for the syllable count in the webpage
function parseHTML(bodyIn) {
	var numSyllables = 0;
 	$ = cheerio.load(bodyIn);
 	return $('#SyllableContainer_ResultFormatting').text().replace(/[^0-9]/g, "");
}

// Run both tests: the control group of the web request and the local syllable checker
 function continueAfterRequest(wordIn, bodyIn) {
 	var numSyl = parseHTML(bodyIn);
 	var localNumSyl = sylCheck.getSyllables(wordIn);
 	return {word: wordIn,
 			syllableLocal: localNumSyl,
 			syllableExtra: numSyl};
 }

// Webpage request which will them be parse
function getWordInfo(wordIn) {
 	return new Promise(function(resolve, reject) {
 		request("http://www.howmanysyllables.com/words/" + wordIn, function(error, response, body) {
 			if (!error && response.statusCode == 200) {
 				resolve(continueAfterRequest(wordIn, body));
 			} else {
 				reject(error);
 			}
 		});
 	});
 }

// Take the result from all individual tests and print/return useful information
 function calculateStats(numWrong, numWordsTotal, wrongWords) {
 	if (wrongWords > 0) console.log("Wrong words:");
 	for (word in wrongWords) {
 		var needExtraSpaces = wrongWords[word].word.length - 8;
 		while (needExtraSpaces++ < 0) wrongWords[word].word += " "; // Align all words correctly
 		console.log("\t"+wrongWords[word].word+"\treal: " + wrongWords[word].syllableExtra+"\tours: " + wrongWords[word].syllableLocal);
 	}
 	console.log("Percentage wrong: " + Math.floor((numWrong/numWordsTotal)*100) + "%");
 	return numWrong/numWordsTotal;
 }

// The main module wrapper function - calls the smaller test function and returns to the runTests.js file
var runTest = new Promise(function(resolve, reject) {
	console.log("Running Syllable Check Test...");
	var numWrong = 0;
	var wrongWords = [];
	sylTest.then(function(response) {
		if (response.length === 0) {
			reject("Couldn't run Syllable test correctly.")
		} else {
			for (var i = 0; i < response.length; i++) {
				if (response[i].syllableExtra != response[i].syllableLocal) {
					numWrong++;
					wrongWords.push(response[i]);
				}
			}
			resolve(calculateStats(numWrong, response.length, wrongWords));
		}
	});
});


module.exports.runTest = runTest;

