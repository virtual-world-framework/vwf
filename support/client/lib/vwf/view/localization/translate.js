function translateMenu(){


var translateStrings = [
	"MenuLogIn",
	"MenuLogOut",
	"MenuFile",
	"MenuLanguage",
	"MenuEdit",
	"MenuCopy",
	"MenuPaste",
	"MenuDuplicate",
	"MenuDelete",
	"MenuSaveCopy",
	"MenuPublish",
	"MenuShare",
	"MenuSaveNow",
	"MenuSelect",
	"MenuSelectName",
	"MenuSelectPick",
	"MenuSelectNone",
	"MenuSelectScene"
];


for (var i = 0; i < translateStrings.length; i ++)
{

document.getElementById(translateStrings[i]).firstChild.nodeValue = document.getElementById(translateStrings[i]).firstChild.nodeValue.toLocaleString();
}
}


