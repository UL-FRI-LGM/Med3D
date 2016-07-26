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


app.service("TaskManagerService", function () {
    var self = this;

    // Contains meta data for each task that was passed to the task manager until it is cleared
    this.tasks = {};

    // Queue for synchronized tasks
    this.synchronizedTasks = [];
    this.currentlyExecuting = false;

    // Map of available targets aka. subscribers to task results
    this.resultSubscribers = {};

    var executeNextTask = function () {
        setTimeout(function () {
            if (self.synchronizedTasks.length > 0) {
                // Fetch the next task in the queue
                var task = self.synchronizedTasks.shift();
                var taskMeta = self.tasks[task.uuid];
                // Get result subscribers array
                var resultSubscribers = self.resultSubscribers[task.target];

                // Listens for updates on task progress
                var onProgress = function(progress) {
                    if (taskMeta) {
                        taskMeta.progress = progress;
                    }
                };

                // Listens for the errors in the task execution
                var onError = function(event) {
                    if (taskMeta) {
                        taskMeta.errorCode = event.code;
                        taskMeta.errorMsg = event.msg;
                    }

                    // Move on to the next task
                    executeNextTask();
                };

                // Listens for the finish event
                var onLoad = function (result) {
                    taskMeta.finished = true;

                    // Forward the results to the result subscribers
                    if (resultSubscribers && resultSubscribers instanceof Array) {
                        for (var i = 0; i < resultSubscribers.length; i++) {
                            resultSubscribers[i](result);
                        }
                    }

                    // Move on to the next task
                    executeNextTask();
                };

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
                var resultSubscribers = self.resultSubscribers[task.target];

                // Listens for updates on task progress
                var onProgress = function(progress) {
                    if (taskMeta) {
                        taskMeta.progress = progress;
                    }
                };

                // Listens for the errors in the task execution
                var onError = function(event) {
                    if (taskMeta) {
                        taskMeta.errorCode = event.code;
                        taskMeta.errorMsg = event.msg;
                    }
                };

                // Listens for the finish event
                var onLoad = function (result) {
                    taskMeta.finished = true;

                    // Forward the results to the result subscribers
                    if (resultSubscribers && resultSubscribers instanceof Array) {
                        for (var i = 0; i < resultSubscribers.length; i++) {
                            resultSubscribers[i](result);
                        }
                    }
                };

                // Start the task
                task.run(onLoad, onProgress, onError);
            }, 0);
        }
    };
    
    this.addResultSubscriber = function (name, subscriber) {
        if (self.resultSubscribers[name] === undefined) {
            self.resultSubscribers[name] = [subscriber];
        }
        else {
            self.resultSubscribers[name].push(subscriber);
        }
    }
});