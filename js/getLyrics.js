// Initialize html parser and HTTP request modules
var request = require('request');
var cheerio = require('cheerio');

// Return body of artist search from artist name from Rap Genius
function findArtist(artistName) {
	request('http://rapgenius.com/search?q=' + formatArtistName(artistName), function (error, response, body) {
		console.log("Link: http://rapgenius.com/search?q=" + formatArtistName(artistName));
	  if (!error && response.statusCode == 200) {

	    findArtistLinkFromHTML(body); // Send the body to be parsed
	  } else {
	  	console.log("Something went wrong");
	  }
	});
}

// Get links of songs for artist
function findArtistLinkFromHTML(body) {
	var artistLinks = [];
	$ = cheerio.load(body);
	var linksObjects = $(".song_link");
	var links = [];
	//for (var i = 0; i < linksObjects.length; i++) {
		goToLink(linksObjects[0].attribs.href);
	//}
}

// Go to link for song to scrape lyrics
function goToLink(link) {
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
	$ = cheerio.load(body);
	// lines will hold all applicable 
	var lines = [];
	var lyricObject = $(".lyrics > p").find("a");

	// Parse through each lyric and it's children
	for (var j = 0; j < lyricObject.length; j++) {
		for (var k = 0; k < lyricObject[j].children.length; k++) {
			if (lyricObject[j].children[k].data != undefined ) {

				// Remove extraneous characters and ensure that line is not blank, then add to array
				var line = lyricObject[j].children[k].data.replace(/\[.*\]|\"|\,|\r?\n|\r/g, "");
				if (!(line === "")) lines.push(line);
			}
		}
	}
	createMap(lines);
}

// This function will return an artists name down to a form in which urls can take
function formatArtistName(artistName) {
	return artistName.trim().replace(/'/g, "%27").replace(/\s{2,}/g, "+").toLowerCase();
}

function createMap(linkArray) {

}

// Send a request to DB to check if artist has already been serviced. This is so we don't unfairly
// favor certain artists if their songs have already been uploaded
function checkForNewArtist(artistName) {
	
}


/*===================
 *
 *	Main
 *
 *===================*/

findArtist("Lil Wayne");






