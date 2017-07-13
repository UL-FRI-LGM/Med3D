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

    this.drawnAnnotationSharing = new DrawnAnnotationSharing(Annotations);

    // region HOST FUNCTIONS
    this.startHostingSession = function (username, callback) {

        // Check if the render data is initialized
        if (PublicRenderData.contentRenderGroup === null) {
            callback({status: 1, msg: "Error: render data is not initialized!"});
            return
        }

        self.clearChat();

        // Fetch scene root objects
        let sharedRootObjects = [PublicRenderData.contentRenderGroup];

        // Create new data publisher
        self.sceneHost = new M3D.ScenePublisher(username, sharedRootObjects);

        // Initiate publishing
        self.sceneHost.startPublishing(null, function () {
            // Set hosting in progress flag
            $rootScope.$apply(function() {
                self.state.hostingInProgress = true;
            });

            // Setup camera collaboration
            self._setupCameraSharing(true);

            // Check if annotation collaboration is active
            self._setupHostAnnotationsSharing();

            self.drawnAnnotationSharing.startSharing(true);

            callback({status: 0, msg: "Successfully started hosting session."});
        });
    };

    this.stopHostingSession = function (callback) {
        if (self.state.hostingInProgress) {
            // Clear annotations when session hosting stops
            self.socketManager.emit("sessionAnnotations", {
                type: "clear"
            }, function () {});

            $rootScope.$apply(function() {
                PublicRenderData.cameraManager.clearSharedCameras();
            });

            Annotations.rmListener("SharingService");
            this.drawnAnnotationSharing.stopSharing();
            self.sceneHost.stopPublishing();

            self.socketManager.emit("terminate", "Client termination.");

            // Unset the hosting in progress flag
            $rootScope.$apply(function() {
                self.state.hostingInProgress = false;
            });

            self.sceneHost = null;
        }

        callback({"status": 0, msg: "Successfully stopped session hosting."});
    };
    // endregion

    // region CLIENT FUNCTIONS
    this.joinSession = function () {
        let callbackRef;

        let onConnected = function (status, rootObjects, cameras) {
            if (status === 0) {
                PublicRenderData.replaceRenderContent.apply(this, rootObjects);

                $rootScope.$apply(function() {
                    PublicRenderData.cameraManager.setSharedCameras(cameras);
                });

                // Set the listening in progress flag
                $rootScope.$apply(function() {
                    self.state.listeningInProgress = true;
                });

                self._setupCameraSharing(false);
                self._setupClientAnnotationSharing();
                self.drawnAnnotationSharing.startSharing(false);
            }

            callbackRef({status: status});
        };

        let onTerminated = function () {
            self.leaveSession(function () {});
            $rootScope.$apply(function() {
                self.leaveSession(null);
            });
        };

        let offsetDir = new THREE.Vector3(0.577, 0.577, 0.577);
        let onNewObject = function () {
            // Calculate content bounding sphere
            let contentSphere = PublicRenderData.contentRenderGroup.computeBoundingSphere();

            // Focus all of the cameras on the newly added object
            PublicRenderData.cameraManager.focusCamerasOn(contentSphere, offsetDir);
        };

        // Setup connection listener
        let listener = new M3D.SceneSubscriberListener(onConnected, onTerminated, onNewObject);

        return function (username, uuid, callback) {
            callbackRef = callback;

            // Clear the chat
            self.clearChat();

            // Subscribe to the given session
            self.sceneSubscriber = new M3D.SceneSubscriber(username, listener);
            self.sceneSubscriber.subscribe(uuid);
        }
    }();

    this.leaveSession = function (callback) {
        self.sceneSubscriber.unsubscribe();
        Annotations.rmListener("SharingService");
        this.drawnAnnotationSharing.stopSharing();

        self.socketManager.emit("terminate", "Client termination.");

        // Delete shared annotations
        $rootScope.$apply(function() {
            Annotations.sharedList = {};
        });

        // Delete shared cameras
        $rootScope.$apply(function() {
            PublicRenderData.cameraManager.clearSharedCameras();
        });

        self.sceneSubscriber = null;

        $rootScope.$apply(function() {
            self.state.listeningInProgress = false;
        });

        if (callback != null) {
            callback({status: 0});
        }
    };
    // endregion

    // region CAMERA SHARING
    this._setupCameraSharing = function (isHost) {
        let sharingManager = (isHost) ? self.sceneHost : self.sceneSubscriber;

        if (self.settings.shareCamera) {
            sharingManager.addCameras(PublicRenderData.cameraManager.ownCameras);
        }

        // On cameras change notify angular
        sharingManager.setOnCamerasChange(function (cameras) {
            $rootScope.$apply(function() {
                PublicRenderData.cameraManager.setSharedCameras(cameras);

                let cameraManager = PublicRenderData.cameraManager;

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
                    newAnnotationsList.push(Annotations.reconstructAnnotation(request.data.annotations[i]));
                }

                $rootScope.$apply(function () {
                    if (Annotations.sharedList[request.userId] === undefined) {
                        Annotations.sharedList[request.userId] = {
                            ownerUsername: request.data.ownerUsername,
                            list: newAnnotationsList
                        };
                    }
                    else {
                        Annotations.sharedList[request.userId].list = Annotations.sharedList[request.userId].list.concat(newAnnotationsList);
                    }
                });
            }
            else if (request.type === "rm") {
                $rootScope.$apply(function () {
                    if (Annotations.sharedList[request.userId] !== undefined) {
                        if (request.index === undefined) {
                            delete Annotations.sharedList[request.userId];
                        }
                        else if (Annotations.sharedList[request.userId].list.length > request.index) {
                            if (Annotations.sharedList[request.userId].list.length <= 1) {
                                delete Annotations.sharedList[request.userId];
                            }
                            else {
                                Annotations.sharedList[request.userId].list.splice(request.index, 1);
                            }
                        }
                    }
                });
            }
            else if (request.type === "clear") {
                $rootScope.$apply(function () {
                    Annotations.sharedList = {};
                    Annotations.list = [];
                });
            }
        }
    });

    // region ANNOTATION ON CHANGE CALLBACK FUNCTIONS
    let _onAddAnnotation = function (annotation) {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            self.socketManager.emit("sessionAnnotations", {
                type: "add",
                annotations: [annotation]
            }, function () {
            });
        }
    };

    let _onRmAnnotation = function (index) {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            self.socketManager.emit("sessionAnnotations", {
                type: "rm",
                index: index
            }, function () {
            });
        }
    };

    let _onClearAnnotations = function () {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
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
        // If no active annotations or annotation collaboration is disabled do not send init batch to the server
        if (Annotations.list.length > 0 && this.settings.shareAnnotations) {
            let request = {
                type: "add",
                annotations: Annotations.toJson()
            };

            // Push the annotations to the server
            self.socketManager.emit("sessionAnnotations", request, function() {
                Annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation, _onClearAnnotations);
            });
        }
        else {
            Annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation, _onClearAnnotations);
        }
    };

    /**
     * Fetches annotations form the server and then sets up the annotation listeners
     * @private
     */
    this._setupClientAnnotationSharing = function () {
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
                        annotationList.push(Annotations.reconstructAnnotation(response.data[userId].list[i]));
                    }

                    sharedAnnotations[userId] = {ownerUsername: response.data[userId].ownerUsername, list: annotationList};
                }

                // Set build annotations to shared list
                $rootScope.$apply(function() {
                    Annotations.sharedList = sharedAnnotations;
                });
                // endregion

                // Add listener for own annotations
                if (self.settings.shareAnnotations) {
                    Annotations.addListener("SharingService", _onAddAnnotation, _onRmAnnotation(), function () {});
                }
            }
        });
    };
    // endregion

    // region CHAT
    /**
     * Removes all the messages from the chat
     */
    this.clearChat = function () {
        $rootScope.$apply(function() {
            Messages.length = 0;
        });
    };

    /**
     * Sends a message to the recipient via server
     * @param msg Text message
     */
    this.sendChatMessage = function(msg) {
        if (self.state.hostingInProgress) {
            self.socketManager.emit("chat", { sender: self.sceneHost.getUsername(), message: msg });
        }
        else if (self.state.listeningInProgress) {
            self.socketManager.emit("chat", { sender: self.sceneSubscriber.getUsername(), message: msg });
        }
    };

    /**
     * Add callback to socket subscriber that listens for the incoming messages.
     */
    this.socketSubscriber.addEventCallback("chat", function (message) {
        if (self.state.hostingInProgress || self.state.listeningInProgress) {
            $rootScope.$apply(function () {
                Messages.push(message);
            });
        }
    });
    // endregion CHAT

    // Call this from the main loop
    this.update = function () {
        if (self.state.hostingInProgress && self.sceneHost !== null) {
            self.sceneHost.update();
            self.drawnAnnotationSharing.update();
        }
        else if (self.state.listeningInProgress && self.sceneSubscriber !== null) {
            self.sceneSubscriber.update();
            self.drawnAnnotationSharing.update();
        }
    };

});