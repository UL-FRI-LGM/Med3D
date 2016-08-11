/**
 * Created by Primoz on 6. 08. 2016.
 */

app.directive("annotationsSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {
            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // Enable tooltip
            element.find('[data-toggle="tooltip"]').tooltip();
            element.find('[data-toggle="popover"]').popover();

            // Toggle display tooltip and button enabling
            var newAnnotationButton = $("#newAnnotationButton");
            var newAnnotationButtonWrapper = newAnnotationButton.parent();

            scope.$watch('annotations.newAnnotation', function(newValue, oldValue) {
                // Check if annotation is being created
                if (newValue !== undefined) {
                    newAnnotationButtonWrapper.tooltip('enable');
                    newAnnotationButton.prop('disabled', true);
                }
                else {
                    newAnnotationButtonWrapper.tooltip('disable');
                    newAnnotationButton.prop('disabled', false);
                }
            }, false);

            // On click modify adding annotation value
            scope.addAnnotation = function () {
                scope.annotations.newAnnotation = {title: "", content: "", active: true, htmlPosition: {left: 0, top: 0}};
            };

            scope.rmAnnotation = function (index) {
                scope.annotations.list.splice(index, 1);
            };

            scope.toggleActive = function (index) {
                scope.annotations.list[index].active = !scope.annotations.list[index].active;
            }

        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/annotationsSidebar.html';
        }
    }
});