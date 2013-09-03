"use strict";

//IE undefined console fix
if (!window.console) console = {log: function() {}};
		
var filter = '', pageIndex = 0, pageLength = 12, userNameFilter = '', selectAll = false;
var vwfPortalModel = new function(){
	var self = this;
	self.getShorterStr = function(a, length){
		if(a == undefined)
			return '';
		
		var obj = {};
		obj.title = a.title ? a.title : a;
		length = length ? length : 55;
		return (obj.title.length>length)? obj.title.substr(0, length - 3) + '...' : obj.title;
	};
	self.user = ko.observable({
		isLoggedIn: false,
		isAdmin: false,
		username: 'Guest'
	});
	
	self.toggleNameFilter = function(){
	
		if(userNameFilter){
			userNameFilter  = '';
			$("#allWorlds").addClass("active");
			$("#yourWorlds").removeClass("active").blur();
		}			
		else{
			userNameFilter  = self.user().username;
			$("#yourWorlds").addClass("active");
			$("#allWorlds").removeClass("active").blur();
		}

		showStates();
	};			
	
	self.filterVal = ko.computed({
		read:  function(){ return ''; }, 
		write: function(str){ 
			if(filter != str){
				filter = str;
				pageIndex = 0;
				showStates(); 
			}
		}	
	}).extend({throttle:500});
	
	self.returnVal = (root + '/' + window.location.search.substr(window.location.search.indexOf('=')+1)).replace('//', '/') + window.location.hash;
	self.worldObjects = ko.observableArray([]);
	self.displayWorldObjects = ko.observableArray([]);
	self.featuredWorldObjects = ko.observableArray([]);
	self.adminDisplayList = ko.observableArray();
	self.currentAdminItem = ko.observable(false); 
	self.getNextPage = function(){
		if(self.nextDisabled() === false)
			self.getPage(1);
	};
	self.getPreviousPage = function(){
		if(self.previousDisabled() === false)
			self.getPage(-1);
	};
	
	self.previousDisabled = ko.observable(true);
	self.nextDisabled = ko.observable(true);
	
	
	self.getPage = function(i){
		var worldObjectsLength = getArrVisibleLength(self.worldObjects());
		pageIndex += i;
		
		var tmpArray = getArrVisible(self.worldObjects(), pageIndex*pageLength);
		var idArr = [], idArr2 = [], maxVal = Math.max(self.displayWorldObjects().length, tmpArray.length);
		
		for(var g = 0; g < maxVal; g++){
			if(g < self.displayWorldObjects().length)
				idArr.push(self.displayWorldObjects()[g]().id);
			if(g < tmpArray.length)
				idArr2.push(tmpArray[g]().id);
		}		

		var resultsArr = getWorldArrMap(tmpArray, idArr);
		var resultsArr2 = getWorldArrMap(self.displayWorldObjects(), idArr2);
		
		for(var j = resultsArr2.length; j >= 0; j--){
			if(resultsArr2[j] == -1){
				self.displayWorldObjects.splice(j);
			}
		}
		
		for(var g = 0; g < resultsArr.length; g++){
			if(resultsArr[g] == -1){
				self.displayWorldObjects.push(tmpArray[g]);
			}
		}				
		
		self.displayWorldObjects.sort(sortArrByUpdates);

		if((pageIndex+1)*pageLength < worldObjectsLength){
			self.nextDisabled(false);
		}
		
		else self.nextDisabled(true);
		
		if(pageIndex > 0){
			self.previousDisabled(false);
		}
		else self.previousDisabled(true);
		
	};
	
	self.handleEditDisplay = function(obj, e){
		if(($(e.relatedTarget).hasClass("editstatedata") ||  $(e.relatedTarget).hasClass("editstatedelete")) && e.type == "mouseout")
			return;
		obj.editVisible(e.type === "mouseover");
	};

	self.handleSelectAll = function(){
		$('.checkboxes').prop('checked', !selectAll);
		selectAll = !selectAll;
		return true;
	};
	
	self.setSelectAll = function(val){
		selectAll = val;
	};
};

function getWorldArrMap(arr1, arr2){
	var tmpArr = [];
	
	for(var i = 0; i < arr1.length; i++){
		tmpArr.push(arr2.indexOf(arr1[i]().id));
	}
	
	return tmpArr;
}

function objCompare(obj1, obj2){

	var keys1 = Object.keys(obj1);
	var keys2 = Object.keys(obj2);
	var saveKey2 = 0;
	
	if(keys1.length == keys2.length){
	
		for(var k in keys1){
			saveKey2 = keys2.indexOf(keys1[k]);
			
			if(saveKey2 == -1)
				return false;
			
			else if(ko.isObservable(obj1[keys1[k]]) && ko.isObservable(obj2[keys2[saveKey2]])){
				if(obj1[keys1[k]]() != obj2[keys2[saveKey2]]()){
					return false;
				}
			}
			
			else if(obj1[keys1[k]] != obj2[keys2[saveKey2]]){
				return false;
			}
		}
		return true;
	}
	
	return false;
}

function handleHash(propStr){

	var tmpHash = window.location.hash.replace("#", "");
	if(tmpHash){
		for(var i in vwfPortalModel.adminDisplayList()){
		
			if(ko.isObservable(vwfPortalModel.adminDisplayList()[i]) && tmpHash == vwfPortalModel.adminDisplayList()[i]()[propStr]){
				vwfPortalModel.currentAdminItem(vwfPortalModel.adminDisplayList()[i]());
				break;
			}
			
			else if(tmpHash == vwfPortalModel.adminDisplayList()[i][propStr]){
				vwfPortalModel.currentAdminItem(vwfPortalModel.adminDisplayList()[i]);
				break;
			}
		}
	}
	
	else vwfPortalModel.currentAdminItem(false);
}

function checkFilter(textArr){
	
	//textArr[2] is the owner of the world
	
	if(userNameFilter && userNameFilter != textArr[2]){
		return false;
	}
	
	if(filter != ""){
		for(var i = 0; i < textArr.length; i++){
			if(textArr[i] && textArr[i].toLowerCase().indexOf(filter.toLowerCase()) != -1)
				return true;
		}
		return false;
	}			
	
	else return true;
}

function getFlatIdArr(resetHotstate){
	var tempArr = [];
	
	//Get all world IDs in flat array form
	for(var i = 0; i < vwfPortalModel.worldObjects().length; i++){
		tempArr.push(vwfPortalModel.worldObjects()[i]().id);
	}
	
	return tempArr;
}

function getArrVisibleLength(arr){
	var count = 0;
	for(var i = 0; i < arr.length; i++){
		if(arr[i]().isVisible == true)
			count++;
	}
	
	return count;
};		
function getArrVisible(arr, start){
	var tempArr = [];
	var count = 0;
	for(var i = start; i < arr.length && count < pageLength; i++){
	
		if(arr[i]().isVisible == true){
			tempArr.push(arr[i]);
			count++;
		}
	}
	
	return tempArr;
};

function removeAgoFromMoment(date){
	var temp = moment(date).fromNow();
	return temp.substr(0, temp.length - 4);
};

function showStates(cb){

	$.getJSON("./vwfDataManager.svc/states",function(e){
		
		var tempArr = getFlatIdArr();
		var saveIndex = 0;
		var featuredIndex = 0;
		var i = 0;
		
		for(var tmpKey in e){
			
			if(e.hasOwnProperty(tmpKey)){
				
				var id = tmpKey.substr(13,16);
				e[tmpKey].id = id;

				//The incoming data elements may not be in the same order as existing elements, get proper index
				saveIndex = tempArr.indexOf(id) > -1 ? tempArr.indexOf(id) : i++;
				
				e[tmpKey].lastUpdate = e[tmpKey].lastUpdate?removeAgoFromMoment(e[tmpKey].lastUpdate):removeAgoFromMoment(new Date());
				e[tmpKey].description = e[tmpKey].description ? e[tmpKey].description : "";
				e[tmpKey].updates = e[tmpKey].updates > 0 ? e[tmpKey].updates : 0;
				e[tmpKey].editVisible = ko.observable(false);
				
				if(e[tmpKey].featured === true && featuredIndex < 3){
					vwfPortalModel.featuredWorldObjects()[featuredIndex] = e[tmpKey];
					featuredIndex++;
				}
				
				e[tmpKey].isVisible = checkFilter([e[tmpKey].title, e[tmpKey].description, e[tmpKey].owner]);
				
				if(ko.isObservable(vwfPortalModel.worldObjects()[saveIndex])){
					e[tmpKey].hotState = vwfPortalModel.worldObjects()[saveIndex]().hotState ? vwfPortalModel.worldObjects()[saveIndex]().hotState : false;
					vwfPortalModel.worldObjects()[saveIndex](e[tmpKey]);
				}
				else{
					e[tmpKey].hotState = false;
					vwfPortalModel.worldObjects()[saveIndex] = ko.observable(e[tmpKey]);
				}
			}
		}
		
		vwfPortalModel.getPage(0);
		vwfPortalModel.featuredWorldObjects.valueHasMutated();
		
		$.getJSON("./admin/instances",function(e){
		
			//Get all world IDs in flat array form
			var tempArr = getFlatIdArr();

			//Iterate through keys, get index of world id which matches key, set its hotState to true
			for(var i = 0; i < tempArr.length; i++){

				if(e.hasOwnProperty("/adl/sandbox/"+tempArr[i]+"/")){
					if(vwfPortalModel.worldObjects()[i]().hotState == false){
						vwfPortalModel.worldObjects()[i]().hotState = true;
						vwfPortalModel.worldObjects()[i].valueHasMutated();
						continue;
					}
					
					vwfPortalModel.worldObjects()[i]().hotState = true;
				}
				
				else{
					if(vwfPortalModel.worldObjects()[i]().hotState == true){
						vwfPortalModel.worldObjects()[i]().hotState = false;
						vwfPortalModel.worldObjects()[i].valueHasMutated();
						continue;
					}
					
					vwfPortalModel.worldObjects()[i]().hotState = false;
				}
			}
			
			vwfPortalModel.getPage(0);
			
			if(cb) cb();
		});
	});
}

function sortArrByUpdates(a, b){
	if(a().hotState == true && b().hotState == false)
		return -1;			
	
	else if(b().hotState == true && a().hotState == false)
		return 1;
		
	else if (b().updates - a().updates == 0){
		return b().id.localeCompare(a().id);
	}
	
	else return b().updates - a().updates;
}

function getLoginInfo(defaultCb, failCb){
	
	$.ajax('/vwfDataManager.svc/logindata',
	{
		cache:false,
		success:function(data,status,xhr){
			
			data = JSON.parse(xhr.responseText);
			vwfPortalModel.user().username = data.username;
			vwfPortalModel.user().isAdmin = data.admin;
			vwfPortalModel.user().isLoggedIn = (data.username)?true:false;
			vwfPortalModel.user.valueHasMutated();
			
			if(defaultCb) defaultCb();
		},
		error:function(){
			if(failCb) failCb();
			else if(defaultCb) defaultCb();
		}
	});
}