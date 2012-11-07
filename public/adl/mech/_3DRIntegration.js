function StringBuffer()
{ 
    this.buffer = []; 
} 

StringBuffer.prototype.append = function append(string)
{ 
    this.buffer.push(string); 
    return this; 
}; 

StringBuffer.prototype.toString = function toString()
{ 
    return this.buffer.join(""); 
}; 

var Base64 =
{
    codex : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    encode : function (input)
    {
        var output = new StringBuffer();

        var enumerator = new Utf8EncodeEnumerator(input);
        while (enumerator.moveNext())
        {
            var chr1 = enumerator.current;

            enumerator.moveNext();
            var chr2 = enumerator.current;

            enumerator.moveNext();
            var chr3 = enumerator.current;

            var enc1 = chr1 >> 2;
            var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            var enc4 = chr3 & 63;

            if (isNaN(chr2))
            {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3))
            {
                enc4 = 64;
            }

            output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
        }

        return output.toString();
    },

    decode : function (input)
    {
        var output = new StringBuffer();

        var enumerator = new Base64DecodeEnumerator(input);
        while (enumerator.moveNext())
        {
            var charCode = enumerator.current;

            if (charCode < 128)
                output.append(String.fromCharCode(charCode));
            else if ((charCode > 191) && (charCode < 224))
            {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
            }
            else
            {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                enumerator.moveNext();
                var charCode3 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
            }
        }

        return output.toString();
    }
}


function Utf8EncodeEnumerator(input)
{
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Utf8EncodeEnumerator.prototype =
{
    current: Number.NaN,

    moveNext: function()
    {
        if (this._buffer.length > 0)
        {
            this.current = this._buffer.shift();
            return true;
        }
        else if (this._index >= (this._input.length - 1))
        {
            this.current = Number.NaN;
            return false;
        }
        else
        {
            var charCode = this._input.charCodeAt(++this._index);

            // "\r\n" -> "\n"
            //
            if ((charCode == 13) && (this._input.charCodeAt(this._index + 1) == 10))
            {
                charCode = 10;
                this._index += 2;
            }

            if (charCode < 128)
            {
                this.current = charCode;
            }
            else if ((charCode > 127) && (charCode < 2048))
            {
                this.current = (charCode >> 6) | 192;
                this._buffer.push((charCode & 63) | 128);
            }
            else
            {
                this.current = (charCode >> 12) | 224;
                this._buffer.push(((charCode >> 6) & 63) | 128);
                this._buffer.push((charCode & 63) | 128);
            }

            return true;
        }
    }
}

function Base64DecodeEnumerator(input)
{
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Base64DecodeEnumerator.prototype =
{
    current: 64,

    moveNext: function()
    {
        if (this._buffer.length > 0)
        {
            this.current = this._buffer.shift();
            return true;
        }
        else if (this._index >= (this._input.length - 1))
        {
            this.current = 64;
            return false;
        }
        else
        {
            var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));

            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;

            this.current = chr1;

            if (enc3 != 64)
                this._buffer.push(chr2);

            if (enc4 != 64)
                this._buffer.push(chr3);

            return true;
        }
    }
};

function _3DRIntegration()
{
	$(document.body).append("<div id='ModelLibrary'></div>");
	$(document.body).append("<div id='ModelDetails'></div>");
	$('#ModelLibrary').append("<div id='ModelSearchResults'></div>");
	$('#ModelLibrary').append("<div id='ModelSearchPanel'></div>");
	$('#ModelSearchPanel').append("<input type='text' id='ModelSearchTerm' style='border-radius: 5px;'></div>");
	$('#ModelSearchPanel').css('overflow','auto');
	$('#ModelSearchPanel').append("<div id='ModelSearchButton'></div>");
	$('#ModelSearchPanel').append("<div id='ResultsPages' style='display: inline;'></div>");
	$('#ModelSearchButton').button({label:'Search'});
	
	$('#ModelLibrary').dialog({title:'Search 3DR',autoOpen:false,maxHeight:400,maxWidth:750,width:750,height:'auto',resizable:false,position:'center',modal:true,movable:true});
	$('#ModelDetails').dialog({title:'Search 3DR',autoOpen:false,maxHeight:400,maxWidth:400,width:400,height:'400',resizable:false,position:'center',modal:true,movable:false,buttons:{
	Close:function(){$('#ModelDetails').dialog('close');},
	Create:function(){
		$('#ModelDetails').dialog('close');
		$('#ModelLibrary').dialog('close');
		_ModelLibrary.insertObject(_ModelLibrary.DetailsPID);
	}
	
	
	
	}});
	
	this.currentPage = 0;
	this.pageLength = 42;
	this.Results = [];
	this.MetadataCache = [];
	
	this.show = function()
	{
		$('#ModelLibrary').dialog('open');
	}
	this.isOpen = function()
	{
		return $("#ModelLibrary").dialog( "isOpen" );
	}
	this.hide = function()
	{
		$('#ModelLibrary').dialog('close');
		
	}
	this.Get3DRUsername = function()
	{
	    var ret  = jQuery('#username').val();
		if(!ret || ret == "")
			ret = "AnonymousUser";
		return ret;
	}
	this.Get3DRPassword = function()
	{
		var ret  = jQuery('#password').val();
		if(!ret || ret == "")
			ret = "";
		return ret;
	}
	this.Get3DREndpoint = function()
	{
		var ret  = jQuery('#endpoint').val();
		if(!ret || ret == "")
			ret = "http://3dr.adlnet.gov/Federation/3dr_Federation.svc/";
		
		if(_ModelLibrary.Get3DRUsername() != "AnonymousUser")
			ret = ret.replace("http://", "http://" +encodeURIComponent(_ModelLibrary.Get3DRUsername())+":"+encodeURIComponent(_ModelLibrary.Get3DRPassword())+"@");
		return ret;
	}
	this.BuildModelRequest = function(pid)
	{
		if(_ModelLibrary.Get3DREndpoint().indexOf('3dr_Federation') == -1)
		  return _ModelLibrary.Get3DREndpoint()+"/"+pid+"/Model/json/uncompressed?ID=00-00-00";
		else
		  return _ModelLibrary.Get3DREndpoint()+"/"+pid+"/Model/NoRedirect/json/uncompressed?ID=00-00-00";
	}
	this.insertObject = function(pid)
	{
		var pos = [0,0,0];
		
		if(_Editor)
		{
		var campos = [_Editor.findscene().camera.getLocX(),_Editor.findscene().camera.getLocY(),_Editor.findscene().camera.getLocZ()];
		var ray = _Editor.GetCameraCenterRay();
		var dxy = _Editor.intersectLinePlane(ray,campos,[0,0,0],_Editor.WorldZ);
		var newintersectxy = GLGE.addVec3(campos,GLGE.scaleVec3(ray,dxy*.99));
		pos = newintersectxy;
		}

		var proto  = { 
                    extends: 'http://vwf.example.com/node3.vwf',
                    source: _ModelLibrary.BuildModelRequest(pid),
                    type: 'model/vnd.osgjs+json+compressed',
					
					properties:{
					  rotation: [ 1, 0, 0, 0 ],
					  translation: pos,
					  scale: [_ModelLibrary.MetadataCache[pid].UnitScale,_ModelLibrary.MetadataCache[pid].UnitScale,_ModelLibrary.MetadataCache[pid].UnitScale],
					  owner:document.PlayerNumber
					  }
                    };
		//vwf_view.kernel.createNode(proto , null);
		//vwf_view.kernel.createChild('index-vwf',GUID(),proto,null,null); 
		vwf_view.kernel.createChild('index-vwf',_ModelLibrary.MetadataCache[pid].Title,proto,null,null);
		
	}
	this.BuildResult = function(obj,i)
	{
		var result = "<div style='list-style-type:none;border-style:solid;border-color:#999999;border-width:1px;vertical-align: top;overflow:hidden;border-radius:5px 5px 5px 5px;margin: 1px 1px 1px 1px;width:100px;height:100px;display:inline-block'>";
		result += "<div style='text-align:center'>";
		result += "<img style='box-shadow:2px 2px 10px gray;width:50px;margin: 5px 5px 0px 5px;' id='Thumb"+i+"' src='"+_ModelLibrary.Get3DREndpoint() + obj.PID + "/Thumbnail?ID=00-00-00' />";
		result += "<p id='Title"+i+"' style='text-decoration:underline;cursor:pointer;text-overflow: ellipsis;overflow: hidden;margin: 3px;'>" + obj.Title +"</p>";
		result += "</div>";
		result += "</div>";
		return result;
	}
	this.DisplayMetadata = function(obj,i)
	{
		var ret = "";
		ret += "<div style='text-align: center;'><img style='box-shadow:2px 2px 10px gray;width:150px;margin: 5px 5px 0px 5px;' src='"+_ModelLibrary.Get3DREndpoint() + _ModelLibrary.DetailsPID + "/Thumbnail?ID=00-00-00' />";
		ret += "<p style='text-decoration:underline;text-overflow: ellipsis;overflow: hidden;margin: 3px;'>" + obj.Title +"</p></div>";
		ret += "<p> Keywords:" + obj.Keywords +"</p>";
		ret += "<p> Artist:" + obj.ArtistName +"</p>";
		ret += "<p> Description:" + obj.Description +"</p>";
		ret += "<p> Polygons:" + obj.NumPolygons +"</p>";
		ret += "<p> Conversion:" + obj.ConversionAvailable +"</p>";
		ret += "<p> Anonymous Download:" + obj.AnonymousDownloadAvailable +"</p>";
		
		jQuery('#ModelDetails').html(ret);
		$('#ModelDetails').dialog('option', 'position', 'center');
						
	}
	this.showDetails = function(pid)
	{
		this.DetailsPID = pid;
		$('#ModelDetails').dialog('open');
		
		if(_ModelLibrary.MetadataCache[pid])
		{
			_ModelLibrary.DisplayMetadata(_ModelLibrary.MetadataCache[pid]);
			
		}else
		{
			$.ajax({
				type: "GET",
				url: _ModelLibrary.Get3DREndpoint()+"/"+pid+"/Metadata/jsonp?ID=00-00-00&callback=?",
				dataType: "jsonp",
				success: function (object, responseStatus, request) {
						
						var metadata = object;
						jQuery('#ModelDetails').css('text-align','left');
						_ModelLibrary.DisplayMetadata(object);
						_ModelLibrary.MetadataCache[_ModelLibrary.DetailsPID] = object;
					}.bind(this),
					error: function (xhr, ajaxOptions, thrownError) {
						alert(thrownError);
					}
			});
		}
	}
	this.showResults = function(page)
	{
		jQuery('#ModelSearchResults').html("");
		
		for(var i = 0; i < this.Results.length/this.pageLength;i++)
		{
			if(i == page)
			{
				jQuery('#resultspage'+i).css('color','black');
				jQuery('#resultspage'+i).css('text-decoration','none');
				
			}
			else
			{
				jQuery('#resultspage'+i).css('color','blue');
				jQuery('#resultspage'+i).css('text-decoration','underline');
			}
		}
		this.currentPage = page;
		this.pageLength = 42;
		
		for(var i=this.currentPage * this.pageLength; i<Math.min(this.currentPage * this.pageLength + this.pageLength,_ModelLibrary.Results.length); i++)
		{
			
			jQuery('#ModelSearchResults').append(_ModelLibrary.BuildResult(_ModelLibrary.Results[i],i));
			
			//jQuery("#Thumb"+i).click(insertObject.bind(_ModelLibrary.Results[i]));
			var j = i;
			jQuery("#Title"+i).attr('pid',_ModelLibrary.Results[i].PID);
			jQuery("#Title"+i).click(function(){
				
				
				var pid = $(this).attr('pid');
				_ModelLibrary.showDetails(pid);
			});
			jQuery("#Metadata"+i).hide();
		}
	}
	this.SetResults = function(o)
	{
		
		jQuery('#ResultsPages').html("");				
		this.Results = o;
		this.showResults(0);
	
		for(var i = 0; i < this.Results.length/this.pageLength;i++)
		{
			jQuery('#ResultsPages').append("<div id='resultspage"+i+"' style='display: inline;cursor: pointer;padding: 5px;color: blue;text-decoration: underline;'>"+i+"</div>");
			jQuery('#resultspage'+i).attr('pagenum',i);
			jQuery('#resultspage'+i).click(function(){
				_ModelLibrary.showResults($(this).attr('pagenum'));
			});
		}
	
	}
	this.Search3DR = function(e)
	{

		var searchterms = jQuery('#ModelSearchTerm').val();
		var base64 = Base64.encode(_ModelLibrary.Get3DRUsername() + ":" + _ModelLibrary.Get3DRPassword());
		jQuery.ajaxSetup({beforeSend:function(xhr,settings){
			xhr.setRequestHeader("Authorization", "Basic " + base64);
			//alert("Auth is " + base64);
		}});
		 $.ajax({
                type: "GET",
				
                url: _ModelLibrary.Get3DREndpoint()+"/Search/" + searchterms + "/jsonp?ID=00-00-00&callback=?",
                dataType: "jsonp",
                success: function (object, responseStatus, request) {
						
						jQuery('#ModelSearchResults').html("");
						jQuery('#ResultsPages').html("");
						_Notifier.stopWait();
						_ModelLibrary.SetResults(object);
						$('#ModelLibrary').dialog('option', 'position', 'center');
						
					},
					error: function (xhr, ajaxOptions, thrownError) {
						alert(thrownError);
						_Notifier.stopWait();
					}
            });
		_Notifier.startWait('Searching...');
	}
	$('#ModelSearchButton').click(function(){_ModelLibrary.Search3DR()});
}
_ModelLibrary = new _3DRIntegration();