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
		
		//console.log(filter);
		self.filter(filter || userNameFilter);
		if(self.filter() && self.displayWorldObjects().length > 0){
			self.initialSearchDisplay(false);
		}
		pageIndex = 0;
		showStates();
	};			
	self.filter = ko.observable(filter);
	self.initialSearchDisplay = ko.observable(true);
	self.filterVal = ko.computed({
		read:  function(){ return filter; }, 
		write: function(str){ 
			if(filter != str){
				filter = str;
				self.filter(filter || userNameFilter);
				
				pageIndex = 0;
				var tempWorlds = self.worldObjects();
				for(var i = 0; i < tempWorlds.length; i++){
					tempWorlds[i]().isVisible = checkFilter([tempWorlds[i]().title, tempWorlds[i]().description, tempWorlds[i]().owner], tempWorlds[i]().featured);
				}
				
				self.getPage(0);
				
				$(".filter").val(filter);
				if(self.filter() && self.displayWorldObjects().length > 0){
					self.initialSearchDisplay(false);
				}
				//console.log(filter);
			}
		}	
	}).extend({throttle:500});
	
	self.returnVal = (root + '/' + window.location.search.substr(window.location.search.indexOf('=')+1)).replace('//', '/') + window.location.hash;
	self.worldObjects = ko.observableArray([]);
	self.displayWorldObjects = ko.observableArray([]);
	self.adminDisplayList = ko.observableArray();
	self.currentAdminItem = ko.observable(false); 
	self.errorText = ko.observable('');
	self.alignWorldsList = function(i, f){
		var temp = self.displayWorldObjects()[i];
		var prevTemp = self.displayWorldObjects()[i-1];
		if(i%4 != 0 && !self.usersPage && temp && !temp().featured && (prevTemp().featured || (!prevTemp().featured && prevTemp().marginFix))){
			temp().marginFix = true;
			return {'margin':'37px 0 53px 0'};
		}
		
		else if(temp().marginFix){
			delete temp().marginFix;
		}
		
		return {'margin':''};
	};
	
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
		self.worldObjects.sort(sortArrByUpdates);
		var worldObjectsLength = getArrVisibleLength(self.worldObjects());
		pageIndex += i;
		
		var tmpArray = getArrVisible(self.worldObjects(), pageIndex*pageLength);
		var displayIdArr = [], tmpIdArr = [], resultsArr = [], resultsArr2 = [], maxVal = Math.max(self.displayWorldObjects().length, tmpArray.length);
		
		for(var g = 0; g < maxVal; g++){
			if(g < self.displayWorldObjects().length)
				displayIdArr.push(self.displayWorldObjects()[g]().id);
			if(g < tmpArray.length)
				tmpIdArr.push(tmpArray[g]().id);
		}		
		
		resultsArr = getWorldArrMap(tmpArray, displayIdArr);
		resultsArr2 = getWorldArrMap(self.displayWorldObjects(), tmpIdArr);

		for(var j = resultsArr2.length; j >= 0; j--){
			if(resultsArr2[j] == -1){
				self.displayWorldObjects.splice(j, 1);
			}
		}

		for(var g = 0; g < resultsArr.length; g++){
			if(resultsArr[g] == -1){
				self.displayWorldObjects.push(tmpArray[g]);
			}
		}
		
		self.displayWorldObjects.sort(sortArrByUpdates);
		//self.alignWorldsList.valueHasMutated();
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
		$('.checkboxes, .worldCheckboxes').prop('checked', !selectAll);
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

function objCompare(obj1, obj2, ignoreKeyLength){

	if(! (obj1 && obj2))
		return false;
	
	var keys1 = Object.keys(obj1);
	var keys2 = Object.keys(obj2);
	var saveKey2 = 0;
	
	if(keys1.length == keys2.length || ignoreKeyLength === true){
	
		for(var k in keys1){
			saveKey2 = keys2.indexOf(keys1[k]);
			
			if(ignoreKeyLength === true && keys2.length == k)
				return true;
			
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
	vwfPortalModel.setSelectAll(false);
	$('.checkboxes, worldCheckboxes, .checkAllBox').prop('checked', false);
	
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

function checkFilter(textArr, isFeatured){
	
	//textArr[2] is the owner of the world
	if(userNameFilter && userNameFilter != textArr[2]){
		return false;
	}
	
	if(filter != ""){
		var filterArr = filter.split(" "), textStr = textArr.join().toLowerCase(), spaceFix = false;
		for(var i = 0; i < filterArr.length; i++){
			if(textStr.indexOf(filterArr[i].toLowerCase()) == -1){
				return false;
			}
			
			if(!spaceFix && filterArr[i] != ""){
				spaceFix = true;
			}
		}

		return spaceFix;
	}			
	
	else return (!!isFeatured && !userNameFilter) || userNameFilter == textArr[2];
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
	var tempArr = [], count = 0, g = 0;
	for(var i = 0; i < arr.length && count < pageLength; i++){
	
		if(arr[i]().isVisible == true){
			
			if(g >= start){
				tempArr.push(arr[i]);
				count++;
			}
			
			else g++;
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

		var tempArr = getFlatIdArr(), saveIndex = 0, i = 0, flatWorldArray = ko.toJS(vwfPortalModel.worldObjects), saveDate = Date.now() - 31536000000;
		for(var tmpKey in e){
			
			if(e.hasOwnProperty(tmpKey)){
				
				var id = tmpKey.substr(13,16);
				e[tmpKey].id = id;

				//The incoming data elements may not be in the same order as existing elements, get proper index
				saveIndex = tempArr.indexOf(id) > -1 ? tempArr.indexOf(id) : i++;

				e[tmpKey].updates = e[tmpKey].lastUpdate && !isNaN(Date.parse(e[tmpKey].lastUpdate)) ? Date.parse(e[tmpKey].lastUpdate) : saveDate;
				e[tmpKey].lastUpdate = e[tmpKey].lastUpdate && !isNaN(Date.parse(e[tmpKey].lastUpdate))?removeAgoFromMoment(e[tmpKey].lastUpdate):removeAgoFromMoment(new Date(saveDate));
				e[tmpKey].description = e[tmpKey].description ? e[tmpKey].description : "";
				
				e[tmpKey].editVisible = ko.observable(false);				
				e[tmpKey].isVisible = checkFilter([e[tmpKey].title, e[tmpKey].description, e[tmpKey].owner], e[tmpKey].featured);
				
				if(ko.isObservable(vwfPortalModel.worldObjects()[saveIndex])){
				
					e[tmpKey].hotState = flatWorldArray[saveIndex].hotState ? flatWorldArray[saveIndex].hotState : false;
					
					for(var saveProp in e[tmpKey]){
						
						if(saveProp != "editVisible" &&  e[tmpKey][saveProp] != flatWorldArray[saveIndex][saveProp]){
							vwfPortalModel.worldObjects()[saveIndex](e[tmpKey]);
							break;
						}
					}
				}
				
				else{
					e[tmpKey].hotState = false;
					vwfPortalModel.worldObjects()[saveIndex] = ko.observable(e[tmpKey]);
				}
			}
		}
		
		vwfPortalModel.getPage(0);
		
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
	if(a().featured == true && !b().featured)
		return -1;			
		
	else if(b().featured == true && !a().featured)
		return 1;		
	
	else if(a().hotState == true && !b().hotState)
		return -1;			
	
	else if(b().hotState == true && !a().hotState)
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