/**
 * Created by Primoz on 8. 08. 2016.
 */

app.directive("annotationWidget", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            annotations: "=",
            current: "="
        },
        link: function (scope, element, attributes) {

            var contentElement = element.find('.modal-content');

            // Initialize modal
            contentElement.resizable({
                maxHeight: 300,
                minHeight: 115,
                maxWidth: 300,
                minWidth: 170
            });

            contentElement.resize(function () {
                scope.current.position.offset = contentElement.offset();
                scope.current.position.width = contentElement.width();
                scope.current.position.height = contentElement.height();
            });

            // Handle dragging
            var onDrag = function () {
                scope.current.position.offset = contentElement.offset();
            };

            element.draggable({
                handle: ".modal-header",
                start: onDrag,
                drag: onDrag,
                stop: onDrag
            });

            // Z index handling
            element.css("z-index", scope.annotations.getMaxZ());
            element.find(".modal-content").mousedown(function () {
                element.css("z-index", scope.annotations.getMaxZ());
            });

            element.offset(scope.current.modalOffset);
            contentElement.width(scope.current.position.width);
            contentElement.height(scope.current.position.height);

            scope.minimize = function () {
                scope.current.active = false;
            };
        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/annotationWidget.html';
        }
    }
});