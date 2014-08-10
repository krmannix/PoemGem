// Initialize html parser and HTTP request modules
var request = require('request');
var cheerio = require('cheerio');
var sylCounter = require('../js/syllableCounter.js');
var Promise = require('bluebird');
var Parse = require('parse').Parse;
Parse.initialize("xVGwbfMCJHMeWgDDF8F7kjl82tqI7nISHMEkST9p", "dhKnIYqkzvCFC7mZ5qCCLFCqJNDACWE3UXph7tM4");
getSentence();

function getSentence() {
	Parse.Cloud.run("getSentence", { numWords: 7}, {
		success: function(result) {
			console.log(result);
		}, 
		error: function(error) {
			console.log(error.message);
		}
	});
}

