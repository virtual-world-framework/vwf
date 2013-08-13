//  Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
//  Secretary of Defense (Personnel & Readiness).
//  
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
//  in compliance with the License. You may obtain a copy of the License at
//  
//    http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software distributed under the License
//  is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
//  or implied. See the License for the specific language governing permissions and limitations under
//  the License.





//  This javascript file contains functions for managing the appearance and UI of the 
//  chat program.



//  function displayLogin():  Display the logon div and hide the non-logon div's.
//  function disableLogonDataEntry():  Disables the logon div input fields.
//  function enableLogonDataEntry():   Enables the logon div input fields.
//  function displayUserExistsMessage(): Displays the display name already in use error message 
//                                        on the logon div.
//  function hideUserExistsMessage(): Hides the display name already in use error message on the
//                                    logon div.
//  function addUser( userName, userColor ): Add a new user to the userList.
//  function displayChatInterface(userInitialColor): Hides the logon screen, shows the chat interface,
//                                     sets the chat option color selector to the users initial color.
//  function changeUserColor(userName, newColor):  Change the color for the passed in username.
//  function removeUser(userName):  Remove user with the passed in display name from the User List.
//  function sanitizeUserName(userName): Takes a username, strips non alpha-numeric characters.
//  function loadAudioSelects(): Takes the audio entries on the page and creates option entries for
//                                them in the sound select drop downs.



//  function displayLogin():  Display the logon div and hide the non-logon div's.
function displayLogin( ) {
    //Clear any user list or current chat content from those divs.
    $( '#chatTable' ).empty( );
    $( '#chatListInternal' ).empty( );
    //Hide the non-login divs.
    $( '#chatWindow' ).hide( );
    $( '#chatList' ).hide( );
    $( '#chatOptions' ).hide( );
    //Display the logon div.
    $( '#logon' ).show( );
}



//  function disableLogonDataEntry():  Disables the logon div input fields.
function disableLogonDataEntry ( ) {
    $( '#playerTextColor' ).attr( "disabled", "disabled" );
    $( '#playerNameInput' ).attr( "disabled", "disabled" );
    $( '#chatlogin' ).attr( "disabled", "disabled" );
}



//  function enableLogonDataEntry():   Enables the logon div input fields.
function enableLogonDataEntry( ) {
    $( '#playerTextColor' ).removeAttr( "disabled" );
    $( '#playerNameInput' ).removeAttr( "disabled" );
    $( '#chatlogin' ).removeAttr( "disabled" );
}



//  function displayUserExistsMessage(): Displays the display name already in use error message 
//                                        on the logon div.
function displayUserExistsMessage( ) {
    $( '#nameexists' ).show( );
}



//  function hideUserExistsMessage(): Hides the display name already in use error message on the
//                                    logon div.
function hideUserExistsMessage( ) {
    $( '#nameexists' ).hide( );
}


//  function addUser( userName, userColor ): Add a new user to the userList.
function addUser( userName, userColor ) {
    //Test if the user is already in the list.
    if ( $( '#' + userName + 'entry' ).length == 0 ) {
        //If not, add a new entry into the list for this user.
        var newString = "<div id='" + userName + "ENTRY' class='" + userName + "' style='font-size:16pt;font-weight:bold;color:" + userColor + "'>" + userName + "</div>";
        $( '#chatListInternal' ).append( newString );
    }
}



//  function displayChatInterface(userInitialColor): Hides the logon screen, shows the chat interface,
//                                     sets the chat option color selector to the users initial color.
function displayChatInterface( userInitialColor ) {
    //Show the chat interface divs.
    $( '#chatWindow' ).show( );
    $( '#chatList' ).show( );
    $( '#chatOptions' ).show( );
    //Hide the logon div.
    $( '#logon' ).hide( );
    //Set the color selector to the users initial color.
    $( '#changeTextColor' ).val( userInitialColor );
}



//  function changeUserColor(userName, newColor):  Change the color for the passed in username.
function changeUserColor( userName, newColor ) {
    $( '.' + userName ).css( "color", newColor );
}


// Remove the user matching the passed in userName from the userList.
function removeUser( userName ) {
    $( '#' + userName + 'ENTRY' ).remove( );
}



//  function sanitizeUserName(userName): Takes a username, strips non alpha-numeric characters.
function sanitizeUsername( userName ) {
    userName = userName.replace( / /g, "_" );
    userName = userName.replace( /([^0-9A-Za-z\-\_])/g, "" );
    return userName;
}



//  function loadAudioSelects(): Takes the audio entries on the page and creates option entries for
//                                them in the sound select drop downs.
function loadAudioSelects( ) {
    //First grab all of the sounds.
    var soundList =  $( '.sounds' );
    //Clear the two selects.
    $( '#changeSoundSelect' ).empty( );
    $( '#loginSoundSelect' ).empty( );
    //Loop over the grabbed sounds, adding options for each sound to both selects.
    for( var soundIndex = 0; soundIndex < soundList.length; soundIndex++ ) {
        var newOption = "<option value='" + soundList[ soundIndex ].id + "'>" + soundList[ soundIndex ].id + "</option>";
        $( '#changeSoundSelect' ).append( newOption );
        $( '#loginSoundSelect' ).append( newOption );
    }
}


function getTimestamp( ) {
  var timestampDate = new Date( );
	var timestampHours = timestampDate.getHours();
	var timestampPeriod = "AM";
  var timestampMonthBlank = "";
  var timestampHoursBlank = "";
  if ( timestampDate.getMonth()  < 9 ) {
      timestampMonthBlank = "&nbsp;";
  }
	if ( timestampHours > 11 ) {
	    timestampHours = timestampHours - 12;
	    timestampPeriod = "PM"
	}
  if ( timestampHours == 0 ) {
      timestampHours = 12;
  }
  if ( timestampHours < 10 ) {
      timestampHoursBlank = "&nbsp;";
  }
	var timestampMinutes = timestampDate.getMinutes();
	if ( timestampMinutes < 10 ) {
	    timestampMinutes = "0" + timestampMinutes;
	}
	var timestampSeconds = timestampDate.getSeconds();
  if ( timestampSeconds < 10 ) {
      timestampSeconds = "0" + timestampSeconds;
  }
  return timestampMonthBlank + ( timestampDate.getMonth() + 1 ) + "/" + timestampDate.getDate() + " " + timestampHoursBlank + timestampHours + ":" + timestampMinutes + ":" +  timestampSeconds + " " + timestampPeriod;
}