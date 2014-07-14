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

function addContentToDB(currentword, nextword, count, response) {
	var Word = Parse.Object.extend("rapWord1D"); // In future, have reqest with this value
	var query = new Parse.Query("rapWord1D");
	query.equalTo("word", currentword);
	query.equalTo("nextword", nextword);
	var wordInDB;
	console.log("Current Word: " + currentword + " next word: " + nextword);
	query.find({
		success: function(results) {
			if (results.length > 0) {
				wordInDB = results[0];
				wordInDB.set("count", wordInDB.get("count") + count);
				// Need to update object
			} else {
				wordInDB = new Word();
				wordInDB.set("word", currentword);
				wordInDB.set("nextword", nextword);
				wordInDB.set("count", count);
			}
			wordInDB.save(null, {
				success: function() {
					console.log("This object got saved: " + currentword + " with " + nextword);
					if (response != null) {
						console.log("Last item, say response is success");
						response.success("Uploaded all programs.");
					}
				},
				error: function() {
					console.log("Theres an error.");
					if (response != null) {
						console.log("Should tell response there's an error");
						response.error("Uh-oh. Look into this.");
					}
				}
			});
		},
		error: function(error) {
			console.log(error.message);
		}
	});
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
					success: function() {
						// Go through all word -> nextword combinations, and on last one submit response to be successful. 
						for (var i = 0; i < body.allWords.length; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								if (i === body.allWords.length - 1 && j === body.allWords[i].nextWords.length - 1) {
									addContentToDB(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, response);
								} else {
									addContentToDB(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, null);
								}
							}
						}
					},
					error: function() {
					}
				});
			} else {
				// Create new artist row if artist is not in database
				var Artist = Parse.Object.extend("artists");
				var artist = new Artist();
				artist.set("words", body.allWords.length);
				artist.set("artist", artistName);
				artist.save(null, {
					success: function() {
						// Go through all word -> nextword combinations, and on last one submit response to be successful. 
						for (var i = 0; i < body.allWords.length; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								if (i === body.allWords.length - 1 && j === body.allWords[i].nextWords.length - 1) {
									addContentToDB(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, response);
								} else {
									addContentToDB(body.allWords[i].currentWord, 
										body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count, null);
								}
							}
						}
					},
					error: function() {
					}
				});
			}
			
		},
		error: function(error) {
			response.error(error.message);
		}
	});	
});
