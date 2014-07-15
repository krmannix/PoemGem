var sylCheck = require("../../js/syllableCounter.js");
var querystring = require('querystring');
var request = require('request');

// We'll use wordcalc.com
// http://stackoverflow.com/questions/6158933/how-to-make-an-http-post-request-in-node-js
var data = querystring.stringify({

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
          console.log('Response: ' + chunk);
    });
});

// post the data
 post_req.write(post_data);
 post_req.end();