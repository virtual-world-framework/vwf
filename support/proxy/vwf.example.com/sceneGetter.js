// Copyright 2014 Lockheed Martin Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may 
// not use this file except in compliance with the License. You may obtain 
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software 
// distributed under the License is distributed on an "AS IS" BASIS, 
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and 
// limitations under the License.

this.findInScene = function( objName ) {
    if ( !this.scene ) {
        this.logger.errorx( "findInScene", "Scene  is undefined!" );
        return undefined;
    }

    var results = this.scene.find( "//" + objName );

    if ( results.length < 1 ) {
        this.logger.errorx( "findInScene", "Object '" + objName + 
                            "' not found" );
    } else if ( results.length > 1 ) {
        this.logger.warnx( "findInScene", "Multiple objects named '" + 
                           objName + "' found.  Names should really " +
                           "be unique... but we'll return the first one." );
    } 

    return results[ 0 ];
}

this.findTypeInScene = function( typeName ) {
    if (!this.scene) {
        this.logger.errorx( "findTypeInScene", "Scene  is undefined!" );
        return undefined;
    }

    var results = this.scene.find( ".//element(*,'" + typeName + "')" );

    if ( results.length < 1 ) {
        this.logger.errorx( "findTypeInScene", "Nothing found with type '" +
                            typeName + "'." );
    } else if ( results.length > 1 ) {
        this.logger.warnx( "findTypeInScene", "Multiple objects of type '" + 
                           typeName + "' found.  We'll return the first " +
                           "one." );
    }

    return results[ 0 ];
}

//@ sourceURL=http://vwf.example.com/sceneGetter.js
