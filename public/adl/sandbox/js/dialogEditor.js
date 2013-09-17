$(document.head).append('<link rel="stylesheet" type="text/css" href="./css/dialogEditor.css" />');

DialogEditor = function()
{
	this.rootSelector = '';
	this.dialogSelector = '';
	this.nodes = [];
};

DialogEditor.prototype.init = function(divID,VWFID)
{
	
	this.vwfID = VWFID;
	var self = this;
	if(!divID)
	{
		divID = GUID().replace(/-/g,"");;
		$(document.body).append('<div id="'+divID+'"/>');
	}
	
	this.rootSelector = '#' + divID;
	$(this.rootSelector).addClass("dialogEditorRoot");
	$(this.rootSelector).attr('tabindex',43);
	this.dialogSelector = '#' + divID + " .dialogEditor";
	this.confirmSelector = this.dialogSelector + " .dialogEditConfirm";
	$(this.rootSelector).append('<div class="dialogModal"/>');
	$(this.rootSelector).append('<div class="dialogEditor"/>');
	
	$(this.dialogSelector).append('<div class="dialogEditConfirm"/>');
	$(this.confirmSelector).text('Ok');
	$(this.confirmSelector).click(function(){self.ok()});
	
	
	$(this.dialogSelector).append('<svg xmlns="http://www.w3.org/2000/svg" version="1.1"></>');
	this.lineSelector = this.rootSelector + " svg";
	
	$(this.dialogSelector).append('<div class="dialogEditCreate"/>');
	this.createSelector = this.dialogSelector + " .dialogEditCreate";
	$(this.createSelector).text('Add');
	$(this.createSelector).click(function(){self.addNode()});
	$(this.rootSelector).css('display','none');
	
	$(this.rootSelector).keyup(function(e)
	{
		
		if(e.keyCode == 46 && e.srcElement == $(this.rootSelector)[0])
			this.delete();
		
	}.bind(this));
}

DialogEditor.prototype.createLine = function()
{
	var line = document.createElementNS("http://www.w3.org/2000/svg","svg:line");
	line.style.stroke = "black";
	line.style.strokeWidth = '3';
	$(this.lineSelector)[0].appendChild(line);
	var self = this;
	line.delete = function()
	{
		$(self.lineSelector)[0].removeChild(this);
	};
	line.set = function(x1,y1,x2,y2)
	{
		this.x1.baseVal.value = x1;
		this.x2.baseVal.value = x2;
		this.y1.baseVal.value = y1;
		this.y2.baseVal.value = y2;
	};
	line.setStart = function(x1,y1)
	{
		this.x1.baseVal.value = x1 - $(this.parentNode).offset().left;
		
		this.y1.baseVal.value = y1 - $(this.parentNode).offset().top;
		
	};
	line.setEnd = function(x2,y2)
	{
		
		this.x2.baseVal.value = x2 - $(this.parentNode).offset().left;
		
		this.y2.baseVal.value = y2 - $(this.parentNode).offset().top;
	};
	line.onclick = function()
	{
		
		self.select(this);
	}
	return line;
}
DialogEditor.prototype.close = function()
{
	$(this.rootSelector).css('display','none');
}
DialogEditor.prototype.open = function()
{
	
	$(this.rootSelector).css('display','block');
	$(this.dialogSelector).children('.dialogNodeRoot').remove();
	this.nodes = [];
	$(this.lineSelector).empty();
	var prompts = vwf.getProperty(this.vwfID,'prompt');
	if(prompts)
	{
		for(var i =0; i < prompts.length; i++)
		{
			var p = prompts[i];
			var node = this.addNode(p.id,p.message);
			node.setPosition(p.editorData);
		}
	}
	
	for(var i =0 ; i < this.nodes.length; i++)
	{
		var node = this.nodes[i];
		var p = prompts[i];
		for( var j=0; j < p.choices.length; j++)
		{
			node.addRow(p.choices[j],p.outputs[j]);
			
			if(p.outputs[j])
			{
			var line = this.createLine();
			var start = $(node.tableSelector + ' .tablerow .tableleft' ).last()[0];
			var end = $('#' + p.outputs[j] + ' .dialogNodeID').last()[0];
			start.node.addOutgoingLink(start,end,line);
			end.node.addIncomingLink(start,end,line);
			}
		}
	}
	window.setTimeout(function()
	{
	$(".tableleft").css('position','relative');
	
	window.setTimeout(function()
	{
	$(".tableleft").css('position','absolute');
	for(var i =0 ; i < this.nodes.length; i++)
	{
		var node = this.nodes[i];
		node.drag();
	}
	
	
	}.bind(this),300);
	
	}.bind(this),300);
	
	$(this.rootSelector).focus();
}
DialogEditor.prototype.ok = function()
{
	
	var data = this.serialize();
	vwf_view.kernel.setProperty(this.vwfID,'prompt',data);
	this.close();
}
DialogEditor.prototype.cancel = function()
{
	this.close();
}
DialogEditor.prototype.addNode = function(id,text)
{
	var node = new DialogNode(this.dialogSelector,this,id,text)
	this.nodes.push(node);
	return node;
}
DialogEditor.prototype.serialize = function()
{
	var nodes = [];
	for(var i in this.nodes)
	{
		nodes.push(this.nodes[i].serialize());
	}
	return nodes;
}

DialogEditor.prototype.deselect = function()
{
	if(this.selectedObject)
	{
		if(this.selectedObject instanceof DialogNode)
		{
			$(this.selectedObject.idSelector).css('background-color','')
		}
		if(this.selectedObject.nodeName ==="svg:line")
		{
			this.selectedObject.style.stroke = 'black';
		}
		this.selectedObject = null;
	}
	
}

DialogEditor.prototype.select = function(obj)
{
	$(this.rootSelector).focus();
	this.deselect();
	this.selectedObject = obj;
	if(this.selectedObject)
	{
		if(this.selectedObject instanceof DialogNode)
		{
			$(this.selectedObject.idSelector).css('background-color','red')
		}
		if(this.selectedObject.nodeName ==="svg:line")
		{
			this.selectedObject.style.stroke = 'red';
		}
		
	}

}

DialogEditor.prototype.delete = function()
{
	if(this.selectedObject)
	{
		if(this.selectedObject instanceof DialogNode)
		{
			this.nodes.splice(this.nodes.indexOf(this.selectedObject),1);
			this.selectedObject.delete();
		}
		if(this.selectedObject.nodeName ==="svg:line")
		{
				this.selectedObject.startNode.removeLine(this.selectedObject);
				this.selectedObject.endNode.removeLine(this.selectedObject);
				this.selectedObject.delete();
		}
		this.selectedObject = null;
	}
}

DialogEditor.prototype.endAssociate = function(target)
{
	this.endAssociateTarget = target;
	
	$(this.endAssociateTarget).css('background','#BBBBBB');
	{
		
		var oldline = this.startAssociateTarget.node.getLineByStart(this.startAssociateTarget);
		if(oldline)
		{
			oldline.startNode.removeLine(oldline);
			oldline.endNode.removeLine(oldline);
			oldline.delete();
		}
		var line = this.createLine();
		this.startAssociateTarget.node.addOutgoingLink(this.startAssociateTarget,this.endAssociateTarget,line);
		this.endAssociateTarget.node.addIncomingLink(this.startAssociateTarget,this.endAssociateTarget,line);
	
	}
	$(this.startAssociateTarget).text($(this.endAssociateTarget).text());
	$(this.startAssociateTarget).css('background','#BBBBBB');
	this.startAssociateTarget = this.endAssociateTarget = null;
}
DialogEditor.prototype.startAssociate = function(target)
{
	this.startAssociateTarget = target;
}
DialogNode = function(parentSelector,parent,id,text)
{
	this.parentSelector = parentSelector;
	this.parent = parent;
	this.id = id || GUID().replace(/-/g,"");
	var self = this;
	$(parentSelector).append('<div class="dialogNodeRoot" id="'+this.id+'"/>' );
	this.selfSelector = '#' + this.id;
	
	
	
	$(this.selfSelector).append('<div class="dialogNodeTable"><div class="dialogNodeID">'+this.id+'</div></div>');
	
	$(this.selfSelector).draggable();
	$(this.selfSelector).on('drag',function()
	{
		this.drag();
	
	}.bind(this));
	$(this.selfSelector).append('<div class="dialogNodeTableAdd"></div>');
	this.addSelector = this.selfSelector +" .dialogNodeTableAdd";
	this.tableSelector = this.selfSelector +" .dialogNodeTable";
	$(this.tableSelector).append('<div class="dialogNodePrompt"><textarea multiline="true" class="dialogNodePromptText"/></div>');
	this.promptSelector = this.tableSelector + " .dialogNodePrompt textarea";
	$(this.promptSelector).val(text);
	this.idSelector = this.selfSelector +" .dialogNodeID";
	$(this.addSelector).text('+');
	$(this.addSelector).click(function(){self.addRow()});
	$(this.idSelector).last()[0].node = self;
	$(this.idSelector).last().click(function()
	{
		this.node = self;
		if(self.parent.startAssociateTarget)
			self.parent.endAssociate(this);
		else
			self.parent.select(this.node);
	});
	$(this.idSelector).last().mouseover(function()
	{
		this.node = self;
		if(self.parent.startAssociateTarget)
			$(this).css('background','red');
	});
	$(this.idSelector).last().mouseout(function()
	{
		this.node = self;
		if(self.parent.startAssociateTarget)
			$(this).css('background','#BBBBBB');
	});
	this.incomingLinks = [];
	this.outgoingLinks = [];
}
DialogNode.prototype.delete = function()
{
	
	for(var i = 0; i < this.outgoingLinks.length; i++)
	{
		this.outgoingLinks[i].line.endNode.removeLine(this.outgoingLinks[i].line);
		this.outgoingLinks[i].line.delete();
	}
	
	for(var i = 0; i < this.incomingLinks.length; i++)
	{
		this.incomingLinks[i].line.startNode.removeLine(this.incomingLinks[i].line);
		this.incomingLinks[i].line.delete();
	}
	
	$(this.selfSelector).remove();
}
DialogNode.prototype.drag = function()
{

		for(var i = 0; i < this.incomingLinks.length; i++)
		{
				var offset = $(this.selfSelector).offset()
				this.incomingLinks[i].line.setEnd(offset.left,offset.top);
		}
		for(var i = 0; i < this.outgoingLinks.length; i++)
		{
				var offset = $(this.outgoingLinks[i].start).offset();
				var width = $(this.outgoingLinks[i].start).width();
				var height = $(this.outgoingLinks[i].start).height();
				this.outgoingLinks[i].line.setStart(offset.left + width,offset.top + height/2);
		}
		
}
DialogNode.prototype.setPosition = function(pos)
{
	if(pos)
	{	
		
		$(this.selfSelector).css('left',pos[0]+'px');
		$(this.selfSelector).css('top',pos[1]+'px');
		$(this.selfSelector).css('position','absolute');
	}
}
DialogNode.prototype.serialize = function()
{	
	var prompt = $(this.promptSelector).val();
	var rowsDivs = $(this.tableSelector + " .tablerow");
	var rowText = [];
	var rowLink = [];
	
	var offset = $(this.selfSelector).offset();
	
	
		offset.left -= $(this.parent.dialogSelector).offset().left; 
		offset.top -= $(this.parent.dialogSelector).offset().top;
	
	for(var i =0 ; i< rowsDivs.length; i++)
	{
		rowText.push($(rowsDivs[i]).children('input').val());
		rowLink.push($(rowsDivs[i]).children('.tableleft').text());
	}
	return {
		message:prompt,
		id:this.id,
		choices:rowText,
		outputs:rowLink,
		editorData:[offset.left,offset.top]
	}
	
}
DialogNode.prototype.removeLine = function(line)
{
	var rowsDivs = $(this.tableSelector + " .tablerow");
	for(var i = 0; i < this.incomingLinks.length; i++)
	{
		if(this.incomingLinks[i].line === line)
		{
			this.incomingLinks.splice(i,1);
			
		}
	}
	
	for(var i = 0; i < this.outgoingLinks.length; i++)
	{
		if(this.outgoingLinks[i].line === line)
		{
			
			$(this.outgoingLinks[i].start).text('');
			$(this.outgoingLinks[i].start).css('background-color','');
			this.outgoingLinks.splice(i,1);
		}
	}	
}

DialogNode.prototype.getLineByStart = function(start)
{
	for(var i = 0; i < this.incomingLinks.length; i++)
	{
		if(this.incomingLinks[i].start === start)
			return this.incomingLinks[i].line;
	}
	for(var i = 0; i < this.outgoingLinks.length; i++)
	{
		if(this.outgoingLinks[i].start === start)
			return this.outgoingLinks[i].line;
	}
}

DialogNode.prototype.addOutgoingLink = function(startrowelm,targetnodeelm,line)
{
	this.outgoingLinks.push({start:startrowelm,end:targetnodeelm,line:line});
	line.setStart($(startrowelm).width() + $(startrowelm).offset().left,$(startrowelm).height()/2 + $(startrowelm).offset().top);
	line.startNode = this;
}
DialogNode.prototype.addIncomingLink = function(startrowelm,targetnodeelm,line)
{
	this.incomingLinks.push({start:startrowelm,end:targetnodeelm,line:line});
	line.setEnd($(targetnodeelm).offset().left,$(targetnodeelm).offset().top);
	line.endNode = this;
}
DialogNode.prototype.addRow = function(text,link)
{
	var self = this;
	$(this.tableSelector).append('<div class="tablerow"><input type="text" class="tableright"/><div draggable="true" class="tableleft"></></>');
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last()[0].node = self;
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().click(function()
	{
		this.node = self;
		if(!self.parent.startAssociateTarget)
		{
			self.parent.deselect();
			$(this).mouseout();
			self.parent.startAssociate(this);
			
			$(this).css('background','red');
		}
	});
	
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().text(link);
	$(this.tableSelector + ' .tablerow' + ' .tableright').last().val(text);
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().mouseover(function()
	{
		this.node = self;
		if(!self.parent.startAssociateTarget)
		{
			
			$(this)[0].backback = $(this).css('background');
			$(this).css('background','yellow');
			
			$('#'+$(this).text()).css('border','3px solid yellow');
			var line = self.getLineByStart(this);
			if(line)
				line.style.stroke = 'yellow';
		}
	});
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().mouseout(function()
	{
		this.node = self;
		if(!self.parent.startAssociateTarget)
		{
			
			$('#'+$(this).text()).css('background','');
			$(this).css('background',$(this)[0].backback);
			$('#'+$(this).text()).css('border','');
			var line = self.getLineByStart(this);
			if(line)
				line.style.stroke = 'black';
		}
	});
}