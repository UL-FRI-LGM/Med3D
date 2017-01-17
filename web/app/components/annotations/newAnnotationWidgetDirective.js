/**
 * Created by Primoz on 8. 08. 2016.
 */

app.directive("newAnnotationWidget", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            var contentElement = element.find('.modal-content');

            // Handle resizing
            contentElement.resizable({
                maxHeight: 300,
                minHeight: 115,
                maxWidth: 300,
                minWidth: 170
            });

            contentElement.resize(function () {
                scope.annotations.newAnnotation.windowPosition.offset = contentElement.offset();
                scope.annotations.newAnnotation.windowPosition.width = contentElement.width();
                scope.annotations.newAnnotation.windowPosition.height = contentElement.height();
            });

            // Handle dragging
            var onDrag = function () {
                scope.annotations.newAnnotation.windowPosition.offset = contentElement.offset();
            };

            element.draggable({
                handle: ".modal-header",
                start: onDrag,
                drag: onDrag,
                stop: onDrag
            });

            scope.$watch('annotations.newAnnotation', function(newValue, oldValue) {
                // Check if annotation is being created
                if (newValue !== undefined) {
                    if (!element.hasClass('in')) {
                        // Reset to center of the screen and toggle modal
                        element.css('left', ($(window).width() - 1000) / 2);
                        element.css('top', ($(window).height() - 1000) / 2);

                        // Display modal
                        element.modal();

                        // Initialize position parameters
                        scope.annotations.newAnnotation.windowPosition = {
                            offset: contentElement.offset(),
                            width: contentElement.width(),
                            height: contentElement.height(),
                        };
                    }
                }
                else {
                    element.modal('hide');
                }

            }, false);

            scope.closeNewAnnotation = function () {
                scope.annotations.newAnnotation = undefined;
            };

            scope.validateInput = function () {
                return scope.annotations.newAnnotation === undefined || scope.annotations.newAnnotation.title.length < 3 || scope.annotations.newAnnotation.content.length < 3;
            };

            scope.saveAnnotation = function () {
                // Fetch offset for modal positioning
                scope.annotations.newAnnotation.modalHolderPosition = element.offset();
                // Push created annotation
                scope.annotations.finishTextAnnotation();
            }
        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/newAnnotationWidget.html';
        }
    }
});