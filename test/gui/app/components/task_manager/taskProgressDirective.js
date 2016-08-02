/**
 * Created by Primoz on 30. 07. 2016.
 */

app.directive("taskProgressDirective", function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            currentTask: "="
        },
        link: function (scope, element, attributes) {

            // Make modal draggable
            element.draggable({
                handle: ".modal-header"
            });

            // Task changes
            scope.$watch("currentTask", function() {
                if (scope.currentTask === undefined) {
                    element.modal('hide');
                }
                else {
                    element.modal('show');
                }
            });

        },
        templateUrl: function(element, attributes) {
            return 'app/components/task_manager/taskProgressModal.html';
        }
    }
});