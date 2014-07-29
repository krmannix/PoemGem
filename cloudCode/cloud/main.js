Parse.Cloud.job("minimizeDB", function(request, status) {
	Parse.Cloud.useMasterKey();
	var queryMain = new Parse.Query("rapWord1D");
	queryMain.each(function(word) {
		var query = new Parse.Query("rapWord1D");
		query.equalTo("word", word.get("word"));
		query.equalTo("nextword", word.get("nextword"));
		query.find({
			success: function(results) {
				word.set("count", word.get("count") + results.length);
				// Now delete all the words
				deleteWords(results);
				word.save(); // Not sure if word will be involved in query, so we should save it
			}
		});
	}).then(function() {
		status.success("Minimized Database"); // Get size of db
	}, function(error) {
		status.error("Something wrong: " + error.message);
	});
});

// Get rid of any unnessecary characters that may have snuck in during ingestion
Parse.Cloud.job("cleanWords", function(request, status) {
	Parse.Cloud.useMasterKey();
	var queryMain = new Parse.Query("rapWord1D");
	queryMain.each(function(word) {
		var cleanWord = word.get("word").replace(/\W+/g, "");
		var cleanNextWord = word.get("nextword").replace(/\W+/g, "");
		if (cleanWord !== word.get("word") || cleanNextWord !== word.get("nextword")) {
			if (cleanWord === "" || cleanNextWord === "") {
				word.destroy();
			} else {
				word.set("word", cleanWord);
				word.set("nextword", cleanNextWord);
				word.save();
			}
		}
	}).then(function() {
		status.success("Clean DB");
	}, function(error) {
		status.error("Something went wrong cleaning: " + error.message);
	});
});

// Recrusive JS for deleting words
function deleteWords(words) {
	if (words.length > 0) {
		words.pop().destroy({
			success: function(word) {
				deleteWords(words);
			},
			error: function(word, error) {
				console.log("Error deleting the word (" + word.get("word") + "): " + error.message);
			}
		})
	}
}

Parse.Cloud.define("getSentence", function(request, response) {
	var numWords = request.numWords;
	if (typeof numWords === "undefined") response.error("Didn't tell how many words");
	var returnedSentence = "";



});

function chooseNextWord(word, sentence) {
	var query = new Parse.Query("rapWord1D");
	query.equalTo("word", word.get("nextword"));
	query.find({
		success: function(results) {
			var total = 0;
			var words = [];
			for (var i = 0; i < results.length; i++) {
				words.push({
					"word":results[i].get("nextword"),
					"count":results[i].get("count")
				});
				total += results[i].get("count");
			}
			var randNum = Math.floor(Math.random()*total);
			var nextWord, cumSum = 0;
			for (var j = 0; j < words.length; j++) {
				cumSum += words[j].count;
				if (randNum < cumSum) {
					nextWord = words[j];
					break;
				}
			}
			chooseNextWord(nextWord, " " + nextWord);
		}, 
		error: function(error) {
			console.log("Parse Error finding word! " + error.message);
		}
	});
}

Parse.Cloud.define("checkForNewArtist", function(request, response) {
	var query = new Parse.Query("artists");
	query.equalTo("artist", request.params.artist);
	query.find({
		success: function(results) {
			if (results.length > 0) response.success(false);
			else response.success(true);
		}, 
		error: function(error) {
			response.error("Could not check table for new Artist");
		}
	});
});


function createWord(currentword, nextword, count, syllable, nextsyllable) {
	var Word = Parse.Object.extend("rapWord1D"); // In future, have reqest with this value
	var wordInDB = new Word();
	wordInDB.set("word", currentword);
	wordInDB.set("syllable", syllable);
	wordInDB.set("nextword", nextword);
	wordInDB.set("syllableNext", nextsyllable);
	wordInDB.set("count", count);
	return wordInDB;
}

Parse.Cloud.define("sendMapToDatabase", function(request, response) {
	// Remember to put each artist in database
	var body = request.params;
	var artistName = body.artist;
	var query = new Parse.Query("artists");
	var Word = Parse.Object.extend("rapWord1D"); // In future, have reqest with this value
	query.equalTo("artist", artistName);
	query.find({
		success: function(results) {
			if (results.length > 0) {
				// Update word count for artist already in database
				var newWords = body.allWords.length;
				var artist = results[0];
				var wordCount = artist.words;
				if (wordCount === null || wordCount === undefined || wordCount == 0) {
					wordCount = body.allWords.length;
				} else {
					wordCount += body.allWords.length;
				}
				artist.set("words", wordCount);
				artist.save(null, {
					success: function(results) {
						// Go through all word -> nextword combinations, and on last one submit response to be successful.
						var allWords = []; 
						for (var i = 0; i < body.allWords.length; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								if (i === body.allWords.length - 1 && j === body.allWords[i].nextWords.length - 1) {
									allWords.push(createWord(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, 
										body.allWords[i].nextWords[j].nextSyllable, body.allWords[i].currentSyllable));
									Parse.Object.saveAll(allWords, {
										success: function(list) {
											response.success(true);
										}, 
										error: function(error) {
											response.error(error.message);
										}
									});
								} else {
									allWords.push(createWord(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, 
										body.allWords[i].nextWords[j].nextSyllable, body.allWords[i].currentSyllable));
								}
							}
						}
					},
					error: function(error) {
						console.log(error);
					}
				});
			} else {
				// Create new artist row if artist is not in database
				var Artist = Parse.Object.extend("artists");
				var artist = new Artist();
				artist.set("words", body.allWords.length);
				artist.set("artist", artistName);
				artist.save(null, {
					success: function(results) {
						// Go through all word -> nextword combinations, and on last one submit response to be successful.
						var allWords = []; 
						for (var i = 0; i < body.allWords.length; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								if (i === body.allWords.length - 1 && j === body.allWords[i].nextWords.length - 1) {
									allWords.push(createWord(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, 
										body.allWords[i].nextWords[j].nextSyllable, body.allWords[i].currentSyllable));
									Parse.Object.saveAll(allWords, {
										success: function(list) {
											response.success(true);
										}, 
										error: function(error) {
											response.error(error.message);
										}
									});
								} else {
									allWords.push(createWord(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, 
										body.allWords[i].nextWords[j].nextSyllable, body.allWords[i].currentSyllable));
								}
							}
						}
					},
					error: function(error) {
						console.log(error);
					}
				});
			}
			
		},
		error: function(error) {
			response.error(error.message);
		}
	});	
});
