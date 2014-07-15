var sylCheck = require("../../js/syllableCounter.js");
var querystring = require('querystring');
var request = require('request');

// We'll use wordcalc.com
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
//'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
'Accept-Encoding: gzip,deflate,sdch

http://www.wordcalc.com/index.php

