/*
Copyright 2009 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function _SimpleSlider_disableSelection(node) {
  // http://stackoverflow.com/questions/69430/is-there-a-way-to-make-text-unselectable-on-an-html-page
  if (node.onselectstart) // IE
    node.onselectstart = function(){ return false; };
  else if (node.style.MozUserSelect) // FF
    node.style.MozUserSelect = 'none';
  else
    node.onmousedown = function(){ return false; };
};

function _SimpleSlider_addEventListener(node, eventName, listener) {
  if (node.addEventListener)
    node.addEventListener(eventName, listener, false);
  else if (node.attachEvent)
    node.attachEvent('on' + eventName, listener);
};
 
/**
 * Makes a simple slider :)
 */
function SimpleSlider(parentNode, options) {
  var me = this;
  
  // set up defaults
  options = options || {};
  if (typeof(options.max) == 'undefined') options.max = 1.0;
  if (typeof(options.startPosition) == 'undefined')
    options.startPosition = 0.0;
  if (typeof(options.width) == 'undefined') options.width = 200;
  if (typeof(options.height) == 'undefined') options.height = 16;
  if (typeof(options.formatPosFn) == 'undefined') options.formatPosFn = 
    function(x){ return x.toString(); };
  if (typeof(options.onSlide) == 'undefined') options.onSlide = function(){};
  
  // other properties;
  var position = options.startPosition;
  
  // create the slider node and children
  var sliderNode = document.createElement('div');
  if (options.id)
    sliderNode.setAttribute('id', options.id);
  sliderNode.className = 'SimpleSlider';
  sliderNode.style.width = options.width + 'px';
  sliderNode.style.height = options.height + 'px';
  sliderNode.tabIndex = 1;
  _SimpleSlider_disableSelection(sliderNode);

  var sliderPegNode = document.createElement('div');
  sliderPegNode.className = 'SimpleSlider_peg';
  sliderPegNode.style.height = options.height + 'px';
  sliderNode.appendChild(sliderPegNode);
  
  var sliderDurationNode = document.createElement('div');
  sliderDurationNode.className = 'SimpleSlider_duration';
  sliderDurationNode.style.height = options.height + 'px';
  sliderDurationNode.style.lineHeight = options.height + 'px';
  sliderDurationNode.style.left = options.width + 'px';
  sliderNode.appendChild(sliderDurationNode);
    sliderDurationNode.onselectstart = function(){ return false; }
    
  var sliderTimeNode = document.createElement('div');
  sliderTimeNode.className = 'SimpleSlider_time';
  sliderTimeNode.style.lineHeight = options.height + 'px';
  sliderTimeNode.style.height = options.height + 'px';
  sliderNode.appendChild(sliderTimeNode);
  
  parentNode.appendChild(sliderNode);
  
  // set duration text
  sliderDurationNode.innerHTML = options.formatPosFn(options.max);
  
  // basic pixel calculations
  var minClientX = 0;
  var sliderPegWidth = sliderPegNode.offsetWidth;
  var sliderWidth = (sliderNode.clientWidth || sliderNode.offsetWidth) -
                    sliderPegWidth;
  var sliderBorderWidth = sliderNode.clientWidth ?
      (sliderNode.offsetWidth - sliderNode.clientWidth) / 2 : 0;
  var sliderDurationWidth = sliderDurationNode.offsetWidth;
  
  var curOffsetNode = sliderNode;
  while (curOffsetNode) {
    minClientX += curOffsetNode.offsetLeft;
    curOffsetNode = curOffsetNode.offsetParent;
  }
  
  var setSliderPosClientX = function(clientX) {
    // TODO: clientX should factor in page scrolling, ala pageX, which isn't
    // available in all browsers
    me.setPosition(
        (clientX - minClientX - sliderPegWidth / 2 - sliderBorderWidth) /
        sliderWidth * options.max);
  };
  
  var mouseDown = false;
  
  // event listeners on the slider
  _SimpleSlider_addEventListener(sliderNode, 'mousedown', function(evt) {
    if (evt.button == 0 ||
        (navigator.userAgent.indexOf('MSIE') >= 0 && evt.button & 1)) {
      mouseDown = true;
      setSliderPosClientX(evt.clientX);
    }
  });
  
  _SimpleSlider_addEventListener(sliderNode, 'mousemove', function(evt) {
    if (mouseDown) {
      setSliderPosClientX(evt.clientX);
    }
  });
  
  _SimpleSlider_addEventListener(sliderNode, 'mouseup', function(evt) {
    mouseDown = false;
  });
  
  // public methods on SimpleSlider
  me.getNode = function() {
    return sliderNode;
  };
    
  me.getPosition = function() {
    return position;
  };
  
  me.setPosition = function(pos) {
    position = Math.max(0, Math.min(options.max, pos));
    
    var sliderPos = Math.max(0, Math.min(1, position / options.max));
    sliderPegNode.style.width = sliderPos * sliderWidth + 'px';

    sliderTimeNode.innerHTML = options.formatPosFn(position);
    
    if ((1 - sliderPos) * sliderWidth < sliderDurationWidth * 1.5) {
      sliderTimeNode.style.left = 'auto';
      sliderTimeNode.style.right = (1 - sliderPos) * sliderWidth + 'px';
    } else {
      sliderTimeNode.style.left = sliderPos * sliderWidth + 'px';
      sliderTimeNode.style.right = 'auto';
    }
    
    options.onSlide(position);
  };
  
  me.setPosition(position);
  
  return me;
}
