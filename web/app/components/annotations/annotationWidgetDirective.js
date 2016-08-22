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

            var onResize = function () {
                scope.current.windowPosition.offset = contentElement.offset();
                scope.current.windowPosition.width = contentElement.width();
                scope.current.windowPosition.height = contentElement.height();
            };

            contentElement.resize(onResize);

            // Handle dragging
            var onDrag = function () {
                scope.current.windowPosition.offset = contentElement.offset();
            };

            // Fetch offset when the modal is shown
            element.on('shown.bs.modal', function () {
                onResize();
            });

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


            element.offset(scope.current.modalHolderPosition);
            contentElement.width(scope.current.windowPosition.width);
            contentElement.height(scope.current.windowPosition.height);

            scope.minimize = function () {
                scope.current.active = false;
            };
        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/annotationWidget.html';
        }
    }
});