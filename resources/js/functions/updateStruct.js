try {
	Parse.initialize("xVGwbfMCJHMeWgDDF8F7kjl82tqI7nISHMEkST9p", "dhKnIYqkzvCFC7mZ5qCCLFCqJNDACWE3UXph7tM4");
	var Struct = Parse.Object.extend("PoemStructs");
	var struct = new Struct();

	struct.set("numSyl", 8)
	struct.set("numLines", 4)
	struct.set("numRhymes", 2)
	struct.set("rhymeScheme", 0.0101)

	struct.save(null, {
		success: function(struct) {
			alert("struct added");
		}, 
		error: function(struct, error) {
			alert("error! " + error.description);
		}
	});
	
} catch (error) {
	document.write("error..." + error)
}