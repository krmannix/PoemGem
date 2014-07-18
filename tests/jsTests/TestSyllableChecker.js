var sylCheck = require("../../js/syllableCounter.js") ;
var querystring = require('querystring');
var cheerio = require('cheerio');
var http = require('http');
var body = "";

// We'll use wordcalc.com
// http://stackoverflow.com/questions/6158933/how-to-make-an-http-post-request-in-node-js
var data = querystring.stringify({
	text: 'actually',
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
	 	continueAfterRequest(body);
 	});

 	res.on('end', function(){
 		continueAfterRequest(body);
    });
});

// post the data
 post_request.write(data);
 post_request.end();

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
 	console.log("sylCheck: " + sylCheck.getSyllables("actually"));
 	console.log("Test: " + numSyl);
 }

