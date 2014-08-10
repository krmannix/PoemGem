// Initialize html parser and HTTP request modules
var request = require('request');
var cheerio = require('cheerio');
var sylCounter = require('../js/syllableCounter.js');
var Promise = require('bluebird');
var Parse = require('parse').Parse;
Parse.initialize("xVGwbfMCJHMeWgDDF8F7kjl82tqI7nISHMEkST9p", "dhKnIYqkzvCFC7mZ5qCCLFCqJNDACWE3UXph7tM4");

// Set global variables to help "block" non-blocking calls
var allLines = []; 
var currentArtist;

function runArtistScript(artistName) {
	checkForNewArtist(formatArtistName(artistName));
}

// Send a request to DB to check if artist has already been serviced. This is so we don't unfairly
// favor certain artists if their songs have already been uploaded.
// This will call the findArtist() function
function checkForNewArtist(artistName, callback) {
	Parse.Cloud.run('checkForNewArtist', { artist: artistName}, {
		success: function(value) {
			if (value === true) {
				currentArtist = artistName;
				findArtist(artistName);
			} else {
				console.log("Artist " + artistName + " is already in the database");
			}
		},
		error: function(error) 
		{
			console.log(error);
		}
	});
}

// Return body of artist search from artist name from Rap Genius
function findArtist(artistName) {
	request('http://rapgenius.com/search?q=' + formatArtistName(artistName), function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  		findArtistLinkFromHTML(body); // Send the body to be parsed
	  } else {
	  	console.log("Something went wrong");
	  }
	});
}

// Get links of songs for artist
function findArtistLinkFromHTML(body) {
	var links = [];
	$ = cheerio.load(body);
	var linksObjects = $(".song_link");
	for (var i = 0; i < linksObjects.length; i++) {
		links.push(linksObjects[i].attribs.href);
	}
	var body = [];
	goToLinks(links, body);
}

// Go to link for song to scrape lyrics
function goToLinks(links, bodyArray) {
	if (links.length > 0) {
		request(links.pop(), function(error, response, body) {
			if (!error && response.statusCode == 200) {
				bodyArray.push(body);
				goToLinks(links, bodyArray);
			} else {
				console.log("Something went wrong accessing song link");
			}
		});
	} else {
		for (var t = 0; t < bodyArray.length; t++) {
			createMapOneDegree(scrapeLyrics(bodyArray[t]));
		}
		//createMapOneDegree(allLines); // Now that we've concatenated all lines, create a map out of these
	}
}

function createAllMaps(bodyArray) {
	for (var i = 0; i < bodyArray.length; i++) {
		createMapOneDegree(scrapeLyrics(bodyArray[i]));
		setTimeout(function() {}, 3000);
	}
}

// Grab lyrics for a song 
function scrapeLyrics(body) {
	var songLines = [];
	$ = cheerio.load(body);
	var lyricObject = $(".lyrics > p").find("a");

	// Parse through each lyric and it's children
	for (var j = 0; j < lyricObject.length; j++) {
		for (var k = 0; k < lyricObject[j].children.length; k++) {
			if (lyricObject[j].children[k].data != undefined ) {

				// Remove extraneous characters and ensure that line is not blank, then add to array
				var line = lyricObject[j].children[k].data.replace(/\[.*\]|\"|\,|\r?\n|\r/g, "").toLowerCase();
				if (!(line === "")) songLines.push(line);
			}
		}
	}
	return songLines;
}

// This function will return an artists name down to a form in which urls can take
function formatArtistName(artistName) {
	return artistName.trim().replace(/'/g, "%27").replace(/\s{2,}/g, " ").replace(" ", "+").toLowerCase();
}

// This function will take array of lyric lines and create hashmaps for each word with a counter in JSON
// Final output will be JSON array
function createMapOneDegree(linkArray) {
	// Create empty JSON struct with artist name to hold all JSON data
	var JSONwords = {"artist" : currentArtist,"allWords" : []};

	// Go through each lyric and break each word apart into seperate indexes
	for (var i = 0; i < linkArray.length; i++) {
		var wordsInLine = linkArray[i].split(" ");
		for (var k = 0; k < wordsInLine.length - 1; k++) { // Go through each word in thisline, except for the last one (since it has no next word)

			if (JSONwords.allWords.length == 0) { // Initialize wordsInLine with first word
				JSONwords.allWords.push({"currentWord" : wordsInLine[k], "currentSyllable": sylCounter.getSyllables(wordsInLine[k]),"nextWords": []});
			} 

			var doesCurrentWordAlreadyExist = false;
			for (var j = 0; j < JSONwords.allWords.length; j++) { // Go through each word already seen in lyrics 

				if (JSONwords.allWords[j].currentWord === wordsInLine[k]) { // Look to see if we already have that word stored in the JSONwords array
					doesCurrentWordAlreadyExist = true;
					var doesNextWordAlreadyExist = false; // Now that the word already exists in JSONwords, see if the next word already exists as well
					for (next in JSONwords.allWords[j].nextWords) {
						if (JSONwords.allWords[j].nextWords[next].word === wordsInLine[k+1]) {
							doesNextWordAlreadyExist = true; 
							JSONwords.allWords[j].nextWords[next].count = Number(JSONwords.allWords[j].nextWords[next].count) + 1; // If already exists, increment number
							break;
						}
					}
					if (!doesNextWordAlreadyExist) { // If this is a new next word for the current word in JSONwords, initialize and push it
						JSONwords.allWords[j].nextWords.push({ "word": wordsInLine[k+1], "nextSyllable": sylCounter.getSyllables(wordsInLine[k+1]), "count": 1});
						// push to JSONwords.nextWords
					}
					break;
				}
			}
			// If this word is totally new to the JSONwords array, create it and initialize array for it's next words with current next word
			if (!doesCurrentWordAlreadyExist) {
				var nextWords = [];
				nextWords.push({"word": wordsInLine[k+1], "nextSyllable": sylCounter.getSyllables(wordsInLine[k+1]), "count" : 1});
				JSONwords.allWords.push({"currentWord" : wordsInLine[k], "currentSyllable": sylCounter.getSyllables(wordsInLine[k]), "nextWords": nextWords});
			}
		}
	}
	Parse.Cloud.run('sendMapToDatabase', JSONwords, {
		success: function(value) {
			console.log(value);
		},
		error: function(error) {
			console.log("Error in Parse: " + error.message);
		}
	});
	console.log("About to return from map " + linkArray[0]);
	return true;
}


/*===================
 *
 *	Main
 *
 *===================*/

//runArtistScript("Lil Wayne");
//runArtistScript("Jay-Z");
runArtistScript("Drake");
//runArtistScript("Kendrick");
//runArtistScript("Jay-Z");
//runArtistScript("Jay-Z");







