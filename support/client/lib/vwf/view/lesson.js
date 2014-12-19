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

define( [ "module", "vwf/view", "jquery", "jquery-ui" ], function( module, view, $ ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            var self = this;

            this.lessonSteps = {};
            this.progressWidth = 10;

            this.currentTaskName = undefined;

            // Add CSS files
            var lessonCss = document.createElement('link');
            lessonCss.rel = 'stylesheet';
            lessonCss.type = 'text/css';
            lessonCss.href = 'vwf/view/lesson/jquery-ui-1.10.4.custom.min.css';
            $('head').append(lessonCss);
            lessonCss = document.createElement('link');
            lessonCss.rel = 'stylesheet';
            lessonCss.type = 'text/css';
            lessonCss.href = 'vwf/view/lesson/lesson.css';
            $('head').append(lessonCss);

            // Create instruction panel
            var instructionPanelDiv = document.createElement('div');
            instructionPanelDiv.className = 'lesson';
            instructionPanelDiv.id = 'instructionPanel';

            // Create instruction accordion
            var accordionDiv = document.createElement('div');
            accordionDiv.className = 'lesson';
            accordionDiv.id = 'accordion';

            // Create lesson progress bar
            var progressDiv = document.createElement('div');
            progressDiv.className = 'lesson';
            progressDiv.id = 'progress';

            var innerProgressDiv = document.createElement('div');
            innerProgressDiv.className = 'lesson progress';

            var innerProgressBarDiv = document.createElement('div');
            innerProgressBarDiv.className = 'lesson bar';
            innerProgressBarDiv.id = 'lessonProgressBar';

            $(innerProgressDiv).append(innerProgressBarDiv);
            $(progressDiv).append(innerProgressDiv);

            // Create navigation buttons
            var navigationDiv = document.createElement('div');
            navigationDiv.className = 'lesson';
            navigationDiv.id = 'navigation';

            var buttonList = document.createElement('ul');
            buttonList.className = 'lesson';

            var messageListItem = document.createElement('li');
            messageListItem.className = 'lesson';
            messageListItem.id = 'message';

            var messageListItemLabel = document.createElement('label');
            messageListItemLabel.className = 'lesson buttonLabel';

            $(messageListItem).append(messageListItemLabel);

            var startButtonListItem = document.createElement('li');
            startButtonListItem.className = 'lesson';
            startButtonListItem.id = 'startButton';

            var startButtonItemButton = document.createElement('button');
            startButtonItemButton.type = 'button';
            startButtonItemButton.className = 'lesson btn btn-info';
            startButtonItemButton.onclick = function () {
                startLesson.call(self);
            };

            var startButtonItemLabel = document.createElement('label');
            startButtonItemLabel.className = 'lesson buttonLabel';
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
            nextButtonListItem.className = 'lesson';
            nextButtonListItem.id = 'nextButton';

            var nextButtonItemButton = document.createElement('button');
            nextButtonItemButton.type = 'button';
            nextButtonItemButton.className = 'lesson btn btn-info';
            nextButtonItemButton.onclick = function () {
                nextTask.call(self);
            };

            var nextButtonItemLabel = document.createElement('label');
            nextButtonItemLabel.className = 'lesson buttonLabel';
            nextButtonItemLabel.innerHTML = 'Next';

            $(nextButtonItemButton).append(nextButtonItemLabel);
            $(nextButtonListItem).append(nextButtonItemButton);

            var completeButtonListItem = document.createElement('li');
            completeButtonListItem.className = 'lesson';
            completeButtonListItem.id = 'completeButton';

            var completeButtonItemButton = document.createElement('button');
            completeButtonItemButton.type = 'button';
            completeButtonItemButton.className = 'lesson btn btn-info';
            completeButtonItemButton.onclick = function () {
                completeLesson.call(self);
            };

            var completeButtonItemLabel = document.createElement('label');
            completeButtonItemLabel.className = 'lesson buttonLabel';
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
        
        createdProperty: function( nodeId, propertyName, propertyValue ) {
            return this.satProperty( nodeId, propertyName, propertyValue );   
        },

        initializedProperty: function (nodeId, propertyName, propertyValue) {
            return this.satProperty( nodeId, propertyName, propertyValue );
        },

        satProperty: function( nodeId, propertyName, propertyValue ) {
            switch ( propertyName ) {
                case "status":
                    var status = propertyValue;
                    if ( nodeId === vwf_view.kernel.find( '', '/lesson' )[ 0 ] ) {
                        switch ( status ) {
                            case "entered":
                                this.currentTaskName = vwf_view.kernel.name( nodeId );
                                this.progressWidth = 10;
                                $( '#lessonProgressBar' ).css( 'display', 'block' );
                                $( '#lessonProgressBar' ).css( 'width', '10px' );
                                $( '#message' ).css( 'display', 'none' );
                                $( '#startButton' ).css( 'display', 'none' );
                                $( '#nextButton' ).css( 'display', 'inline-block' );
                                $( 'a' ).css( 'color', 'white' );
                                if ( $( '#accordion' ).html() == '' ) {
                                    updateLessonInstructions.call( self, this.lessonSteps );
                                }
                                break;
                            case "completed":
                                $('#lessonProgressBar').css('width', '100%');
                                $('#nextButton').css('display', 'none');
                                $('#completeButton').css('display', 'inline-block');
                                break;
                            case "inactive":
                                $( '#lessonProgressBar' ).css( 'display', 'none' );
                                $( '#completeButton' ).css( 'display', 'none' );
                                $( '#message' ).css( 'display', 'inline-block' );
                                $( '#startButton' ).css( 'display', 'inline-block' );
                                break;
                        }
                    } else {
                        var stepDivId = nodeId.replace( /\:/g, "_" ).replace( /\./g, "-" );
                        switch ( status ) {
                            case "entered":
                                this.currentTaskName = vwf_view.kernel.name( nodeId );
                                var $stepDiv = $( "#" + stepDivId );
                                if ( $stepDiv.length ) {
                                    var $accordion = $stepDiv.parent().parent();
                                    if ( $accordion.length ) {
                                        $accordion.accordion( "option", "active", 
                                            Number( $stepDiv.attr( "data-index" ) ) );
                                    }
                                }
                                break;
                            case "completed":
                                if ( $( '#div--' + stepDivId ) ) {
                                    $( '#' + stepDivId ).css( 'color', 'green' );
                                }
                                var numTasks = 0;
                                for ( var step in this.lessonSteps ) { 
                                    numTasks++; 
                                }
                                var widthDelta = Math.ceil( 100 / numTasks );
                                var pixelWidth = $( '#progress' ).css( 'width' );
                                pixelWidth = pixelWidth.substring( 0, pixelWidth.length - 2 );
                                this.progressWidth = this.progressWidth + 
                                    ( pixelWidth * widthDelta * 0.01 );
                                $( '#lessonProgressBar' ).css( 'width', this.progressWidth + 'px' );
                                break;
                            case "inactive":
                                var $accordion = $( '#accordion--' + stepDivId );
                                if ( $accordion.length ) {
                                    $accordion.accordion( "option", "active", false );
                                }
                                break;
                        }
                    }
                    break;
                case "text": 
                    if ( propertyValue ) {
                        this.lessonSteps[ nodeId ] = propertyValue;
                    }
                    break;
            }
        },        
    } );

    // -- updateLessonInstructions ----------------------------------------------------------

    function updateLessonInstructions( lessonSteps ) 
    {
        var lessonID = vwf_view.kernel.find('', '/lesson')[ 0 ];
        var stepIds = vwf_view.kernel.find( lessonID, "./*" );
        var $accordion = $( "#accordion" );
        for ( var i = 0; i < stepIds.length; i++ ) {
            var step = stepIds[ i ];
            var stepText = lessonSteps[ step ];
            var stepSafeId = step.replace(/\:/g, "_").replace(/\./g, "-");
            var $subAccordionDiv = [];
            if ( stepText ) {
                $subAccordionDiv = $( "<div/>", {
                    id: "accordion--" + stepSafeId,
                    "data-index": i
                } );
                $accordion.append( "<p class='lesson taskTitle'>" + stepText + "</p>" );
                $accordion.append( $subAccordionDiv );
                $accordion.append( "<br />" );
            }
            var substepIds = vwf_view.kernel.find( step, "./*" );
            for ( var j = 0; j < substepIds.length; j++ ) {
                var substep = substepIds[ j ];
                var substepText = lessonSteps[ substep ];
                if ( substepText ) {
                    var substepSafeId = substep.replace(/\:/g, "_").replace(/\./g, "-");
                    $subAccordionDiv.append( [
                        "<h2>",
                        "  <a id='" + substepSafeId + "' data-index='" + j + "' href='#'>" + substepText + "</a>",
                        "</h2>"
                    ].join( "\n" ) );
                    $subAccordionDiv.append( "<div id='div--" + substepSafeId + "'></div>");
                }
                vwf_view.kernel.find( substep, "./*", function( subsubstep ) {
                    processSubSubSteps( substep, subsubstep );
                } );
            }
        }

        $accordion.children('div').accordion({ active: false, collapsible: true });

        function processSubSubSteps( parentStepID, childStepID ) {
            var text = lessonSteps[childStepID];
            if ( text ) {
                var htmlParent = parentStepID.replace(/\:/g, "_").replace(/\./g, "-");
                while(! $('#div--' + htmlParent).length) 
                {
                    htmlParent = htmlParent.substring(0, htmlParent.lastIndexOf('_'));
                }
                if( $('#div--' + htmlParent).html() != "" ) $('#div--' + htmlParent).append("<br />");
                $('#div--' + htmlParent).append(text + "<br />");
            }
            vwf_view.kernel.find( childStepID, "./*", function( childSubStepID ) {
                processSubSubSteps( childStepID, childSubStepID );
            } );
        };
    }

    // -- startLesson -----------------------------------------------------------------------

    function startLesson()
    {
        vwf_view.kernel.callMethod(vwf_view.kernel.find('','/lesson')[0], 'enter', []);
    }

    // -- nextTask --------------------------------------------------------------------------

    function nextTask()
    {
        vwf_view.kernel.callMethod(vwf_view.kernel.find('','//'+this.currentTaskName)[0], 'next', []);
    }

    // -- completeLesson --------------------------------------------------------------------

    function completeLesson()
    {
        vwf_view.kernel.callMethod(vwf_view.kernel.find('','/lesson')[0], 'exit', []);
    }

} );
