
// Find artist will break down the artist name into a query and plug it into the options variable
// This should return a list of potential artists as a response
function findArtist(artistName) {

	console.log("Finding artist " + artistName);


	// This function will execute on the response being received
	callback = function(response) {
		var body = '';
		response.on("data", function(chunk) {
			body += chunk;
		});
		response.on("end", function() {
			console.log(body);
			findArtistUrl(response);
		});
		
	}
	http.request(options, callback).end();
}

// findArtistUrl() will check to see if the response is successful 
// - if so, we will take the response and find the link to the first artist's page
function findArtistUrl(response) {

	// See if response is JSON
	try {
		// 
		switch (response.headers.status) {
			case "301 Moved Permanently":
				// This means we should use the location they give us, because the link has moved
				var newLocation = response.headers.location;
				options = {
					host: newLocation.split("//")[1].split("/")[0],
					path: "/" + newLocation.split("//")[1].split("/")[1]
				}
				findArtist("No name");
				break;
			case "200 OK":
				console.log("Successful search");
				//console.log(response);
				break;
		}
	} catch(err) {
		console.log("Response is not JSON. Need assistance.")
	}
}


var http = require('http');
var request = require('request');
var cheerio = require('cheerio');

/*request('http://rapgenius.com/search?q=lil+wayne', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body); // Print the google web page.
  }
});*/


findArtist("Lil Wayne");






