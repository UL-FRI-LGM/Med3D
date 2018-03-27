/**
 * Created by Primoz on 30. 07. 2016.
 */

app.directive("taskProgressDirective", function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            currentTask: "=",
            taskEventListeners: "="
        },
        link: function (scope, element, attributes) {

            // Make modal draggable
            element.draggable({
                handle: ".modal-header"
            });

            // Task changes
            scope.taskEventListeners.push({
                onTaskExecution: function () {
                    element.modal('show');
                },
                onTaskFinished: function () {
                    element.modal('hide');
                }
            });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/task_manager/taskProgressModal.html';
        }
    }
});