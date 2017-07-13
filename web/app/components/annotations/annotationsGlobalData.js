/**
 * Created by Primoz on 16. 01. 2017.
 */

app.factory('Annotations', function($rootScope){

    /*
     {
     title:
     content:
     targetPosition:
     windowPosition
     }
     */
    return new(function() {
        let self = this;

        // Annotation window depth
        this.currentZ = 1000;

        // Annotation subscribers
        this._onChangeListeners = {};

        /**
         * Fetches maximum Z (used for window overlapping)
         * @returns {number} Current maximal Z
         */
        this.getMaxZ = function () {
            return ++this.currentZ;
        };

        /**
         * Add annotation subscriber (notifies the subscriber about new/removed annotations).
         * @param id Subscriber ID.
         * @param onAdd Function called when a new annotation is added.
         * @param onRemove Function called when an annotation is removed.
         * @param onClear Function called when all annotations are cleared.
         */
        this.addListener = function(id, onAdd, onRemove, onClear) {
            this._onChangeListeners[id] = {add: onAdd, rm: onRemove, clear: onClear};
        };

        /**
         * Removes the annotation subscriber with the given ID.
         * @param id subscriber ID.
         */
        this.rmListener = function (id) {
            delete this._onChangeListeners[id];
        };

        // Publicly available list of current user annotations
        // TODO: Do not publicly expose this variable. Write functions to handle accessing and changing of this variable.
        this.list = [];

        // Publicly available map that contains annotations created by other users in the session
        // TODO: Do not publicly expose this variable. Write functions to handle accessing and changing of this variable.
        this.sharedList = {};

        // Publicly available variable used for creating a new annotation.
        // TODO: Do not publicly expose this variable. Write functions to handle accessing and changing of this variable.
        this.newAnnotation = undefined;

        /**
         * Called when user finished the creation of text annotation
         */
        this.finishTextAnnotation = function () {
            this.list.push(this.newAnnotation);
            this.newAnnotation = undefined;

            // Notify listener
            let newAnnotation = this.list[this.list.length - 1];

            let jsonCompatibleAnnotation;

            // Write annotation in JSON compatible format
            if (newAnnotation.markerMeta !== undefined) {
                jsonCompatibleAnnotation = {
                    title: newAnnotation.title,
                    content: newAnnotation.content,
                    windowPosition: { width: newAnnotation.windowPosition.width, height: newAnnotation.windowPosition.height },
                    markerMeta: { position: newAnnotation.markerMeta.position.toArray(), normal: newAnnotation.markerMeta.normal.toArray() }
                };
            }
            else {
                jsonCompatibleAnnotation = {
                    title: newAnnotation.title,
                    content: newAnnotation.content,
                    windowPosition: { width: newAnnotation.windowPosition.width, height: newAnnotation.windowPosition.height },
                };
            }

            // Notify subscribers
            for (let listener in self._onChangeListeners) {
                if (self._onChangeListeners.hasOwnProperty(listener)) {
                    self._onChangeListeners[listener].add(jsonCompatibleAnnotation);
                }
            }
        };

        /**
         * Called when user requests to remove the text annotation.
         * @param index Index of the text annotation that is to be removed.
         */
        this.removeTextAnnotation = function (index) {
            this.list.splice(index, 1);

            // Notify subscribers
            for (let listener in self._onChangeListeners) {
                if (self._onChangeListeners.hasOwnProperty(listener)) {
                    self._onChangeListeners[listener].rm(index)
                }
            }
        };

        /**
         * Called when all of the text annotations need to be cleared.
         */
        this.clear = function () {
            self.list = [];
            self.sharedList = {};

            // Notify subscribers
            for (let listener in self._onChangeListeners) {
                if (self._onChangeListeners.hasOwnProperty(listener)) {
                    self._onChangeListeners[listener].clear();
                }
            }
        };


        /**
         * Packs all annotations as JSON compatible objects.
         * @returns {Array}
         */
        this.toJson = function () {
            let annotations = [];

            for (let i = 0; i < this.list.length; i++) {
                if (this.list[i].markerMeta !== undefined) {
                    annotations.push({
                        title: this.list[i].title,
                        content: this.list[i].content,
                        windowPosition: { width: this.list[i].windowPosition.width, height: this.list[i].windowPosition.height },
                        markerMeta: { position: this.list[i].markerMeta.position.toArray(), normal: this.list[i].markerMeta.normal.toArray() }
                    });
                }
                else {
                    annotations.push({
                        title: this.list[i].title,
                        content: this.list[i].content,
                        windowPosition: {width: this.list[i].windowPosition.width, height: this.list[i].windowPosition.height}
                    })
                }
            }

            return annotations;
        };

        /**
         * Reconstructs the annotation from the JSON
         * @param data
         * @returns
         */
        this.reconstructAnnotation = function (data) {
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


        /**
         * DRAWN ANNOTATIONS
         */
        this._drawnAnnOnChangeListeners = {};

        /**
         * Add drawn annotation subscriber (notifies the subscriber about new/removed annotations).
         * @param id Subscriber ID.
         * @param onAdd Function called when a new drawn annotation is added.
         * @param onRemove Function called when a drawn annotation is removed.
         * @param onClear Function called when all drawn annotations are cleared.
         */
        this.addListenerDrawnAnn = function(id, onAdd, onRemove, onClear, onToggle) {
            this._drawnAnnOnChangeListeners[id] = {add: onAdd, rm: onRemove, clear: onClear, toggle: onToggle};
        };

        /**
         * Removes the drawn annotation subscriber with the given ID.
         * @param id subscriber ID.
         */
        this.rmListenerDrawnAnn = function (id) {
            delete this._drawnAnnOnChangeListeners[id];
        };

        // List of annotations drawn by users
        this.drawnAnnotationsList = [];
        this.sharedDrawnAnnotations = {};

        // Contains index of currently selected annotation
        this.selectedDrawnAnnotation = undefined;

        this.changeRecording = false;

        /**
         * Adds a new drawn annotation
         * @param annotation
         */
        this.addDrawnAnnotation = function (annotation) {
            this.drawnAnnotationsList.push(annotation);
            this.selectedDrawnAnnotation = annotation;

            if (this.changeRecording) {
                annotation.createChangeRecorder();
            }

            // Notify subscribers
            for (let listener in self._drawnAnnOnChangeListeners) {
                if (self._drawnAnnOnChangeListeners.hasOwnProperty(listener)) {
                    self._drawnAnnOnChangeListeners[listener].add(annotation)
                }
            }
        };

        /**
         * Removes drawn annotation with the given index
         * @param index
         */
        this.rmDrawnAnnotation = function(index) {
            if (this.drawnAnnotationsList[index] === this.selectedDrawnAnnotation) {
                this.selectedDrawnAnnotation = undefined;
            }

            let annotation = this.drawnAnnotationsList[index];
            annotation.removeChangeRecorder();
            this.drawnAnnotationsList.splice(index, 1);

            // Notify subscribers
            for (let listener in self._drawnAnnOnChangeListeners) {
                if (self._drawnAnnOnChangeListeners.hasOwnProperty(listener)) {
                    self._drawnAnnOnChangeListeners[listener].rm(annotation)
                }
            }
        };

        /**
         * Selects/deselects the annotation
         */
        this.toggleDrawnAnnotationActive = function(annotation) {
            let isToggled = this.selectedDrawnAnnotation === annotation;

            if (isToggled) {
                this.selectedDrawnAnnotation = undefined;
            }
            else {
                this.selectedDrawnAnnotation = annotation;
            }

            // Notify subscribers
            for (let listener in self._drawnAnnOnChangeListeners) {
                if (self._drawnAnnOnChangeListeners.hasOwnProperty(listener)) {
                    self._drawnAnnOnChangeListeners[listener].toggle((isToggled) ? null : annotation._uuid);
                }
            }
        };


        /**
         * LAYERS
         */
        this.removeDrawingLayer = function(ann, layer) {
            ann.removeLayer(layer);
        };

        this.addDrawingLayer = function(ann) {
            ann.addLayer();
        };



        this.addChangeRecordersDA = function () {
            this.changeRecording = true;

            // Add change recorders
            for (let i = 0; i < this.drawnAnnotationsList.length; i++) {
                this.drawnAnnotationsList[i].createChangeRecorder();
            }
        };

        this.rmChangeRecordersDA = function () {
            this.changeRecording = false;

            // Remove change recorders
            for (let i = 0; i < this.drawnAnnotationsList.length; i++) {
                this.drawnAnnotationsList[i].removeChangeRecorder();
            }
        };

        this.disownSharedLayers = function () {
            for (let i = 0; i < this.drawnAnnotationsList; i++) {
                this.drawnAnnotationsList[i].disownLayers();
            }
        };

        /**
         * Exports drawn annotations to json
         */
        this.drawnAnnotationsToJson = function () {

            let annotationsJson = {
            };

            // Export annotations in json format
            for (let i = 0; i < this.drawnAnnotationsList.length; i++) {
                annotationsJson[this.drawnAnnotationsList[i]._uuid] = this.drawnAnnotationsList[i].toJson();
            }

            return annotationsJson;
        }

        /**
         * Drawn annotation socket handlers
         */
        this.addSharedDrawnAnnotations = function (data) {
            let self = this;

            for (let userId in data) {
                let owner = data[userId].ownerUsername;
                let annotationsJsonArr = data[userId].annotations;

                let annotationsArr = [];

                // Reconstruct annotations
                for (let annUuid in annotationsJsonArr) {
                    // TODO Add to object that allows fast referencing
                    annotationsArr.push(DrawnAnnotation.fromJson(annotationsJsonArr[annUuid], annUuid, owner));
                }

                $rootScope.$apply(function() {
                    if (self.sharedDrawnAnnotations.hasOwnProperty(userId)) {
                        Array.prototype.push.apply(self.sharedDrawnAnnotations[userId].annotations, annotationsArr);
                    }
                    else {
                        self.sharedDrawnAnnotations[userId] = {ownerUsername: owner, annotations: annotationsArr};
                    }
                });
            }
        };

        this.rmSharedDrawnAnnotation = function (userId, annotationUuid) {
            let self = this;

            if (this.sharedDrawnAnnotations.hasOwnProperty(userId)) {
                if (annotationUuid == null) {
                    // Delete all user entries
                    $rootScope.$apply(function() {
                        delete self.sharedDrawnAnnotations[userId];
                    });
                }
                else {
                    let annotations = this.sharedDrawnAnnotations[userId].annotations;

                    // Find and remove the annotation
                    for (let i = 0; i < annotations.length; i++) {
                        if (this.sharedDrawnAnnotations[userId].annotations[i]._uuid === annotationUuid) {
                            $rootScope.$apply(function() {
                                self.sharedDrawnAnnotations[userId].annotations.splice(i, 1);
                                if (self.sharedDrawnAnnotations[userId].annotations.length <= 0) {
                                    delete self.sharedDrawnAnnotations[userId];
                                }
                            });
                            return;
                        }
                    }
                }
            }

        };

        this.clearSharedDrawnAnnotations = function () {
            let self = this;

            $rootScope.$apply(function() {
                self.sharedDrawnAnnotations = {};
            });
        };

        this.updateSharedDrawnAnnotations = function (userId, owner, updates) {
            if (!this.sharedDrawnAnnotations.hasOwnProperty(userId)) {
                return;
            }

            let userAnnotations = this.sharedDrawnAnnotations[userId].annotations;

            $rootScope.$apply(function() {
                for (let annUuid in updates) {
                    for (let i = 0; i < userAnnotations.length; i++) {
                        if (userAnnotations[i]._uuid === annUuid) {
                            // Update annotation
                            userAnnotations[i].update(updates[annUuid], owner);
                            break;
                        }
                    }
                }
            });
        };

    })(this);
});