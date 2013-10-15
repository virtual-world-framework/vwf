//**************************************
// Taskbar Buttons
//**************************************

// Global Variable Instantiation for Taskbar
var windowIndex = 0;
var windowsCreated = {};
 
// Mute Button - updates mute button and controls local mic mute
 
function setMute() {
    var appID = vwf_view.kernel.application();
    var clientID = vwf_view.kernel.moniker();
    if( $( '#muteButton' ).hasClass( 'btn-info' ) ) {
        $( '#muteButton' ).removeClass( 'btn-info' ).addClass( 'btn-danger' );
        $( '#mute' ).removeClass( 'icon-volume-up' ).addClass( 'icon-volume-off' );

        vwf_view.kernel.callMethod( appID, "setLocalMute", { "moniker": clientID , "value": true } );
    } else {
        $( '#muteButton' ).removeClass( 'btn-danger' ).addClass( 'btn-info' );
        $( '#mute' ).removeClass( 'icon-volume-off' ).addClass( 'icon-volume-up' );

        vwf_view.kernel.callMethod( appID, "setLocalMute", { "moniker": clientID , "value": false } );
    }
}


//**************************************
// Video and App Divs
//**************************************

// Used to determine when we should put video windows on the right and when on the left
var numClients = 0;

function setMainVideo( url, name, color ) {
    
    $( "#mainVideo" ).attr( "src", url );
    $( "#main" ).find( 'span' ).html( name );
    $( "#mainVideoDivOverlay" ).show();

    var r = "0" + parseInt( color[0] ).toString( 16 );
    var g = "0" + parseInt( color[1] ).toString( 16 ).substr( length-2 );
    var b = "0" + parseInt( color[2] ).toString( 16 ).substr( -2 );
    var borderColor = "#" +
        r.substr( r.length - 2 ) + 
        g.substr( g.length - 2 ) +
        b.substr( b.length - 2 );

    $( "#main" ).css( "border-color", borderColor );
  
}

var mainDiv = $( '#main' );

function swapPanes( divId ) {
    var tempMainURL = $( "#mainVideo" ).attr( "src" );
    var tempMainTitle = $( "#main" ).find( 'span' ).html();
    var tempMainBorder = $( "#main" ).css( "border" );

    $( "#mainVideo" ).attr( "src", $( '#' + divId ).find( 'video' ).attr( "src" ) );
    $( "#main" ).css( "border", $( '#' + divId ).css( "border" ) );
    $( "#main" ).find( 'span' ).html( $( '#' + divId ).find( 'span' ).html());

    $( '#' + divId ).find( 'video' ).attr( "src", tempMainURL );
    $( '#' + divId ).find( 'span' ).html( tempMainTitle );
    $( '#' + divId ).css( "border", tempMainBorder );

    var buttonID = "button-" + divId;
    remove( buttonID );

    var buttonHtml = "<div class='btn-group dropup' id='"+buttonID+"'>"+
        "<button class='btn btn-success' id='"+buttonID+"-button'>"+tempMainTitle+"</button>" + 
        "<button class='btn btn-success dropdown-toggle' data-toggle='dropdown'><span class='caret'></span></button>" +
        "<ul class='dropdown-menu pull-right'><li>"+
            "<a id='"+buttonID+"-reset' href='#'>Reset</a>"+
        "</li></ul></div>";

    $( '#appBar' ).append( buttonHtml );

    $( "#" + buttonID + "-button" ).click( function() {
        minMax(divId);
    } );
    $( "#" + buttonID + "-reset" ).click( function() {
        resetPosition( divId );
    } );

}

function newVideoWindow( id, title, url, color, isSelf, width, height ) {

    //--------------------------
    // Set up window parameters
    //--------------------------
    var aspectRatio = 4 / 3;
    var newWin = windowsCreated[ id ] = {
        "title": title,
        "url": url,
        "color": color
    };  // the id should be unique

    // Ensure that color is valid
    if ( color === undefined ) {
        color = [ 0, 0, 0 ];
    }

    // TODO: Factor this out because it is used for the main video, too
    var r = "0" + parseInt( color[0] ).toString( 16 )
    var g = "0" + parseInt( color[1] ).toString( 16 ).substr( length-2 );
    var b = "0" + parseInt( color[2] ).toString( 16 ).substr( -2 );
    var borderColor = "#" + r.substr( r.length-2 ) + g.substr( g.length-2 ) + b.substr( b.length-2 );
    // END TODO

    // Declare the variables that every window type needs
    var divId = newWin.divId = title + windowIndex;
    var divSelector = newWin.divSelector = "#" + divId;
    var $container, classString, stylString, resizeFunction;

    //---------------------------------
    // Set up type-specific parameters
    //---------------------------------

    $container = ( numClients % 8 ) < 4 ? $( '#panesRight' ) : $( '#panesLeft' );
    classString = "'smallDiv video'";
    numClients++;
  
    //-------------------
    // Create the window
    //-------------------

    $container.append(
        "<div id='"+ divId + "' class=" + classString + " style='border-color:" + borderColor + ";'>" +
        "<i id='minimize-" + divId + "' class='minimize icon-chevron-down icon-white' alt='' onclick='minimize(this.id.substr(9));'/>" +
        "</div>"
    );
    var $div = $( divSelector );
    if ( width && height ) {
        aspectRatio = width / height;
    }

    $div.resizable( {
        aspectRatio: aspectRatio,
        handles: 'ne, se, sw, nw',
        minHeight: 125,
        minWidth: 170
    } );

    $div.draggable( {
        containment: "window",
        cancel: "#container-"+divId
    } );

    $div.mousedown( function() {

        $( '#panesRight' ).children().css( "z-index", 3 );
        $( '#panesLeft' ).children().css( "z-index", 3 );
        mainDiv.css( 'z-index', 0 );
        $( this ).css( 'z-index', 4 );
        disablePointerEvents();

    } );

    $div.mouseup( enablePointerEvents );

    $div.data( "originalSize", { width: $div.width(), height: $div.height() } );

    $div.data( "originalOffset", $div.offset() );

    var $appBar = $( "#appBar" );
    if ( $appBar.children().length < 12 ) {
        var buttonName = newWin.buttonName = "button-" + divId;
        var buttonHtml = "<div class='btn-group dropup' id='"+buttonName+"'>"+
            "<button class='btn btn-success' id='"+buttonName+"-button'>"+title+"</button>" + 
            "<button class='btn btn-success dropdown-toggle' data-toggle='dropdown'><span class='caret'></span></button>" +
            "<ul class='dropdown-menu pull-right'><li>" +
            "<a id='"+buttonName+"-reset' href='#'>Reset</a>";

        if ( isSelf ) { 
            buttonHtml += "<a id='"+buttonName+"-share' href='#'>Share</a>";
        }
        buttonHtml += "</li></ul></div>";

        $appBar.append( buttonHtml );

        $( "#" + buttonName + "-button" ).click( function() {
            minMax( divId );
        } );
        $( "#" + buttonName + "-reset" ).click( function() {
            resetPosition( divId );
        } );

        if ( isSelf ) {
            $( "#" + buttonName + "-share" ).click( function() {
                shareDesktop( divId );
            } );
        } 
    } // why does this brace need to be here

    //---------------------------------
    // Specialize window based on type
    //---------------------------------
    var videoId = newWin.videoId = "video-" + divId;
    var mutedAttr = isSelf ? "muted " : "";
    if ( width === undefined ) { 
        width = 320; 
    }
    if ( height === undefined ) { 
        height = 240; 
    }

    $div.append(
        "<i id='enlarge-" + divId + "' style='position:absolute;right:5px;top:5px;z-index: 4;'  "+
        "alt='' onclick='swapPanes(this.id.substr(8));' class='icon-chevron-up icon-white'/>" +
        "<video id='" + videoId + "' width='"+width+"' height='"+height+"' loop='loop' autoplay " + mutedAttr +
        "style='position: absolute; left: 0; top: 0; z-index: 2;width:100%;height:100%;' />" +
        "<div id='"+ divId + "-overlay' style='position: absolute; left: 0; top: 0; z-index: 2;'>" +
        "<span class='label label-inverse' style='margin-left:5px;margin-top:5px;'>" + title + "</span>"+
        "</div>"
    );  

    var videoE = $( '#'+ videoId )[0];
    if ( videoE ) {
        if ( url ) {
            videoE.src = url;
        }
        if ( isSelf ) {
            videoE.muted = true;  // firefox isn't mapping the muted property correctly
        }
    } 

    windowIndex++;  
    return $div; 
}

function removeWindow( id ) {
    if ( windowsCreated[ id ] != null ) {
        var win = windowsCreated[ id ];

        win.divId && deleteWindow( win.divId );

        delete windowsCreated[ id ];
    }
}


function resizeCanvas( jQueryWindow ) {
    var $container = jQueryWindow.children( ".canvasContainer" );
    var $canvas = $container.children();

    if ( $container.css( 'overflow' ) == 'scroll')  {
        // Unset canvas width and height so it renders VNC at full scale
        $canvas.width( jQueryWindow.width() - 20 );
        $canvas.height( jQueryWindow.height() - 65 );
        $container.height( $canvas.height() + 5);
        $container.width( $canvas.width() + 5);
        $canvas.width( '' ).height( '' );
    } else {
        $canvas.width( jQueryWindow.width() - 20 );
        $canvas.height( jQueryWindow.height() - 65 );
        $container.height( $canvas.height() + 5);
        $container.width( $canvas.width() + 5);
    }
}

function disablePointerEvents() {
    $( 'video' ).css( "pointer-events", "none" );
}

function enablePointerEvents() {
    $( 'video' ).css( "pointer-events", "auto" );
}


function minMax( name )
{
    if( $( '#'+name ).css( 'visibility' ) == 'hidden' ) {
        restore( name );
    } else {
        minimize( name );
    }
}

function minimize( name ) {
    var jQueryWindowName = '#' + name;
    var jQueryWindow = $( jQueryWindowName );
    if ( jQueryWindow ) {
        jQueryWindow.css( 'visibility', 'hidden' );
        $( jQueryWindowName + " iframe" ).hide();
    }
    var button = $( '#button-' + name);
    button.children( 'button' ).each( function( index ) {
        $(this).removeClass( 'btn-success' );
        $(this).addClass( 'btn-primary' );
    } );
}

function restore( name ) {
    var jQueryWindowName = '#' + name;
    var jQueryWindow = $(jQueryWindowName);
    if ( jQueryWindow ) {
        jQueryWindow.css( 'visibility', 'visible' );
        $( jQueryWindowName + " iframe" ).show();
    }
    var button = $( '#button-' + name );
    button.children( 'button' ).each( function( index ) {
        $(this).removeClass( 'btn-primary' );
        $(this).addClass( 'btn-success' );
    } );
}

function deleteWindow( name ) {
    var jQueryWindow = $( '#' + name );

    if ( jQueryWindow ) {
        jQueryWindow.remove();
    }

    $( '#button-'+name ).remove();
}

function shareDesktop( name ) {
    var appID = vwf_view.kernel.application();
    var clientID = vwf_view.kernel.moniker();
    vwf_view.kernel.callMethod( appID, "shareDesktop", { "moniker": clientID , "value": true } );
}


function resetPosition(name) {
    var jQueryWindow = $('#' + name);

    if ( jQueryWindow.data( 'originalOffset' ) ) {
        jQueryWindow.offset( jQueryWindow.data( 'originalOffset' ) );
    } else {
        jQueryWindow.offset( { top: 0, left: 0 } );
    }

    if ( jQueryWindow.data( 'originalSize' ) ) {
        jQueryWindow.width( jQueryWindow.data( 'originalSize' ).width ).height( jQueryWindow.data( 'originalSize' ).height );
    }
}

function remove(id) {
    return ( elem = document.getElementById(id) ).parentNode.removeChild( elem );
}  //@ sourceURL=vwfTaskbar.js