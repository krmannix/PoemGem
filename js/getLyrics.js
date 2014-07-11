// Initialize html parser and HTTP request modules
var request = require('request');
var cheerio = require('cheerio');
var Parse = require('parse').Parse;
Parse.initialize("xVGwbfMCJHMeWgDDF8F7kjl82tqI7nISHMEkST9p", "dhKnIYqkzvCFC7mZ5qCCLFCqJNDACWE3UXph7tM4");

// Set global variables to help "block" non-blocking calls


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
	//for (var i = 0; i < linksObjects.length; i++) {
		goToLink(linksObjects[0].attribs.href);
		console.log("Done with this link");
	//}
}

// Go to link for song to scrape lyrics
function goToLink(link) {
	console.log("Go to Link");
	request(link, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			scrapeLyrics(body); // Send the body to be parsed
		} else {
			console.log("Something went wrong accessing song link");
		}
	});
}

// Grab lyrics for a song 
function scrapeLyrics(body) {
	console.log("Scrape lyrics");
	$ = cheerio.load(body);
	// lines will hold all applicable 
	var lines = [];
	var lyricObject = $(".lyrics > p").find("a");

	// Parse through each lyric and it's children
	for (var j = 0; j < lyricObject.length; j++) {
		for (var k = 0; k < lyricObject[j].children.length; k++) {
			if (lyricObject[j].children[k].data != undefined ) {

				// Remove extraneous characters and ensure that line is not blank, then add to array
				var line = lyricObject[j].children[k].data.replace(/\[.*\]|\"|\,|\r?\n|\r/g, "").toLowerCase();
				if (!(line === "")) lines.push(line);
			}
		}
	}
	createMapOneDegree(lines);
}

// This function will return an artists name down to a form in which urls can take
function formatArtistName(artistName) {
	return artistName.trim().replace(/'/g, "%27").replace(/\s{2,}/g, " ").replace(" ", "+").toLowerCase();
}

// This function will take array of lyric lines and create hashmaps for each word with a counter in JSON
// Final output will be JSON array
function createMapOneDegree(linkArray) {
	console.log("Creating map");
	// Create empty array to hold all JSON data
	var JSONwords = {"allWords" : []};

	// Go through each lyric and break each word apart into seperate indexes
	for (var i = 0; i < linkArray.length; i++) {
		var wordsInLine = linkArray[i].split(" ");
		for (var k = 0; k < wordsInLine.length - 1; k++) { // Go through each word in thisline, except for the last one (since it has no next word)

			if (JSONwords.allWords.length == 0) { // Initialize wordsInLine with first word
				JSONwords.allWords.push({"currentWord" : wordsInLine[k], "nextWords": []});
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
						JSONwords.allWords[j].nextWords.push({ "word": wordsInLine[k+1], "count": 1});
						// push to JSONwords.nextWords
					}
					break;
				}
			}
			// If this word is totally new to the JSONwords array, create it and initialize array for it's next words with current next word
			if (!doesCurrentWordAlreadyExist) {
				var nextWords = [];
				nextWords.push({"word": wordsInLine[k+1], "count" : 1});
				JSONwords.allWords.push({"currentWord" : wordsInLine[k], "nextWords": nextWords});
			}
		}
	}
	for (var q = 0; q <3; q++) {
		console.log(JSON.stringify(JSONwords.allWords[q], null, 2));
	}
}


/*===================
 *
 *	Main
 *
 *===================*/

runArtistScript("Lil Wayne");






