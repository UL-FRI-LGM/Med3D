/**
 * Created by Primoz on 19.7.2016.
 */
var app = angular.module("med3d", ['ngAnimate', 'pr.longpress']);


app.factory('Messages', function(){

    /*
     {
     title:
     content:
     targetPosition:
     windowPosition
     }
     */
    return [];
});


app.directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
            // to address @blesh's comment, set attribute value to 'false'
            // on blur event:
            element.bind('blur', function () {
                scope.$apply(model.assign(scope, false));
            });
        }
    };
}]);