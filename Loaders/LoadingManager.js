/**
 * Created by Primoz on 17.3.2016.
 * Source: Three.js
 */

/**
 * @param onLoad Function that will be called when the item finishes loading
 * @param onProgress Function that will be called on loading progress
 * @param onError Function that will be on loading error
 * @constructor Stores reference to passed functions and defines loader notification functions
 */

LoadingManager = function ( onLoad, onProgress, onError ) {

    // Store scope for nested functions
    var scope = this;

    var isLoading = false, itemsLoaded = 0, itemsTotal = 0;

    this.onStart = undefined;

    // Locally store given callback functions
    this.onLoad = onLoad;
    this.onProgress = onProgress;
    this.onError = onError;

    // Loaders should call this function to notify the observer that item started loading
    // This function may be called multiple times by same or different loader
    this.itemStart = function ( url ) {

        itemsTotal ++;

        if ( isLoading === false ) {

            if ( scope.onStart !== undefined ) {

                scope.onStart( url, itemsLoaded, itemsTotal );

            }

        }

        isLoading = true;

    };

    // Loaders should call this function to notify the observer that item finished loading
    // This function should be called by the same loader that started the loading
    this.itemEnd = function ( url ) {

        itemsLoaded ++;

        if ( scope.onProgress !== undefined ) {

            scope.onProgress( url, itemsLoaded, itemsTotal );

        }

        if ( itemsLoaded === itemsTotal ) {

            isLoading = false;

            if ( scope.onLoad !== undefined ) {

                scope.onLoad();

            }

        }

    };

    // Loaders should call this function to notify the observer that an error occurred during the loading
    this.itemError = function ( url ) {

        if ( scope.onError !== undefined ) {

            scope.onError( url );

        }

    };
};