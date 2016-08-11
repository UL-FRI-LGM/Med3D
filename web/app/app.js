/**
 * Created by Primoz on 19.7.2016.
 */
var app = angular.module("med3d", []);

app.factory('Annotations', function(){

    /*
    {
        title:
        content:
        targetPosition:
        windowPosition
    }
     */
    return {
        getMaxZ: function () {
            var currentZ = 1000;

            return function () {
                return ++currentZ;
            }
        }(),
        list: [],
        newAnnotation: undefined
    };
});