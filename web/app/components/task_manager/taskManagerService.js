/**
 * Created by Primoz on 21. 07. 2016.
 */

/*
TASK:
    - uuid
    - Meta data
        - Name, Icon, Description?
        - Execution: Synchronous, Asynchronous
        - Target
    - Task callback
        - Should implement onLoad, onProgress and onError callbacks
            - onLoad: returns results
            - onProgress format: 0 - 100%
            - onError format:
                - Error code
                - Error message
    - Cancel task callback

 var task = {
    uuid: "ExampleUniqueIdentificator"
    meta: {
        name: "ExampleName"
        icon: "Example/Icon/Path",
        description: "ExampleDescription"
    },
    synchronous: false/true,
    target: "exampleObjLoaded"
    run: function() {},
    cancel: function() {}
 }
 */


app.service("TaskManagerService", ['$rootScope', function ($rootScope) {
    var self = this;

    // Contains meta data for each task that was passed to the task manager until it is cleared
    this.tasks = {};

    // Queue for synchronized tasks
    this.synchronizedTasks = [];
    this.currentlyExecuting = false;

    var executeNextTask = function () {
        setTimeout(function () {
            if (self.synchronizedTasks.length > 0) {
                // Fetch the next task in the queue
                var task = self.synchronizedTasks.shift();
                var taskMeta = self.tasks[task.uuid];
                // Get result subscribers array
                var resultCallbacks = self.resultCallbacks[task.target];

                // Listens for updates on task progress
                var onProgress = function(progress) {
                    if (taskMeta) {
                        var roundedProgress = Math.round(progress);

                        if (roundedProgress !== taskMeta.progress) {
                            $rootScope.$apply(function () {
                                taskMeta.progress = roundedProgress;
                            });
                        }
                    }
                };

                // Listens for the errors in the task execution
                var onError = function(event) {
                    if (taskMeta) {
                        taskMeta.finished = true;
                        taskMeta.errorCode = event.code;
                        taskMeta.errorMsg = event.msg;
                        self.notifyTaskFinished(task.uuid);
                    }

                    // Move on to the next task
                    executeNextTask();
                };

                // Listens for the finish event
                var onLoad = function (...result) {
                    taskMeta.finished = true;
                    self.notifyTaskFinished(task.uuid);

                    // Forward the results to the result subscribers
                    if (resultCallbacks && resultCallbacks instanceof Array) {
                        for (var i = 0; i < resultCallbacks.length; i++) {
                            resultCallbacks[i](...result);
                        }
                    }

                    // Move on to the next task
                    executeNextTask();
                };

                self.notifyTaskExecuton(task.uuid);
                // Start the task
                task.run(onLoad, onProgress, onError);
            }
            else {
                // Mark execution as not in progress
                self.currentlyExecuting = false;
            }
        }, 0);
    };

    this.enqueueNewTask = function(task) {
        // Add new task meta data
        self.tasks[task.uuid] = {
            // Meta data
            name: task.meta.name,
            description: task.meta.description,
            icon: task.meta.icon,

            // Progress data
            progress: 0,
            finished: false,

            // Error data
            errorCode: 0, // 666 - reserved for canceled task
            errorMsg: "",

            // Task canceling
            cancel: task.cancel
        };

        self.notifyNewTask(task.uuid);

        // Should the task be executed synchronously
        if (task.synchronous) {
            // Add the received task to the queue
            self.synchronizedTasks.push(task);

            // If tasks are not being executed start executing
            if (!self.currentlyExecuting) {
                self.currentlyExecuting = true;
                executeNextTask();
            }
        }
        else {
            setTimeout(function () {
                var taskMeta = self.tasks[task.uuid];
                // Get result subscribers array
                var resultCallbacks = self.resultCallbacks[task.target];

                // Listens for updates on task progress
                var onProgress = function(progress) {
                    if (taskMeta) {
                        taskMeta.progress = progress;
                    }
                };

                // Listens for the errors in the task execution
                var onError = function(event) {
                    if (taskMeta) {
                        taskMeta.finished = true;
                        taskMeta.errorCode = event.code;
                        taskMeta.errorMsg = event.msg;

                        self.notifyTaskFinished(task.uuid);
                    }
                };

                // Listens for the finish event
                var onLoad = function (...result) {
                    taskMeta.finished = true;
                    self.notifyTaskFinished(task.uuid);

                    // Forward the results to the result subscribers
                    if (resultCallbacks && resultCallbacks instanceof Array) {
                        for (var i = 0; i < resultCallbacks.length; i++) {
                            resultCallbacks[i](...result);
                        }
                    }
                };

                // Start the task
                self.notifyTaskExecuton(task.uuid);
                task.run(onLoad, onProgress, onError);
            }, 0);
        }
    };

    // region Subscriber management
    // Map of available targets aka. subscribers to task results
    this.resultCallbacks = {};

    // Task change subscribers
    this.taskChangeCallbacks = [];

    this.addResultCallback = function (target, callback) {
        if (self.resultCallbacks[target] === undefined) {
            self.resultCallbacks[target] = [callback];
        }
        else {
            self.resultCallbacks[target].push(callback);
        }
    };

    this.rmResultCallback = function (target, callback) {
        var targetGroup = self.resultCallbacks[target];

        if (targetGroup !== undefined) {
            var i = targetGroup.indexOf(callback);
            if(i != -1) {
                targetGroup.splice(i, 1);
            }
        }
    };
    
    this.addTasksChangeCallback = function (onNewTask, onTaskExecution, onTaskFinished) {
        this.taskChangeCallbacks.push({onNewTask: onNewTask, onTaskExecution: onTaskExecution, onTaskFinished: onTaskFinished});
    };

    this.notifyNewTask = function (uuid) {
        for (var i = 0; i < self.taskChangeCallbacks.length; i++) {
            if (self.taskChangeCallbacks[i].onNewTask !== undefined) {
                self.taskChangeCallbacks[i].onNewTask(uuid);
            }
        }
    };

    this.notifyTaskExecuton = function (uuid) {
        for (var i = 0; i < self.taskChangeCallbacks.length; i++) {
            if (self.taskChangeCallbacks[i].onTaskExecution !== undefined) {
                self.taskChangeCallbacks[i].onTaskExecution(uuid);
            }
        }
    };

    this.notifyTaskFinished = function (uuid) {
        for (var i = 0; i < self.taskChangeCallbacks.length; i++) {
            if (self.taskChangeCallbacks[i].onTaskFinished !== undefined) {
                self.taskChangeCallbacks[i].onTaskFinished(uuid);
            }
        }
    };

    this.rmTaskSubscriber = function (callback) {
        var i = self.taskChangeCallbacks.indexOf(callback);
        if(i != -1) {
            self.taskChangeCallbacks.splice(i, 1);
        }
    };
    // endregion

}]);