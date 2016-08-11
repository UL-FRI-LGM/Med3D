/**
 * Created by Primoz on 20.7.2016.
 */

app.directive("basicModal", function() {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {
            // Make modal draggable
            element.draggable({
                handle: ".modal-header"
            });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/modals/misc/' + attributes.type + 'Modal.html';
        }
    }
});