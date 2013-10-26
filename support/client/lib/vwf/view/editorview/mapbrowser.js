function getProperties(obj)
{
	var i, v;
	var count = 0;
	var props = [];
	if (typeof (obj) === 'object')
	{
		for (i in obj)
		{
			v = obj[i];
			if (v !== undefined && typeof (v) !== 'function')
			{
				props[count] = i;
				count++;
			}
		}
	}
	return props;
};
define(function ()
{
	var MapBrowser = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(MapBrowser);
				isInitialized = true;
			}
			return MapBrowser;
		}
	}

	function initialize()
	{
		var self = this;
		$(document.body).append("<div id='MapBrowser' />");
		//$(document.body).append("<div id='AddMap'> <input type='text' id='newmapurl' /> </div>");
		$('#MapBrowser').dialog(
		{
			title: 'Map Browser',
			autoOpen: false,
			modal: true,
			maxHeight: 600,
			height: 600
		});
		// $('#AddMap').dialog({title:'Add Map',autoOpen:false,modal:true, buttons:{
		// 'Ok':function()
		// {
		// _TextureList.push({texture:$('#newmapurl').val(),thumb:$('#newmapurl').val()});
		// $('#AddMap').dialog('close');
		// },
		// 'Cancel':function(){
		// $('#AddMap').dialog('close');
		// }
		// }});
		//$(document.head).append('<script type="text/javascript" src="textures/textureLibrary.js"></script>');
		this.setTexturePickedCallback = function (e)
		{
			this.texturePickedCallback = e;
		}
		this.texturePicked = function ()
		{
			var texture = $(this).attr('texture');
			if (_MapBrowser.texturePickedCallback)
			{
				_MapBrowser.texturePickedCallback(texture);
			}
			else
			{
				_MaterialEditor.setActiveTextureSrc(texture);
			}
		}
		this.GetTextures = function ()
		{
			var data = jQuery.ajax(
			{
				type: 'GET',
				url: PersistanceServer + '/vwfDataManager.svc/textures',
				data: null,
				success: null,
				async: false,
				dataType: "json"
			});
			var stringdata = JSON.parse(data.responseText).GetTexturesResult;
			stringdata = stringdata.replace(/\\"/g, "\"")
			stringdata = stringdata.replace(/\\/g, "\\\\")
			data = JSON.parse(stringdata);
			return data;
		}
		this.dirpicked = function ()
		{
			var dir = $(this).attr('dir');
			_MapBrowser.filter.push(dir);
			_MapBrowser.BuildGUI();
		}
		this.dirup = function ()
		{
			_MapBrowser.filter.pop();
			_MapBrowser.BuildGUI();
		}
		this.BuildGUI = function ()
		{
			$('#MapBrowser').empty();
			var _TextureList = this.GetTextures().root;
			for (var i = 0; i < this.filter.length; i++)
			{
				_TextureList = _TextureList[this.filter[i]][getProperties(_TextureList[this.filter[i]])[0]];
			}
			if (_MapBrowser.filter.length > 0)
			{
				$('#MapBrowser').append('<img id="UpButton" class="textureChoice" />');
				$('#UpButton').attr('src', '../vwf/view/editorview/images/icons/up_folder.gif');
				$('#UpButton').click(this.dirup);
			}
			for (var i = 0; i < _TextureList.length; i++)
			{
				if (typeof _TextureList[i] == 'string')
				{
					$('#MapBrowser').append('<img id="MapChoice' + i + '" class="textureChoice" />');
					$('#MapChoice' + i).attr('src', PersistanceServer + '/vwfDataManager.svc/texturethumbnail?UID=' + _TextureList[i]);
					$('#MapChoice' + i).attr('texture', PersistanceServer + '/vwfDataManager.svc/texture?UID=' + _TextureList[i]);
					$('#MapChoice' + i).click(this.texturePicked);
				}
				else
				{
					var name = getProperties(_TextureList[i])[0];
					name = name.substr(name.lastIndexOf('\\') + 1);
					$('#MapBrowser').append('<div id="MapChoice' + i + '" class="textureChoice" >' + name + '</div>');
					$('#MapChoice' + i).css('background-image', 'url(../vwf/view/editorview/images/icons/folder.jpg)');
					$('#MapChoice' + i).attr('dir', i);
					$('#MapChoice' + i).click(this.dirpicked);
				}
			}
			$('#MapBrowser').append('<img id="MapChoiceadd" class="textureChoice" src="images/plus.png" />');
			$('#MapChoiceadd').css('background','white');
			$('#MapChoiceadd').click(self.manualEntry);
		}
		//this.addTextureURLClick = function()
		//{
		$('#AddMap').dialog('open');
		//}
		this.show = function ()
		{
			$('#MapBrowser').dialog('open');
			$('#MapBrowser').dialog('option', 'position', 'center');
			this.BuildGUI();
			this.open = true;
		}
		this.hide = function ()
		{
			//if(this.isOpen())
			$('#MapBrowser').dialog('close');
		}
		this.filter = [];
		this.isOpen = function ()
		{
			$("#MapBrowser").dialog("isOpen")
		}
		this.manualEntry = function()
		{
			alertify.prompt('Enter the URL to a texture. The texture must be WebGL compatable and served from a domain that supports CORS',function(ok,val)
			{
				if(ok)
				{
					if (_MapBrowser.texturePickedCallback)
					{
						_MapBrowser.texturePickedCallback(val);
					}
					else
					{
						_MaterialEditor.setActiveTextureSrc(val);
					}
				}
			},"http://");
		}
	}
});