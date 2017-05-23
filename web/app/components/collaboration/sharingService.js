/**
 * Created by Primoz on 20. 08. 2016.
 */


app.service("SharingService", function ($rootScope, PublicRenderData, Annotations, Messages) {
    // This reference
    let self = this;

    // Socket manager
    this.socketManager = M3D.SocketManager.instance;
    this.socketManager.connectToServer();

    // Create new socket subscriber
    this.socketSubscriber = new M3D.SocketSubscriber();
    this.socketManager.addSocketSubscriber(this.socketSubscriber);

    // Reference to render data and annotations
    this.renderData = PublicRenderData;
    this.annotations = Annotations;
    this.messages = Messages;

    // Sharing settings
    this.settings = {
        shareCamera: true,
        shareAnnotations: true
    };

    // State of the collaboration service
    this.state = {
        hostingInProgress: false,
        listeningInProgress: false
    };

    // Data publisher
    this.sceneHost = null;
    this.sceneSubscriber = null;

    // region HOST FUNCTIONS
    this.startHostingSession = function (username, callback) {

        // Check if the render data is initialized
        if (self.renderData.contentRenderGroup === null) {
            callback({status: 1, msg: "Error: render data is not initialized!"});
            return
        }

        let sharedRootObjects = [self.renderData.contentRenderGroup];

        // Create new data publisher
        self.sceneHost = new M3D.ScenePublisher(username, sharedRootObjects);

        // If connected successfully
        // Setup camera collaboration
        self._setupCameraSharing(true);
        self.clearChat();

        // Check if annotation collaboration is active
        self._setupHostAnnotationsSharing();

        // Initiate publishing
        self.sceneHost.startPublishing(null, function () {
            callback({status: 0, msg: "Successfully started hosting session."});
        });
    };

    this.stopHostingSession = function (callback) {
        if (self.state.hostingInProgress && self.sceneHost !== null) {
            // Clear annotations when session hosting stops
            self.socketManager.emit("sessionAnnotations", {
                type: "clear"
            }, function () {});

            $rootScope.$apply(function() {
                self.renderData.cameraManager.clearSharedCameras();
            });

            self.annotations.rmListener("SharingService");
            self.sceneHost.stopPublishing();
            callback({"status": 0, msg: "Successfully stopped session hosting."});
        }

        self.sceneHost = null;
    };
    // endregion

    // region CLIENT FUNCTIONS
    this.joinSession = function () {
        let callbackRef;

        let onConnected = function (status, rootObjects, cameras) {
            if (status === 0) {
                self.renderData.replaceRenderContent.apply(this, rootObjects);

                $rootScope.$apply(function() {
                    self.renderData.cameraManager.setSharedCameras(cameras);
                });

                self._setupCameraSharing(false);
                self._setupClientAnnotationSharing();
                self.clearChat();
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
            self.sceneSubscriber = new M3D.SceneSubscriber(username, listener);
            self.sceneSubscriber.subscribe(uuid);
        }
    }();

    this.leaveSession = function (callback) {
        self.sceneSubscriber.unsubscribe();
        self.annotations.rmListener("SharingService");

        // Delete shared annotations
        $rootScope.$apply(function() {
            self.annotations.sharedList = {};
        });

        // Delete shared cameras
        $rootScope.$apply(function() {
            self.renderData.cameraManager.clearSharedCameras();
        });

        self.sceneSubscriber = null;

        callback({status: 0});
    };
    // endregion

    // region CAMERA SHARING
    this._setupCameraSharing = function (isHost) {
        let sceneManager = (isHost) ? self.sceneHost : self.sceneSubscriber;

        if (self.settings.shareCamera) {
            sceneManager.addCameras(self.renderData.cameraManager.ownCameras);
        }

        // On cameras change notify angular
        sceneManager.setOnCamerasChange(function (cameras) {
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
    // endregion

    // region ANNOTATIONS
    this.socketSubscriber.addEventCallback("sessionAnnotations", function (request) {
        // Check if we are participating in a session
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            if (request.type === "add") {
                let newAnnotationsList = [];

                for (let i = 0; i < request.data.annotations.length; i++) {
                    newAnnotationsList.push(self.annotations.reconstructAnnotation(request.data.annotations[i]));
                }

                $rootScope.$apply(function () {
                    if (self.annotations.sharedList[request.userId] === undefined) {
                        self.annotations.sharedList[request.userId] = {
                            ownerUsername: request.data.ownerUsername,
                            list: newAnnotationsList
                        };
                    }
                    else {
                        self.annotations.sharedList[request.userId].list = self.annotations.sharedList[request.userId].list.concat(newAnnotationsList);
                    }
                });
            }
            else if (request.type === "rm") {
                $rootScope.$apply(function () {
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
                $rootScope.$apply(function () {
                    self.annotations.sharedList = {};
                    self.annotations.list = [];
                });
            }
        }
    });

    // region ANNOTATION ON CHANGE CALLBACK FUNCTIONS
    let _onAddAnnotation = function (annotation) {
        if (self.sceneSubscriber !== null) {
            self.socketManager.emit("sessionAnnotations", {
                type: "add",
                annotations: [annotation]
            }, function () {
            });
        }
    };

    let _onRmAnnotation = function (index) {
        if (self.sceneSubscriber !== null) {
            self.socketManager.emit("sessionAnnotations", {
                type: "rm",
                index: index
            }, function () {
            });
        }
    };

    let _onClearAnnotations = function () {
        if (self.sceneHost !== null) {
            self.socketManager.emit("sessionAnnotations", {
                type: "clear"
            }, function () {});
        }
    };
    // endregion

    /**
     * Uploads own annotation and then sets up the annotation listeners
     * @private
     */
    this._setupHostAnnotationsSharing = function () {
        if (this.state.listeningInProgress || this.state.hostingInProgress) {
            // If no active annotations or annotation collaboration is disabled do not send init batch to the server
            if (this.annotations.list.length > 0 && this.settings.shareAnnotations) {
                let request = {
                    type: "add",
                    annotations: this.annotations.toJson()
                };

                // Push the annotations to the server
                self.socketManager.emit("sessionAnnotations", request, function() {
                    self.annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation, _onClearAnnotations);
                });
            }
            else {
                this.annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation, _onClearAnnotations);
            }
        }
    };

    /**
     * Fetches annotations form the server and then sets up the annotation listeners
     * @private
     */
    this._setupClientAnnotationSharing = function () {
        // Check if the data subscriber is alive
        if (this.state.listeningInProgress || this.state.hostingInProgress) {
            // Form fetch request
            let request = {type: "fetch"};

            // Fetch annotations from the server
            this.socketManager.emit("sessionAnnotations", request, function (response) {
                if (response.status === 0) {
                    // region PARSE ANNOTATIONS
                    let sharedAnnotations = {};

                    // Build annotations
                    for (let userId in response.data) {
                        let annotationList = [];
                        for (let i = 0; i < response.data[userId].list.length; i++) {
                            annotationList.push(self.annotations.reconstructAnnotation(response.data[userId].list[i]));
                        }

                        sharedAnnotations[userId] = {ownerUsername: response.data[userId].ownerUsername, list: annotationList};
                    }

                    // Set build annotations to shared list
                    $rootScope.$apply(function() {
                        self.annotations.sharedList = sharedAnnotations;
                    });
                    // endregion

                    // Add listener for own annotations
                    if (self.settings.shareAnnotations) {
                        self.annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation(), function () {});
                    }
                }
            });
        }
    };
    // endregion

    // region CHAT
    /**
     * Removes all the messages from the chat
     */
    this.clearChat = function () {
        $rootScope.$apply(function() {
            self.messages.length = 0;
        });
    };

    /**
     * Sends a message to the recipient via server
     * @param msg Text message
     */
    this.sendChatMessage = function(msg) {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            self.socketManager.emit("chat", { sender: self.sceneHost.getUsername(), message: msg });
        }
    };

    /**
     * Add callback to socket subscriber that listens for the incoming messages.
     */
    this.socketSubscriber.addEventCallback("chat", function () {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            $rootScope.$apply(function () {
                self.messages.push(message);
            });
        }
    });
    // endregion CHAT

    // Call this from the main loop
    this.update = function () {
        if (self.state.hostingInProgress && self.sceneHost !== null) {
            self.sceneHost.update();
        }
        else if (self.state.listeningInProgress && self.sceneSubscriber !== null) {
            self.sceneSubscriber.update();
        }
    };

});