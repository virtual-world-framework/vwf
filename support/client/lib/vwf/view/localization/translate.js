function translateMenu(){

var toTranslateElements = document.getElementsByTagName("a");

for (var i=0; i<toTranslateElements.length; i++){
	if (toTranslateElements[i].firstChild != null) {
		if (toTranslateElements[i].firstChild.nodeType == 3) {
			toTranslateElements[i].firstChild.nodeValue = toTranslateElements[i].firstChild.nodeValue.toLocaleString();
			}
		}
	}
}


