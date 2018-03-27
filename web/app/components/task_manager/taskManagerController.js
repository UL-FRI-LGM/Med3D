/**
 * Created by Primoz on 30. 07. 2016.
 */

let taskManagerController = function($scope, TaskManagerService) {
    $scope.tasks = TaskManagerService.tasks;
    $scope.taskEventListeners = [];

    let taskFinishedDelay;
    let startTimestamp;

    let onTaskExecution = function (uuid) {
        clearTimeout(taskFinishedDelay);
        startTimestamp = performance.now();
        $scope.currentTask = TaskManagerService.tasks[uuid];

        for (let i = 0; i < $scope.taskEventListeners.length; i++) {
            $scope.taskEventListeners[i].onTaskExecution();
        }
    };

    let onTaskFinished = function (uuid, hasMore) {
        let finishedTimestamp = performance.now();
        // Wait at least 2 seconds before hiding.
        if (!hasMore && (finishedTimestamp - startTimestamp) < 2000) {
            taskFinishedDelay = setTimeout(function() {
                for (let i = 0; i < $scope.taskEventListeners.length; i++) {
                    $scope.taskEventListeners[i].onTaskFinished();
                }
            }, 1000 - (finishedTimestamp - startTimestamp));
        }
        else {
            for (let i = 0; i < $scope.taskEventListeners.length; i++) {
                $scope.taskEventListeners[i].onTaskFinished();
            }
        }
    };

    TaskManagerService.addTasksChangeCallback(function (uuid) {}, onTaskExecution, onTaskFinished);
};

app.controller('TaskManagerController', taskManagerController);