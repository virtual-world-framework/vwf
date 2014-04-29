define(function ()
{
	var WireEditor = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(WireEditor);
				isInitialized = true;
			}
			return WireEditor;
		}
	}

	function initialize()
	{
		$(document.body).append("<div id='WireEditor'></div>");
		$("#WireEditor").append("<div class='wireeditorleft'><div id='WireEditorSelectedName'></div><div id='WireEditorSelectedProps'></div></div>");
		$("#WireEditor").append("<div class='wireeditorright'><div id='WireEditorSourceName'></div><div id='WireEditorSourceProps'></div></div>");
		$("#WireEditor").append("<div id='wireeditorbuttons' />");
		$("#wireeditorbuttons").append("<div id='SubExp1'>Expression</div><div id='wireeditorLink' /><div id='SubExp2'>Expression</div>");
		this.selectedProp = null;
		this.selectedNodeID = null;
		this.pickSourceID = null;
		this.pickSourceProp = null;
		this.currentWires = null;
		this.subExp1 = null;
		this.subExp2 = null;
		var self = this;
		
		
		$(".wireeditorright").append("<div id='wireeditordisable'/>");
		$("#wireeditordisable").hide();
		this.setSubExp1 = function(e)
		{
			$('#SubExp1').text("Expression: " + e)
			this.subExp1 = typeof (e) == 'string' ?e.split('.'):null;
		}
		this.setSubExp2 = function(e)
		{
			$('#SubExp2').text("Expression: " + e)
			this.subExp2 = typeof (e) == 'string' ?e.split('.'):null;
		}
		$('#SubExp1').click(function(){
			alertify.prompt("Enter the sub expression as Prop.SubProp...",function(ok,val){

				if(ok)
				self.setSubExp1(val);
			})

		});
		$('#SubExp2').click(function(){
			alertify.prompt("Enter the sub expression as Prop.SubProp...",function(ok,val){

				if(ok)
				self.setSubExp2(val);
			})

		});
		this.linkOrUnlink = function()
		{
			if(self.hasWire())
			{

				var i = 0;
				for(i =0; i < self.currentWires.length; i++)
				{
					var wire = self.currentWires[i];
					if(wire[1]==self.selectedProp)
					{
						break;
					}
				}

				var prompt = "Do you want to break the wire " + vwf.getProperty(self.selectedNodeID,'DisplayName') + "." + self.currentWires[i][1] + "." + ((self.currentWires[i][3] || []).join('.')) +" <== " + vwf.getProperty(self.currentWires[i][0],'DisplayName') +"." + self.currentWires[i][2] + "." + ((self.currentWires[i][4] || []).join('.'));
				alertify.confirm(prompt,function(ok){
					if(ok)
					{
						self.currentWires.splice(i,1);
						vwf_view.kernel.setProperty(self.selectedNodeID,'wires',self.currentWires);
						self.selectProp(self.selectedProp);
					}
				}
				);
			}
			else
			{
				var prompt = "Do you want to create the wire " + vwf.getProperty(self.selectedNodeID,'DisplayName') + "." + self.selectedProp + "." + ((self.subExp1 || []).join('.')) +" <== " + vwf.getProperty(self.pickSourceID,'DisplayName') +"." + self.pickSourceProp + "." + ((self.subExp2 || []).join('.'));
				

				alertify.confirm(prompt,function(ok){
					if(ok)
					{
						self.currentWires.push([self.pickSourceID,self.selectedProp,self.pickSourceProp,self.subExp1,self.subExp2,null])
						vwf_view.kernel.setProperty(self.selectedNodeID,'wires',self.currentWires);
						self.selectProp(self.selectedProp);
					}
				}
				);

				

			}	
			

		}
		$('#wireeditorLink').click(this.linkOrUnlink);
		$('#wireeditorLink').hide();
		$('#SubExp1').hide();
		$('#SubExp2').hide();
		$('#WireEditor').dialog(
		{
			modal: true,
			autoOpen: false,
			resizable: true,
			title:"Wire Editor",
			height:500,
			width:700,
			position:'center',
			movable:false
		});
		this.Show = function()
		{
			$('#WireEditor').dialog('open');
			this.selectedNodeID = _Editor.GetSelectedVWFID();
			this.currentWires = vwf.getProperty(this.selectedNodeID,'wires');
			this.buildGUI();
		}
		this.Hide = function()
		{
			$('#WireEditor').dialog('close');
		}
		this.isOpen = function()
		{
			return $('#WireEditor').is(":visible");
		}
		this.getProperties = function(id)
		{
			var properties = {};
			var node = vwf.getNode(id);
			while(node)
			{
				for ( var i in node.properties)
				{
					if(properties[i] === undefined)
					properties[i] = node.properties[i];
				
				}
				node = vwf.getNode(vwf.prototype(node.id),true);
			}
			return properties;
		}
		this.pickSource = function(e)
		{
			$('#WireEditor').dialog('close')
			_Editor.SetSelectMode('TempPick');
			$('#wireeditorLink').hide();
			$('#SubExp1').hide();
				$('#SubExp2').hide();
			_Editor.TempPickCallback = function(e)
			{
				$('#WireEditor').dialog('open')
				_Editor.SetSelectMode('None');
				_Editor.SelectObject();
				self.setSource(e);
			}
		}
		this.pickTarget = function(e)
		{
			$('#WireEditor').dialog('close')
			_Editor.SetSelectMode('TempPick');
			$('#wireeditorLink').hide();
			$('#SubExp1').hide();
				$('#SubExp2').hide();
			_Editor.TempPickCallback = function(e)
			{
				$('#WireEditor').dialog('open')
				_Editor.SetSelectMode('None');
				_Editor.SelectObject();
				self.selectedNodeID = e.id;
				self.currentWires = vwf.getProperty(self.selectedNodeID,'wires');
				self.buildGUI();
				self.setSource(self.pickSourceID);
			}
		}
		$('#WireEditorSourceName').click(this.pickSource);
		$('#WireEditorSelectedName').click(this.pickTarget);
		this.setSource = function(e)
		{
			if(!e)
			{
				this.pickSourceID = e;
				$("#wireeditordisable").hide();
				$(".wireeditorright").removeClass('wiredisabled');
				return;
			}
			this.pickSourceID = e.id || e;
			

			$('#WireEditorSourceName').text(vwf.getProperty(this.pickSourceID,'DisplayName') ||this.pickSourceID);
			$('#WireEditorSourceProps').empty();
			var props = this.getProperties(this.pickSourceID);
			for(var i in props)
			{
				$('#WireEditorSourceProps').append("<div class='sourcepropchoice' id='sourceprop"+i+"'>"+i+"</div>");
				var self = this;

				$('#sourceprop'+i).click(function(e)
				{
					self.setSourceProp($(this).text());
					
				})
			}
		}
		this.updateTargetProps = function()
		{
				$(".targetpropchoice").removeClass('wirepropwired');
				for(i =0; i < self.currentWires.length; i++)
				{
					var wire = self.currentWires[i];
					var e = wire[1];
					$(".targetpropchoice").filter(":contains("+e+")").addClass('wirepropwired');
				}

		}
		this.hasWire = function()
		{
			for(var i =0; i < this.currentWires.length; i++)
			{
				var wire = this.currentWires[i];
				if(wire[1]==this.selectedProp)
				{
					return true;
				}
			}
			return false;
		}
		this.setSourceProp = function(e)
		{
			self.pickSourceProp = e;
			$('#wireeditorLink').css( "display", "inline-block");
			if(!self.hasWire())
			{
				$('#wireeditorLink').text('Create Wire');
				$('#SubExp1').css( "display", "inline-block");
				$('#SubExp2').css( "display", "inline-block");
			}
			else
			{
				$('#wireeditorLink').text('Break Wire');
			}

			$(".sourcepropchoice").removeClass('wirepropselected');
			$(".sourcepropchoice").filter(":contains("+e+")").addClass('wirepropselected');
			self.setSubExp2(null);
		}
		this.selectProp = function(e)
		{
			this.updateTargetProps();
			this.selectedProp = e;
			var wiredToID = null;
			var wiredToProp = null;
			var wireSubTarget = null;
			var wireSubSource = null;
			var wireFunc = null;
			$('#wireeditorLink').hide();
			$('#SubExp1').hide();
			$('#SubExp2').hide();
			$(".sourcepropchoice").removeClass('wirepropselected');
			self.pickSourceProp = null;
			$("#wireeditordisable").hide();
			$(".wireeditorright").removeClass('wiredisabled');
			self.setSubExp1(null);
			for(var i =0; i < this.currentWires.length; i++)
			{
				var wire = this.currentWires[i];
				if(wire[1]==e)
				{
					wiredToID = wire[0];
					wiredToProp = wire[2];
					wireSubSource = wire[3];
					wireSubTarget = wire[4];
					wireFunc = wire[5];
					self.setSubExp1(wireSubSource);
					self.setSubExp2(wireSubTarget);
				}
			}
			if(wiredToID)
			{
				this.setSource(wiredToID)
				this.setSourceProp(wiredToProp);
				$("#wireeditordisable").show();
				$(".wireeditorright").addClass('wiredisabled');
				
			}

		}
		this.buildGUI = function()
		{
			$('#WireEditorSelectedProps').empty();
			$('#WireEditorSourceProps').empty();
			$('#WireEditorSelectedName').text(vwf.getProperty(this.selectedNodeID,'DisplayName') ||this.selectedNodeID) ;
			$("#wireeditordisable").show();
			$(".wireeditorright").addClass('wiredisabled');
			var props = this.getProperties(this.selectedNodeID);
			for(var i in props)
			{
				$('#WireEditorSelectedProps').append("<div class='targetpropchoice' id='targetprop"+i+"'>"+i+"</div>");
				var self = this;

				$('#targetprop'+i).click(function(e)
				{
					
					self.selectProp($(this).text());
					$(".targetpropchoice").removeClass('wirepropselected');
					$(this).addClass('wirepropselected');
				})
			}
			this.updateTargetProps();
			self.setSource(self.pickSourceID);
		}
	}
});