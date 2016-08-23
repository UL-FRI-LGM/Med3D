/**
 * Created by Primoz on 22. 08. 2016.
 */

app.directive("camerasSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {
            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);
        },
        templateUrl: function(element, attributes) {
            return 'app/components/cameras/camerasSidebar.html';
        }
    }
});