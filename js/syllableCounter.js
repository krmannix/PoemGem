// Structure to returned functions:
//		[word, # of syllables]

/*
1. To find the number of syllables: 
---count the vowels in the word, 
---subtract any silent vowels, (like the silent "e" at the end of a word or the second vowel when two vowels a together in a syllable) 
---subtract one vowel from every diphthong, (diphthongs only count as one vowel sound.) 
---the number of vowels sounds left is the same as the number of syllables. 
The number of syllables that you hear when you pronounce a word is the same as the number of vowels sounds heard. 
	For example: 
		The word "came" has 2 vowels, but the "e" is silent, leaving one vowel sound andone syllable. 
		The word "outside" has 4 vowels, but the "e" is silent and the "ou" is a diphthong which counts as only 
		one sound, so this word has only two vowels sounds and therefore, two syllables. 
*/

// Wrapper function for syllables
var getSyllables = function getSyllables(wordIn) {
	return ingestWord(wordIn);
}


function ingestWord(wordIn) {
	var word = wordIn.toLowerCase();
	var syllables = word.match(/[aeiou]/g).length - countSilentVowels(word) - countDiphthongVowels(word);
	return syllables;
} 

function countSilentVowels(wordIn) {
	var sylSubtract = 0;
	// Silent e at the end
	if (wordIn.slice(-1) === "e") {
		sylSubtract++;
	}
	// Diuble values
	for (var i = 0; i < wordIn.length - 1; i++) {
		if (wordIn.substring(i,i+2).replace(/[aeiou][aeiou]/i, "") === "") {
			sylSubtract++;
		}
	}
	return sylSubtract;
}

function countDiphthongVowels(wordIn) {
	var sylSubtract = 0;
	// List compiled from Wikipedia
	if (/[a][i][r]/.test(wordIn)) sylSubtract++;
	if ((/[u][r][e]/).test)wordIn)) sylSubtract++;
	if (wordIn.test("ewe")) sylSubtract++;
	if (wordIn.test("are")) sylSubtract++;
	if (wordIn.test("ere")) sylSubtract++;
	if (wordIn.test("ear")) sylSubtract++;
	if (wordIn.test("air")) sylSubtract++;
	if (wordIn.test("ore")) sylSubtract++;
	if (wordIn.test("ure")) sylSubtract++;
	return sylSubtract;
}




module.exports.getSyllables = getSyllables;




