HUD = function() {
    this.initialize();
    return this;
}

HUD.prototype = {
    constructor: HUD,
    elements: undefined,
    elementCount: undefined,
    sortedElements: undefined,
    picks: undefined,
    canvas: undefined,
    visible: undefined,
    defaultHandlers: undefined,

    initialize: function() {
        var gameCanvas = document.getElementById( vwf_view.kernel.application() );
        this.elements = {};
        this.elementCount = 0;
        this.sortedElements = [];
        this.picks = [];
        this.canvas = document.createElement( "CANVAS" );
        this.canvas.id = "HUDCanvas";
        gameCanvas.parentElement.appendChild( this.canvas );
        this.visible = true;
        this.update();
        this.defaultHandlers = {};
        this.registerEventListeners( gameCanvas );
    },

    update: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if ( this.visible ) {
            this.draw();
        }
    },

    draw: function() {
        var context = this.canvas.getContext( '2d' );
        this.sortedElements.length = 0;

        for ( var el in this.elements ) {
            var element = this.elements[ el ];
            element.position.x = 0;
            element.position.y = 0;

            switch ( element.alignH ) {
                case "left":
                    element.position.x = 0;
                    break;
                case "center":
                    element.position.x = -element.width / 2;
                    element.position.x += this.canvas.width / 2;
                    break;
                case "right":
                    element.position.x = -element.width;
                    element.position.x += this.canvas.width;
                    break;
            }

            switch ( element.alignV ) {
                case "top":
                    element.position.y = 0;
                    break;
                case "middle":
                    element.position.y = -element.height / 2;
                    element.position.y += this.canvas.height / 2;
                    break;
                case "bottom":
                    element.position.y = -element.height;
                    element.position.y += this.canvas.height;
                    break;
            }

            element.position.x += element.offsetH;
            element.position.y += element.offsetV;

            if ( element.visible ) {
                this.sortedElements.push( element );
            }
        }

        this.globalPreDraw( context );
        this.sortedElements.sort( this.sortFunction );
        for ( var i = 0; i < this.sortedElements.length; i++ ) {
            this.elementPreDraw( context, this.sortedElements[ i ] );
            this.sortedElements[ i ].preDraw( context, this.sortedElements[ i ].position );
            this.sortedElements[ i ].draw( context, this.sortedElements[ i ].position );
            this.sortedElements[ i ].postDraw( context, this.sortedElements[ i ].position );
            this.elementPostDraw( context, this.sortedElements[ i ] );
        }
        this.globalPostDraw( context );

    },

    add: function( element, alignH, alignV, offsetH, offsetV ) {

        // Add the element to the HUD's elements list
        // Initialize the offset position
        this.elements[ element.id ] = element;
        var newElement = this.elements[ element.id ];
        
        newElement[ "offsetH" ] = isNaN( offsetH ) ? 0 : offsetH;
        newElement[ "offsetV" ] = isNaN( offsetV ) ? 0 : offsetV;
        
        newElement[ "position" ] = {
            "x": 0,
            "y": 0
        }

        switch ( alignH ) {
            case "left":
            case "center":
            case "right":
                newElement[ "alignH" ] = alignH;
                break;
            default:
                newElement[ "alignH" ] = "left";
                break;
        }

        switch ( alignV ) {
            case "top":
            case "middle":
            case "bottom":
                newElement[ "alignV" ] = alignV;
                break;
            default:
                newElement[ "alignV" ] = "top";
                break;
        }

        this.countElements();
        newElement[ "drawOrder" ] = this.elementCount;
    },

    sortFunction: function( a, b ) {
        return a.drawOrder - b.drawOrder;
    },

    remove: function( element ) {
        var index = this.elements[ element.id ].drawOrder;
        delete this.elements[ element.id ];

        for ( var el in this.elements ) {
            if ( this.elements[ el ].drawOrder > index ) {
                this.elements[ el ].drawOrder--;
            }
        }

        this.countElements();
    },

    countElements: function() {
        var count = 0;

        for ( var el in this.elements ) {
            count++;
        }

        this.elementCount = count;
    },

    pick: function( event ) {
        // Use sortedElements since they are all visible
        var elements = this.sortedElements;
        this.picks.length = 0;
        // Loop backward to order picks from nearest to furthest
        for ( var i = elements.length - 1; i >= 0; i-- ) {
            var pos = elements[ i ].position;
            var width = pos.x + elements[ i ].width;
            var height = pos.y + elements[ i ].height;

            if ( event.clientX > pos.x && event.clientX < width && 
                 event.clientY > pos.y && event.clientY < height ) {

                if ( elements[ i ].isMouseOver !== true ) {
                    elements[ i ].isMouseOver = true;
                    elements[ i ].onMouseOver( event );
                }
                this.picks.push( elements[ i ] );

            } else if ( elements[ i ].isMouseOver === true ) {
                elements[ i ].isMouseOver = false;
                elements[ i ].onMouseOut( event );
            }
        }
    },

    registerEventListeners: function( gameCanvas ) {
        var emptyEvent = function( event ) {};
        this.defaultHandlers.onClick = gameCanvas.onclick;
        gameCanvas.onclick = emptyEvent;
        gameCanvas.addEventListener( "click", this.handleEvent.bind( this ) );

        this.defaultHandlers.onMouseUp = gameCanvas.onmouseup;
        gameCanvas.onmouseup = emptyEvent;
        gameCanvas.addEventListener( "mouseup", this.handleEvent.bind( this ) );

        this.defaultHandlers.onMouseDown = gameCanvas.onmousedown;
        gameCanvas.onmousedown = emptyEvent;
        gameCanvas.addEventListener( "mousedown", this.handleEvent.bind( this ) );

        this.defaultHandlers.onMouseMove = gameCanvas.onmousemove;
        gameCanvas.onmousemove = emptyEvent;
        gameCanvas.addEventListener( "mousemove", this.handleEvent.bind( this ) );
    },

    handleEvent: function( event ) {
        this.pick( event );
        var topPick = this.picks[ 0 ];
        var type;

        switch ( event.type ) {
            case "click":
                type = "onClick";
                break;
            case "mouseup":
                type = "onMouseUp";
                break;
            case "mousedown":
                type = "onMouseDown";
                break;
            case "mousemove":
                type = "onMouseMove";
                break;
            default:
                console.log( "HUD.handleEvent - Unhandled event type: " + event.type );
                return;
        }

        if ( topPick ) {
            if ( topPick.enabled ) {
                this.elements[ topPick.id ][ type ]( event );
            }
        } else if ( this.defaultHandlers[ type ] instanceof Function ) {
            this.defaultHandlers[ type ]( event );
        }
    },

    moveToTop: function( id ) {
        var index = this.elements[ id ].drawOrder;
        for ( var el in this.elements ) {
            if ( this.elements[ el ].drawOrder > index ) {
                this.elements[ el ].drawOrder--;
            }
        }
        this.elements[ id ].drawOrder = this.elementCount;
    },

    // Draw instructions that occur prior to the element's preDraw
    //  and draw functions. Executes on each element in the HUD.
    elementPreDraw: function( context, element ) { },

    // Draw instructions that occur after the element's draw and
    //  postDraw functions. Executes on each element in the HUD.
    elementPostDraw: function( context, element ) { },

    // Draw instructions that occur before anything is drawn to
    //  the HUD.
    globalPreDraw: function( context ) { },

    // Draw instructions that occur after everything is drawn to
    //  the HUD.
    globalPostDraw: function( context ) { }

}

HUD.Element = function( id, drawFunc, width, height, visible ) {
    this.initialize( id, drawFunc, width, height );
    return this;
}

HUD.Element.prototype = {
    constructor: HUD.Element,
    id: undefined,
    width: undefined,
    height: undefined,
    isMouseOver: undefined,
    visible: undefined,
    enabled: undefined,

    initialize: function( id, drawFunc, width, height, visible ) {
        this.id = id;

        if ( drawFunc instanceof Function ) {
            this.draw = drawFunc;
        }

        this.width = isNaN( width ) ? 0 : width;
        this.height = isNaN( height ) ? 0 : height;

        if ( visible === true || visible === undefined ) {
            this.visible = true;
        } else {
            this.visible = false;
        }

        this.enabled = true;
    },

    // Draw instructions for the element. Executes after the HUD's
    //  elementPreDraw funtion and the element's preDraw function.
    draw: function( context, position ) { },

    // Draw instructions that execute just befor the element's
    //  draw function.
    preDraw: function( context, position ) { },

    // Draw instructions that execute immediately after the element's
    //  draw function.
    postDraw: function( context, position ) { },

    onClick: function( event ) { },

    onMouseDown: function( event ) { },

    onMouseUp: function( event ) { },

    onMouseMove: function( event ) { },

    onMouseOver: function( event ) { },

    onMouseOut: function( event ) { }

}