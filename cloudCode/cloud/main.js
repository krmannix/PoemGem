/**************************
*
*	DB Jobs
*
***************************/


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
		if (cleanWord !== word.get("word").trim() || cleanNextWord !== word.get("nextword").trim()) {
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

/**************************
*
*	In-house methods
*
***************************/

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

function getSeedWord() {
	var promise = new Parse.Promise();
	var query = new Parse.Query("rapWord1D");
	query.count({
		success: function(count) {
			var rand = Math.random();
			if (count > 10000) count = 10000;
			var randomIndex = Math.floor(rand*count);
			query.skip(randomIndex);
			query.notEqualTo("word", "and");
			query.first({
				success: function(row) { // We now have randomly grabbed a row from the database
					// Parse promise returns
					if (typeof row === "undefined")
						getSeedWord.then(function(word) {promise.resolve(word)}); // In case there is an error fetching row, do it again
					console.log("And seed word is: " + row.get("word"));
					promise.resolve(row.get("word"));
				},
				error: function(error) {
					promise.reject(error);
				}
			});
		}, 
		error: function(error) {
			promise.reject(error);
		}
	});
	return promise;
}

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

function checkForBadEndingWords(word, sentence, numWordsInSentence) {
	if (!(sentence.split(" ").length === numWordsInSentence - 2)) return false;
	var badWords = ["and", "i'm", "your", "you're", "I", "who", "the", "she", "he", "about"];
	for (badWord in badWords) {
		if (badWords[badWord] === word) return true; 
	}
	return false;
}

function getGoodEndingWord(words) {

}

function chooseNextWord(word, sentence, numWordsInSentence, notEqualToWord) {
	console.log("Current word is: " + word + " ... and the sentence is " + sentence);
	var promise = new Parse.Promise();
	var query = new Parse.Query("rapWord1D");
	query.equalTo("word", word);
	console.log("What is notEqualToWord " + notEqualToWord);
	if (notEqualToWord) {
		console.log("Blocking words: " + notEqualToWord.length + notEqualToWord + " " + typeof notEqualToWord);
		for (notWord in notEqualToWord) {
			query.notEqualTo("nextword", notEqualToWord[notWord]);
		}	
	} else {
		var notEqual = [];
	}
	query.find({
		success: function(results) {
			var total = 0;
			var words = [];
			if (results.length === 0) {
				if (notEqualToWord) {
					promise.resolve(sentence);
				} else {
					var splitSentence = sentence.split(" ");
					if (splitSentence.length < 1) { // In case this occurs with our seed word
						//console.log("Starting word search 1: " + seedWord);
						getSeedWord().then(function(seedWord) {
							chooseNextWord(seedWord, String(seedWord), numWordsInSentence).then(function(newSentence) {
								promise.resolve(newSentence);
							}, function(error) {
								promise.reject("When we had this setence:  ! there was an error: " + error);
							});
						}, function(error) {
							promise.reject("Error when getting seed word for the second time: " + error);
						});
					} else {
						//console.log("Starting word search 2: " + sentence);
						splitSentence.pop(); // Remove word that returned no results. Don't want it in sentence
						notEqual.push(word);
						chooseNextWord(splitSentence.pop(), sentence.replace(word, "").trim(), numWordsInSentence, notEqual).then(function(newSentence) {
							promise.resolve(newSentence);
						}, function(error) {
							promise.reject("When we had this setence (in notEqualToWord): ! there was an error: " + error.message);
						});
					}
				}
			} else { 
				// We have some results to work with - let's go and find the next word.
				for (var i = 0; i < results.length; i++) {
					if (!checkForBadEndingWords(results[i].get("word").trim(), sentence, numWordsInSentence)) {
						words.push({
							"word":results[i].get("nextword").trim(),
							"count":Number(results[i].get("count"))
						});
						total += results[i].get("count");
					}
				}
				var randNum = Math.floor(Math.random()*total);
				var nextWord, cumSum = 0;
				for (var j = 0; j < words.length; j++) {
					cumSum += words[j].count;
					if (randNum < cumSum) {
						nextWord = words[j].word;
						break;
					}
				}
				// Stop looking for words if we've reached the correct number
				if (sentence.split(" ").length === (numWordsInSentence - 1)) 
					promise.resolve(sentence + " " + nextWord + "."); // Return parse promise
				else { // Otherwise, contineu look for words, and when we chain the promises together
					//console.log("Starting word search 3: " + sentence);
					chooseNextWord(nextWord, sentence + " " + nextWord, numWordsInSentence).then(function(newSentence) {
						promise.resolve(newSentence);
					}, function(error) {
						promise.reject(" ! there was an error: " + error.message);
					});
				}
			}
		}, 
		error: function(error) {
			console.log("Parse Error finding word! " + error.message);
			promise.reject(error);
		}
	});
	return promise;
}

/**************************
*
*	Cloud function calls
*
***************************/

Parse.Cloud.define("getSentence", function(request, response) {
	console.log("Getting sentence");
	var numWords = request.params.numWords;
	if (typeof numWords === "undefined") response.error("Didn't tell how many words");
	var returnedSentence = "";
	getSeedWord().then(function(seedWord) {
		chooseNextWord(seedWord, String(seedWord), 7).then(function(sentence) {
			if (sentence === null || sentence === "") response.error("Error while creating sentence");
			response.success(sentence.charAt(0).toUpperCase() + sentence.slice(1)); // Capitalize first letter
		}, function(error) {
			response.error("Error in chooseNextWord() !: " + error.message + " " + error);
		});
	}, function(error) {
		response.error("Error in getSeedWord() !: " + error.message + " " + error);
	});
});

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
