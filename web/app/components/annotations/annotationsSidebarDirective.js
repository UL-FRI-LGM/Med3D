/**
 * Created by Primoz on 6. 08. 2016.
 */

app.directive("annotationsSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // Enable tooltip
            element.find('[data-toggle="tooltip"]').tooltip();
            element.find('[data-toggle="popover"]').popover();

            // Configure scrollbar
            element.find('.mCustomScrollbar').mCustomScrollbar({ alwaysShowScrollbar: 1, updateOnContentResize: true});

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
                scope.annotations.newAnnotation = {title: "", content: "", active: true};
            };

            scope.rmAnnotation = function (index) {
                scope.annotations.removeTextAnnotation(index);
            };

            scope.toggleActive = function (index) {
                scope.annotations.list[index].active = !scope.annotations.list[index].active;
            };

            scope.toggleActiveShared = function (id, index) {
                scope.annotations.sharedList[id].list[index].active = !scope.annotations.sharedList[id].list[index].active;
            };

        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/annotationsSidebar.html';
        }
    }
});