/**
 * Created by Primoz on 20. 08. 2016.
 */


app.service("SharingService", function ($rootScope, PublicRenderData, Annotations, Messages) {

    let self = this;

    // Reference to render data and annotations
    this.renderData = PublicRenderData;
    this.annotations = Annotations;
    this.messages = Messages;

    // Sharing settings
    this.settings = {
        shareCamera: true,
        shareAnnotations: true
    };

    // State of the sharing service
    this.state = {
        hostingInProgress: false,
        listeningInProgress: false
    };

    // Data publisher
    this.dataPublisher = null;
    this.dataSubscriber = null;

    // region HELPER FUNCTIONS
    this._buildAnnotation = function (data) {
        let annotation = {
            title: data.title,
            content: data.content,
            windowPosition: {
                width: data.windowPosition.width,
                height: data.windowPosition.height,
                offset: {
                    left: ($(window).width() / 2 - data.windowPosition.width / 2),
                    top: ($(window).height() / 2 - data.windowPosition.height / 2) + 9 // TODO: Statically inserted min height
                }
            },
            modalHolderPosition: {
                left: (($(window).width() - 1000) / 2),
                top: (($(window).height() - 1000) / 2),
            },
            active: false
        };

        // Check if marker meta data is specified
        if (data.markerMeta !== undefined) {
            annotation.markerMeta = { position: (new THREE.Vector3()).fromArray(data.markerMeta.position), normal: (new THREE.Vector3()).fromArray(data.markerMeta.normal) };
        }

        return annotation;
    };

    // This function updates local annotations when it receives a request
    this._onSharedAnnotationsChange = function (request) {
        if (request.type === "add") {
            let newAnnotationsList = [];

            for (let i = 0; i < request.data.annotations.length; i++) {
                newAnnotationsList.push(self._buildAnnotation(request.data.annotations[i]));
            }


            $rootScope.$apply(function() {
                if (self.annotations.sharedList[request.userId] === undefined) {
                    self.annotations.sharedList[request.userId] = {ownerUsername: request.data.ownerUsername, list: newAnnotationsList};
                }
                else {
                    self.annotations.sharedList[request.userId].list = self.annotations.sharedList[request.userId].list.concat(newAnnotationsList);
                }
            });
        }
        else if (request.type === "rm") {
            $rootScope.$apply(function() {
                if (self.annotations.sharedList[request.userId] !== undefined) {
                    if (request.index === undefined) {
                        delete self.annotations.sharedList[request.userId];
                    }
                    else if (self.annotations.sharedList[request.userId].list.length > request.index) {
                        if (self.annotations.sharedList[request.userId].list.length <= 1) {
                            delete self.annotations.sharedList[request.userId];
                        }
                        else {
                            self.annotations.sharedList[request.userId].list.splice(request.index, 1);
                        }
                    }
                }
            });
        }
        else if (request.type === "clear") {
            $rootScope.$apply(function() {
                self.annotations.sharedList = {};
                self.annotations.list = [];
            });
        }
    };
    // endregion

    // region HOST FUNCTIONS
    this._setupHostAnnotationsSharing = function () {

        var setOnAnnotationChange = function() {
            // Setup change listener
            var onAdd = function (annotation) {
                if (self.dataPublisher !== null && self.settings.shareAnnotations) {
                    self.dataPublisher.miscRequestEmit("sessionAnnotations", {
                        type: "add",
                        annotations: [annotation]
                    }, function () {
                    });
                }
            };

            var onRm = function (index) {
                if (self.dataPublisher !== null && self.settings.shareAnnotations) {
                    self.dataPublisher.miscRequestEmit("sessionAnnotations", {
                        type: "rm",
                        index: index
                    }, function () {
                    });
                }
            };

            var onClear = function () {
                if (self.dataPublisher !== null) {
                    self.dataPublisher.miscRequestEmit("sessionAnnotations", {
                        type: "clear"
                    }, function () {});
                }
            };

            self.annotations.addListener("SharingService", onAdd, onRm, onClear);

            // Set shared annotations listener
            self.dataPublisher.setMiscListener("sessionAnnotations", self._onSharedAnnotationsChange);
        };

        return function () {
            if (self.dataPublisher !== null) {
                // If no active annotations or annotation sharing is disabled do not send init batch to the server
                if (self.annotations.list.length > 0 && self.settings.shareAnnotations) {
                    let request = {
                        type: "add",
                        annotations: self.annotations.toJson()
                    };

                    // Push the annotations to the server
                    self.dataPublisher.miscRequestEmit("sessionAnnotations", request, setOnAnnotationChange);
                }
                else {
                    setOnAnnotationChange();
                }
            }
        }
    }();

    this._setupHostChatSharing = function () {
        // Check if the data subscriber is alive
        if (this.dataPublisher !== null) {

            $rootScope.$apply(function() {
                self.messages.length = 0;
            });

            self.dataPublisher.setMiscListener("chat", function (message) {
                $rootScope.$apply(function() {
                    self.messages.push(message);
                });
            });
        }
    };

    this._setupHostCameraSharing = function () {
        if (self.settings.shareCamera) {
            self.dataPublisher.addCameras(self.renderData.cameraManager.ownCameras);
        }

        // On cameras change notify angular
        self.dataPublisher.setOnCamerasChange(function (cameras) {
            $rootScope.$apply(function() {
                self.renderData.cameraManager.setSharedCameras(cameras);

                let cameraManager = self.renderData.cameraManager;

                // Check if active camera was deleted
                if (!cameraManager.isOwnCamera(cameraManager.activeCamera) && cameraManager.isSharedCamera(cameraManager.activeCamera) == null) {
                    cameraManager.setActiveCamera(cameraManager.ownCameras[0]);
                }
            });
        });
    };

    this.startHostingSession = function (username, callback) {

        // Check if the render data is initialized
        if (self.renderData.contentRenderGroup === null) {
            callback({status: 1, msg: "Error: render data is not initialized!"});
            return
        }

        let sharedRootObjects = [self.renderData.contentRenderGroup];

        // Create new data publisher
        self.dataPublisher = new M3D.ScenePublisher(username, sharedRootObjects, function (event) {
            // If connected successfully
            if (event.status === 0) {
                // Setup camera sharing
                self._setupHostCameraSharing();

                // Check if annotation sharing is active
                self._setupHostAnnotationsSharing();
                self._setupHostChatSharing();

                callback(event);
            }
            // Something went wrong
            else {
                self.dataPublisher.stopPublishing();
                self.dataPublisher = null;
                callback(event);
            }
        });

        // Initiate publishing
        self.dataPublisher.startPublishing();
    };

    this.stopHostingSession = function (callback) {
        if (self.state.hostingInProgress && self.dataPublisher !== null) {
            // Clear annotations when session hosting stops
            self.dataPublisher.miscRequestEmit("sessionAnnotations", {
                type: "clear"
            }, function () {});

            self.dataPublisher.rmMiscListener("chat");
            self.dataPublisher.rmMiscListener("sessionAnnotations");

            $rootScope.$apply(function() {
                self.renderData.cameraManager.clearSharedCameras();
            });

            self.annotations.rmListener("SharingService");
            self.dataPublisher.stopPublishing();
            callback({"status": 0, msg: "Successfully stopped session hosting."});
        }

        self.dataPublisher = null;
    };
    // endregion

    // region CLIENT FUNCTIONS
    this._setupClientAnnotationSharing = function () {
        // Check if the data subscriber is alive
        if (this.dataSubscriber !== null) {
            // Form fetch request
            let request = {type: "fetch"};

            // Fetch annotations from the server
            this.dataSubscriber.miscRequestEmit("sessionAnnotations", request, function (response) {
                if (response.status === 0) {

                    // region PARSE ANNOTATIONS
                    var sharedAnnotations = {};

                    // Build annotations
                    for (var userId in response.data) {
                        var annotationList = [];
                        for (var i = 0; i < response.data[userId].list.length; i++) {
                            annotationList.push(self._buildAnnotation(response.data[userId].list[i]));
                        }

                        sharedAnnotations[userId] = {ownerUsername: response.data[userId].ownerUsername, list: annotationList};
                    }

                    // Set build annotations to shared list
                    $rootScope.$apply(function() {
                        self.annotations.sharedList = sharedAnnotations;
                    });
                    // endregion PARSE ANNOTATIONS

                    // region SETUP LOCAL ANNOTATIONS ON CHANGE LISTENER
                    // Check if annotation sharing is enabled
                    if (self.settings.shareAnnotations) {
                        let onAdd = function (annotation) {
                            if (self.dataSubscriber !== null) {
                                self.dataSubscriber.miscRequestEmit("sessionAnnotations", {
                                    type: "add",
                                    annotations: [annotation]
                                }, function () {
                                });
                            }
                        };

                        let onRm = function (index) {
                            if (self.dataSubscriber !== null) {
                                self.dataSubscriber.miscRequestEmit("sessionAnnotations", {
                                    type: "rm",
                                    index: index
                                }, function () {
                                });
                            }
                        };

                        self.annotations.addListener("SharingService", onAdd, onRm, function () {});
                    }
                    // endregion

                    // Listen on socket for annotation changes
                    self.dataSubscriber.setMiscListener("sessionAnnotations", self._onSharedAnnotationsChange);
                }
            });
        }
    };

    this._setupClientChatSharing = function () {
        // Check if the data subscriber is alive
        if (this.dataSubscriber !== null) {
            $rootScope.$apply(function() {
                self.messages.length = 0;
            });

            self.dataSubscriber.setMiscListener("chat", function (message) {
                $rootScope.$apply(function() {
                    self.messages.push(message);
                });
            });
        }
    };

    this._setupClientCameraSharing = function () {
        if (self.settings.shareCamera) {
            self.dataSubscriber.addCameras(self.renderData.cameraManager.ownCameras);
        }

        // On cameras change notify angular
        self.dataSubscriber.setOnCamerasChange(function (cameras) {
            // Check if active camera was deleted
            $rootScope.$apply(function() {
                self.renderData.cameraManager.setSharedCameras(cameras);

                let cameraManager = self.renderData.cameraManager;

                if (!cameraManager.isOwnCamera(cameraManager.activeCamera) && cameraManager.isSharedCamera(cameraManager.activeCamera) == null) {
                    cameraManager.setActiveCamera(cameraManager.ownCameras[0]);
                }

            });
        });
    };

    this.joinSession = function () {
        let callbackRef;

        let onConnected = function (status, rootObjects, cameras) {
            if (status === 0) {
                self.renderData.replaceRenderContent.apply(this, rootObjects);

                $rootScope.$apply(function() {
                    self.renderData.cameraManager.setSharedCameras(cameras);
                });

                self._setupClientCameraSharing();
                self._setupClientAnnotationSharing();
                self._setupClientChatSharing();
            }

            callbackRef({status: status});
        };

        let onTerminated = function () {
            self.leaveSession(function () {});
            $rootScope.$apply(function() {
                self.state.listeningInProgress = false;
            });
        };


        // Setup connection listener
        let listener = new M3D.SceneSubscriberListener(onConnected, onTerminated);

        return function (username, uuid, callback) {
            callbackRef = callback;

            // Subscribe to the given session
            self.dataSubscriber = new M3D.SceneSubscriber(username, listener);
            self.dataSubscriber.subscribe(uuid);
        }
    }();

    this.leaveSession = function (callback) {
        self.dataSubscriber.rmMiscListener("chat");
        self.dataSubscriber.rmMiscListener("sessionAnnotations");
        self.dataSubscriber.unsubscribe();
        self.annotations.rmListener("SharingService");

        // Delete shared annotations
        $rootScope.$apply(function() {
            self.annotations.sharedList = {};
        });

        // Delete shared cameras
        $rootScope.$apply(function() {
            self.renderData.cameraManager.clearSharedCameras();
        });

        self.dataSubscriber = null;

        callback({status: 0});
    };
    // endregion

    this.sendChatMessage = function(msg) {
        if (self.state.hostingInProgress && self.dataPublisher !== null) {
            self.dataPublisher.miscRequestEmit("chat", {
                sender: self.dataPublisher.getUsername(),
                message: msg
            });
        }
        else if (self.state.listeningInProgress && self.dataSubscriber !== null) {
            self.dataSubscriber.miscRequestEmit("chat", {
                sender: self.dataSubscriber.getUsername(),
                message: msg
            });
        }
    };

    // Call this from the main loop
    this.update = function () {
        if (self.state.hostingInProgress && self.dataPublisher !== null) {
            self.dataPublisher.update();
        }
        else if (self.state.listeningInProgress && self.dataSubscriber !== null) {
            self.dataSubscriber.update();
        }
    };


});