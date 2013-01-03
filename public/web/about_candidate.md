Use the Virtual World Framework (VWF) to create apps that are:

- **3D**
- **Collaborative**
- **Web-based**

... and create them **fast**.

<script>
  this.createAppUrl = function() {
	var sessionId = "";
	var chars = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' ];
  	for ( var i = 0; i < 16; i++ )
  		sessionId += chars[ Math.floor( Math.random() * 16 ) ];
  	return "../duck/" + sessionId;
  };

  this.Url = this.createAppUrl();

  this.createIframes = function() {
    document.write( "<p>Imagine that you are in New York...</p>" );
  	document.write( "<iframe height='455' width='455' src='" + this.Url + "'></iframe>" );
    document.write( "<p>...and you're working with someone in San Francisco.</p>" );
    document.write( "<p>(Click the duck to see them spin in synchrony)</p>" );
  	document.write( "<iframe height='455' width='455' src='" + this.Url + "'></iframe>" );
  }();
</script>