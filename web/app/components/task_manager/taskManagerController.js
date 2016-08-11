/**
 * Created by Primoz on 30. 07. 2016.
 */

var taskManagerController = function($scope, TaskManagerService) {
    $scope.tasks = TaskManagerService.tasks;
    $scope.currentTask = undefined;

    var onNewTask = function (uuid) {
        console.log("New task");
    };

    var onTaskExecution = function (uuid) {
        $scope.$apply(function() {
            $scope.currentTask = TaskManagerService.tasks[uuid];
        });

    };

    var onTaskFinished = function (uuid, hasMore) {
        $scope.$apply(function() {
            $scope.currentTask = undefined;
        });
    };

    TaskManagerService.addTasksChangeCallback(onNewTask, onTaskExecution, onTaskFinished);

};

app.controller('TaskManagerController', taskManagerController);