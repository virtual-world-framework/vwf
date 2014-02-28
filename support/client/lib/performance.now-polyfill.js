// relies on Date.now() which has been supported everywhere modern for years.
// as Safari 6 doesn't have support for NavigationTiming, we use a Date.now() timestamp for relative values
 
// if you want values similar to what you'd get with real perf.now, place this towards the head of the page
// but in reality, you're just getting the delta between now() calls, so it's not terribly important where it's placed
 
 
(function(){
 
  // prepare base perf object
  if (typeof window.performance === 'undefined') {
      window.performance = {};
  }
 
  if (!window.performance.now){
    
    var nowOffset = Date.now();
 
    if (performance.timing && performance.timing.navigationStart){
      nowOffset = performance.timing.navigationStart
    }
 
 
    window.performance.now = function now(){
      return Date.now() - nowOffset;
    }
 
  }
 
})();