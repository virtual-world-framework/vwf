/**
 * jQuery Log
 * Fast & safe logging in Firebug console
 * 
 * @param mixed - as many parameters as needed
 * @return void
 * 
 * @url http://plugins.jquery.com/project/jQueryLog
 * @author Amal Samally [amal.samally(at)gmail.com]
 * @version 1.0
 * @example:
 * 		$.log(someObj, someVar);
 * 		$.log("%s is %d years old.", "Bob", 42);
 * 		$('div.someClass').log().hide();
 */
(function(a){a.log=function(){if(window.console&&window.console.log){console.log.apply(window.console,arguments)}};a.fn.log=function(){a.log(this);return this}})(jQuery);