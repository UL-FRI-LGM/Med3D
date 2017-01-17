/**
 * Created by Primoz on 16. 01. 2017.
 */

app.factory('Annotations', function(){

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
            for (let listener in this._onChangeListeners) {
                if (this._onChangeListeners.hasOwnProperty(listener)) {
                    listener.add(jsonCompatibleAnnotation);
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
            for (let listener in this._onChangeListeners) {
                if (this._onChangeListeners.hasOwnProperty(listener)) {
                    listener.rm(index)
                }
            }
        };

        /**
         * Called when all of the text annotations need to be cleared.
         */
        this.clear = function () {
            self.list = [];

            // Notify subscribers
            for (let listener in this._onChangeListeners) {
                if (this._onChangeListeners.hasOwnProperty(listener)) {
                    listener.clear();
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
         * DRAWN ANNOTATIONS
         */
        // List of annotations drawn by users
        this.drawnAnnotationsList = [];

        // Contains index of currently selected annotation
        this.selectedDrawnAnnotation = undefined;
    })(this);
});