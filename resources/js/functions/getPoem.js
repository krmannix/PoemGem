try {
	Parse.initialize("xVGwbfMCJHMeWgDDF8F7kjl82tqI7nISHMEkST9p", "dhKnIYqkzvCFC7mZ5qCCLFCqJNDACWE3UXph7tM4");
	Parse.Cloud.run('hello', {}, {
	  success: function(result) {
	    // result is 'Hello world!'
	    document.write(result)
	  },
	  error: function(error) {
	  	document.write(error)
	  }
	});
} catch (err) {
	document.write(err)
}

