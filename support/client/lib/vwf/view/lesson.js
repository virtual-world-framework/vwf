"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// vwf/view/lesson creates a view interface for instruction text. 
/// 
/// @module vwf/view/lesson
/// @requires vwf/view

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            var self = this;

            this.lessonSteps = new Array();
            this.progressWidth = 10;

            // Add CSS files
            var lessonCss = document.createElement('link');
            lessonCss.rel = 'stylesheet';
            lessonCss.type = 'text/css';
            lessonCss.href = 'vwf/view/lesson/lesson.css';
            $('head').append(lessonCss);

            // Create instruction panel
            var instructionPanelDiv = document.createElement('div');
            instructionPanelDiv.id = 'instructionPanel';

            // Create instruction accordion
            var accordionDiv = document.createElement('div');
            accordionDiv.id = 'accordion';

            // Create lesson progress bar
            var progressDiv = document.createElement('div');
            progressDiv.id = 'progress';

            var innerProgressDiv = document.createElement('div');
            innerProgressDiv.className = 'progress';

            var innerProgressBarDiv = document.createElement('div');
            innerProgressBarDiv.className = 'bar';
            innerProgressBarDiv.id = 'lessonProgressBar';

            $(innerProgressDiv).append(innerProgressBarDiv);
            $(progressDiv).append(innerProgressDiv);

            // Create navigation buttons
            var navigationDiv = document.createElement('div');
            navigationDiv.id = 'navigation';

            var buttonList = document.createElement('ul');

            var messageListItem = document.createElement('li');
            messageListItem.id = 'message';

            var messageListItemLabel = document.createElement('label');
            messageListItemLabel.className = 'buttonLabel';

            $(messageListItem).append(messageListItemLabel);

            var startButtonListItem = document.createElement('li');
            startButtonListItem.id = 'startButton';

            var startButtonItemButton = document.createElement('button');
            startButtonItemButton.type = 'button';
            startButtonItemButton.className = 'btn btn-info';
            startButtonItemButton.onclick = function () {
                startLesson.call(self);
            };

            var startButtonItemLabel = document.createElement('label');
            startButtonItemLabel.className = 'buttonLabel';
            startButtonItemLabel.innerHTML = 'Start';

            $(startButtonItemButton).append(startButtonItemLabel);
            $(startButtonListItem).append(startButtonItemButton);

            // TODO: Implement previous method
            // var previousButtonListItem = document.createElement('li');
            // previousButtonListItem.id = 'previousButton';

            // var previousButtonItemButton = document.createElement('button');
            // previousButtonItemButton.type = 'button';
            // previousButtonItemButton.className = 'btn btn-info';
            // previousButtonItemButton.onclick = function () {
            //     previousTask.call(self);
            // };

            // var previousButtonItemLabel = document.createElement('label');
            // previousButtonItemLabel.className = 'buttonLabel';
            // previousButtonItemLabel.innerHTML = 'Previous';

            // $(previousButtonItemButton).append(previousButtonItemLabel);
            // $(previousButtonListItem).append(previousButtonItemButton);

            var nextButtonListItem = document.createElement('li');
            nextButtonListItem.id = 'nextButton';

            var nextButtonItemButton = document.createElement('button');
            nextButtonItemButton.type = 'button';
            nextButtonItemButton.className = 'btn btn-info';
            nextButtonItemButton.onclick = function () {
                nextTask.call(self);
            };

            var nextButtonItemLabel = document.createElement('label');
            nextButtonItemLabel.className = 'buttonLabel';
            nextButtonItemLabel.innerHTML = 'Next';

            $(nextButtonItemButton).append(nextButtonItemLabel);
            $(nextButtonListItem).append(nextButtonItemButton);

            var completeButtonListItem = document.createElement('li');
            completeButtonListItem.id = 'completeButton';

            var completeButtonItemButton = document.createElement('button');
            completeButtonItemButton.type = 'button';
            completeButtonItemButton.className = 'btn btn-info';
            completeButtonItemButton.onclick = function () {
                completeLesson.call(self);
            };

            var completeButtonItemLabel = document.createElement('label');
            completeButtonItemLabel.className = 'buttonLabel';
            completeButtonItemLabel.innerHTML = 'Complete';

            $(completeButtonItemButton).append(completeButtonItemLabel);
            $(completeButtonListItem).append(completeButtonItemButton);

            $(buttonList).append(messageListItem);
            $(buttonList).append(startButtonListItem);
            // $(buttonList).append(previousButtonListItem);
            $(buttonList).append(nextButtonListItem);
            $(buttonList).append(completeButtonListItem);

            $(navigationDiv).append(buttonList);

            $(instructionPanelDiv).append(accordionDiv);
            $(instructionPanelDiv).append(progressDiv);
            $(instructionPanelDiv).append(navigationDiv);
            $('body').append(instructionPanelDiv);
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {
            return this.initializedProperty(nodeID, propertyName, propertyValue);   
        },

        initializedProperty: function (nodeID, propertyName, propertyValue) {
            switch (propertyName) {
              case "text": 
                if(propertyValue) this.lessonSteps[nodeID] = propertyValue;
                break;
            }
        },

        firedEvent: function (nodeId, eventName, eventParameters) {
            if(nodeId == vwf.find('', '/lesson')[0])
            {
                switch (eventName) {
                  case "entering":
                    this.progressWidth = 10;
                    $('#lessonProgressBar').css('display', 'block');
                    $('#lessonProgressBar').css('width', '10px');
                    $('#message').css('display', 'none');
                    $('#startButton').css('display', 'none');
                    $('#nextButton').css('display', 'inline-block');
                    $('a').css('color', 'white');
                    if($('#accordion').html() == '') updateLessonInstructions.call(self, this.lessonSteps);
                    $( $( $("#accordion").children('div')[0] ).children('h2')[0] ).trigger('click');
                    break;
                  case "completed":
                    $('#lessonProgressBar').css('width', '100%');
                    $('#nextButton').css('display', 'none');
                    $('#completeButton').css('display', 'inline-block');
                    $("#accordion").accordion("activate", false);
                    break;
                  case "exiting":
                    $('#lessonProgressBar').css('display', 'none');
                    $('#completeButton').css('display', 'none');
                    $('#message').css('display', 'inline-block');
                    $('#startButton').css('display', 'inline-block');
                }
            }
            else
            {
                switch (eventName) {
                  case "entering":
                    var stepDivName = '#' + nodeId.replace(/\:/g, "_");
                    if($(stepDivName).length) $(stepDivName).trigger('click');
                    break;
                  case "completed":
                    var htmlDiv = nodeId.replace(/\:/g, "_");
                    if( $('#div--' + htmlDiv) ) $('#' + htmlDiv).css('color', 'green');
                    var numTasks = 0;
                    for (var step in this.lessonSteps) { numTasks++; }
                    var widthDelta = Math.ceil(100 / numTasks);
                    var pixelWidth = $('#progress').css('width');
                    pixelWidth = pixelWidth.substring(0, pixelWidth.length-2);
                    this.progressWidth = this.progressWidth + (pixelWidth*widthDelta*0.01);
                    $('#lessonProgressBar').css('width', this.progressWidth+'px');
                    break;
                  case "exiting":
                    var accordionName = '#accordion--' + nodeId.replace(/\:/g, "_");
                    if($(accordionName).length) $(accordionName).accordion("activate", false);
                    break;
                }
            }
        },
        
    } );

    // -- updateLessonInstructions ----------------------------------------------------------

    function updateLessonInstructions(lessonSteps) 
    {
        var lessonID = vwf.find('', '/lesson')[0];
        var currentTaskID = lessonID;

        for(var step in lessonSteps)
        {
            var parentID = vwf_view.kernel.parent( step );

            if(parentID == lessonID)
            {
                var subAccordionDiv = document.createElement('div');
                subAccordionDiv.id = 'accordion--' + step.replace(/\:/g, "_");

                $('#accordion').append("<p class='taskTitle'>" + lessonSteps[step] + "</p>");
                $('#accordion').append(subAccordionDiv);
                $('#accordion').append("<br />");

                currentTaskID = step;
            }
            else if(parentID == currentTaskID)
            {
                $('#accordion--'+parentID.replace(/\:/g, "_")).append("<h2><a id='" + step.replace(/\:/g, "_") + "' href='#'>" + lessonSteps[step] + "</a></h2>");
                $('#accordion--'+parentID.replace(/\:/g, "_")).append("<div id='div--" + step.replace(/\:/g, "_") + "'></div>");  
            }
            else
            {
                var htmlParent = parentID.replace(/\:/g, "_");
                while(! $('#div--' + htmlParent).length) 
                {
                    htmlParent = htmlParent.substring(0, htmlParent.lastIndexOf('_'));
                }
                if( $('#div--' + htmlParent).html() != "" ) $('#div--' + htmlParent).append("<br />");
                $('#div--' + htmlParent).append(lessonSteps[step] + "<br />");
            }
        }

        $("#accordion").children('div').accordion({ active: false, collapsible: true });
    }

    // -- startLesson -----------------------------------------------------------------------

    function startLesson()
    {
        vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'enter', []);
    }

    // -- nextTask --------------------------------------------------------------------------

    function nextTask()
    {
        vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'next', []);
    }

    // -- completeLesson --------------------------------------------------------------------

    function completeLesson()
    {
        vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'exit', []);
    }

} );
