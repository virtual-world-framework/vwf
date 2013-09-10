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
	this.dialogSelector = '#' + divID + " .dialogEditor";
	this.confirmSelector = this.dialogSelector + " .dialogEditConfirm";
	$(this.rootSelector).append('<div class="dialogModal"/>');
	$(this.rootSelector).append('<div class="dialogEditor"/>');
	$(this.dialogSelector).append('<div class="dialogEditConfirm"/>');
	$(this.confirmSelector).text('Ok');
	$(this.confirmSelector).click(function(){self.ok()});
	
	$(this.dialogSelector).append('<div class="dialogEditCreate"/>');
	this.createSelector = this.dialogSelector + " .dialogEditCreate";
	$(this.createSelector).text('Add');
	$(this.createSelector).click(function(){self.addNode()});
}

DialogEditor.prototype.close = function()
{
	$(this.rootSelector).css('display','none');
}
DialogEditor.prototype.open = function()
{
	$(this.rootSelector).css('display','block');
}
DialogEditor.prototype.ok = function()
{
	this.close();
}
DialogEditor.prototype.cancel = function()
{
	this.close();
}
DialogEditor.prototype.addNode = function()
{
	var node = new DialogNode(this.dialogSelector,this)
	this.nodes.push(node);
}
DialogEditor.prototype.endAssociate = function(target)
{
	this.endAssociateTarget = target;
	$(this.startAssociateTarget).text($(this.endAssociateTarget).text());
	$(this.startAssociateTarget).css('background','#BBBBBB');
	$(this.endAssociateTarget).css('background','#BBBBBB');
	this.startAssociateTarget = this.endAssociateTarget = null;
}
DialogEditor.prototype.startAssociate = function(target)
{
	this.startAssociateTarget = target;
}
DialogNode = function(parentSelector,parent)
{
	this.parentSelector = parentSelector;
	this.parent = parent;
	this.id = GUID().replace(/-/g,"");
	var self = this;
	$(parentSelector).append('<div class="dialogNodeRoot" id="'+this.id+'"/>' );
	this.selfSelector = '#' + this.id;
	$(this.selfSelector).append('<div class="dialogNodeTable"><div class="dialogNodeID">'+this.id+'</div></div>');
	
	$(this.selfSelector).draggable();
	$(this.selfSelector).append('<div class="dialogNodeTableAdd"></div>');
	this.addSelector = this.selfSelector +" .dialogNodeTableAdd";
	this.tableSelector = this.selfSelector +" .dialogNodeTable";
	this.idSelector = this.selfSelector +" .dialogNodeID";
	$(this.addSelector).text('+');
	$(this.addSelector).click(function(){self.addRow()});
	$(this.idSelector).last().click(function()
	{
		self.parent.endAssociate(this);
	});
	$(this.idSelector).last().mouseover(function()
	{
		if(self.parent.startAssociateTarget)
			$(this).css('background','red');
	});
	$(this.idSelector).last().mouseout(function()
	{
		if(self.parent.startAssociateTarget)
			$(this).css('background','#BBBBBB');
	});
}
DialogNode.prototype.addRow = function()
{
	var self = this;
	$(this.tableSelector).append('<div class="tablerow"><input type="text" class="tableright"/><div draggable="true" class="tableleft"></></>');
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().click(function()
	{
		if(!self.parent.startAssociateTarget)
		{
			$(this).mouseout();
			self.parent.startAssociate(this);
			
			$(this).css('background','red');
		}
	});
	
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().mouseover(function()
	{
		if(!self.parent.startAssociateTarget)
		{
			
			$(this)[0].backback = $(this).css('background');
			$(this).css('background','yellow');
			
			$('#'+$(this).text()).css('border','3px solid yellow');
			
		}
	});
	$(this.tableSelector + ' .tablerow' + ' .tableleft').last().mouseout(function()
	{
		if(!self.parent.startAssociateTarget)
		{
			
			$('#'+$(this).text()).css('background','');
			$(this).css('background',$(this)[0].backback);
			$('#'+$(this).text()).css('border','');
		}
	});
}