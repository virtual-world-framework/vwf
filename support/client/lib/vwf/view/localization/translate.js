function translateMenu(){


var translateStrings = [
	"MenuLogIn",
	"MenuLogOut",
	"MenuFile",
	"MenuLanguage"
];


for (var i = 0; i < translateStrings.length; i ++)
{

document.getElementById(translateStrings[i]).firstChild.nodeValue = document.getElementById(translateStrings[i]).firstChild.nodeValue.toLocaleString();
}

}