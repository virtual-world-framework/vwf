define({
	initialize:function(div)
	{
		$('#'+div).append('<div id="GlobalProgressBar" />');
		$('#GlobalProgressBar').append('<div id="GlobalProgressBarBack" />');
		$('#GlobalProgressBar').append('<div id="GlobalProgressBarInner" />');
		$('#GlobalProgressBarInner').text('message');
		this.end();
	},
	setProgress:function(percent)
	{
		var w = $('#GlobalProgressBar').width() * percent;
		$('#GlobalProgressBarInner').css('width',w +'px');

	},
	setMessage:function(message)
	{
		$('#GlobalProgressBarInner').text(message);
		

	},
	show:function(message)
	{
		$('#GlobalProgressBar').show();
	},
	hide:function(message)
	{
		$('#GlobalProgressBar').hide();
	},
	start:function(message,total)
	{
		this.count = 0;
		this.total = total;
		this.setProgress(0);
		this.show();
		this.setMessage(message);
	},
	step:function()
	{
		this.count++;
		var w = this.count/this.total;
		this.setProgress(w);
	},
	end:function(message)
	{
		$('#GlobalProgressBar').hide();
	}
});