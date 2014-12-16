
this.tick = function( time ) {
    this.updateVolume( [ 0, 0, 0 ] );
}

this.updateVolume = function( camerapos ) {

    var x = Vec3.distance( camerapos, this.parent.worldPosition );
    x = Math.max( 0, x );
    var v = this.volume;

    var vol = ( ( -x + v ) / ( v || 1 ) ) * ( ( -x + v ) / ( v || 1 ) );
    if( x > v ) { 
        vol = 0; 
    }
    this.volume = Math.max( Math.min( vol, 1 ), 0 ) * 100;                            

}
