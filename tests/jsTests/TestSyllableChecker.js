var sylCheck = require("../../js/syllableCounter.js") ;
var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');
var body = "";

 function parseHTML(bodyIn) {
 	var numSyllables = 0;
 	$ = cheerio.load(bodyIn);
 	$('td').each(function(i, element) {
 		if ($(this).text() === "Syllable Count") {
 			numSyllables = $(this).next().text();
 			return false;
 		}
 	});
 	return Number(numSyllables);
 }

 function continueAfterRequest(bodyIn) {
 	var numSyl = parseHTML(bodyIn);
 	return numSyl;
 }

 var runTest = function runTest(wordIn) {

 	// Make a promise so we can chain the result in the main Test module
 	return new Promise(function(resolve, reject) {
 		// We'll use wordcalc.com
		// http://stackoverflow.com/questions/6158933/how-to-make-an-http-post-request-in-node-js
		var data = querystring.stringify({
			text: wordIn.trim(),
			optionSyllableCount: 'on'
		});

		var options = {
		host: 'www.wordcalc.com',
		path: '/index.php',
		method: 'POST',
		headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			}
		};

		var post_request = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
		          body += chunk;
		    });

		    res.on("close", function() {
		    	if (res.statusCode === 200) {
		 			resolve(continueAfterRequest(body));
		 		} else {
		 			reject(Error(res.statusCode));
		 		}
		 	});

		 	res.on('end', function(){	
		 		if (res.statusCode === 200) {
		 			resolve(continueAfterRequest(body));
		 		} else {
		 			reject(Error(res.statusCode));
		 		}
		    });
		});

		// post the data
		 post_request.write(data);
		 post_request.end();

 	});
}

runTest("actually").then(function(response) {
	console.log("Response: " + response);
});

module.exports.runTest = runTest;

