
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
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

function addContentToDB(currentword, nextword, count) {
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
				},
				error: function() {
					console.log("Theres an error.");
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
						//response.success("We updated Artist database.");
						for (var i = 0; i < 2; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								addContentToDB(body.allWords[i].currentWord, body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count);
							}
						}
					}, 
					error: function() {
						//response.error(error.message);
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
						for (var i = 0; i < 2; i++) {
							for (var j = 0; j < body.allWords[i].nextWords.length; j++) {
								addContentToDB(body.allWords[i].currentWord, body.allWords[i].nextWords[j].word, body.allWords[i].nextWords[j].count);
							}
						}
						//response.success("We updated Artist database.");
					},
					error: function() {
						//response.error(error.message);
					}
				});
			}
			
		},
		error: function(error) {
			response.error(error.message);
		}
	});
	//for (var i = 0; i < body.allWords.length; i++) {
	
});
