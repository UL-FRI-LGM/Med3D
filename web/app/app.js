/**
 * Created by Primoz on 19.7.2016.
 */
var app = angular.module("med3d", []);

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
        var self = this;

        this.currentZ = 1000;

        this.getMaxZ = function () {
            return ++this.currentZ;
        };

        // Event listener
        this._onChangeListener = null;

        this.setListener = function(onAdd, onRemove, onClear) {
            this._onChangeListener = {add: onAdd, rm: onRemove, clear: onClear};
        };

        this.rmListener = function () {
            this._onChangeListener = null;
        };

        this.list = [];
        this.sharedList = {};

        this.finishAnnotation = function () {
            this.list.push(this.newAnnotation);
            this.newAnnotation = undefined;

            // Notify listener
            if (this._onChangeListener !== null) {
                var annotation = this.list[this.list.length - 1];

                // Forward the data to the listener
                if (annotation.markerMeta !== undefined) {
                    this._onChangeListener.add({
                        title: annotation.title,
                        content: annotation.content,
                        windowPosition: { width: annotation.windowPosition.width, height: annotation.windowPosition.height },
                        markerMeta: { position: annotation.markerMeta.position.toArray(), normal: annotation.markerMeta.normal.toArray() }
                    })
                }
                else {
                    this._onChangeListener.add({
                            title: annotation.title,
                            content: annotation.content,
                            windowPosition: { width: annotation.windowPosition.width, height: annotation.windowPosition.height },
                    })
                }
            }
        };

        this.removeAnnotation = function (index) {
            this.list.splice(index, 1);

            // Notify listener
            if (this._onChangeListener !== null) {
                this._onChangeListener.rm(index)
            }
        };

        this.clear = function () {
            self.list = [];

            // Notify listeners
            if (self._onChangeListener !== null) {
                self._onChangeListener.clear()
            }
        };

        this.newAnnotation = undefined;

        this.toJson = function () {
            var annotations = [];

            for (var i = 0; i < this.list.length; i++) {
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
        }
    })(this);
});

app.factory('Messages', function(){

    /*
     {
     title:
     content:
     targetPosition:
     windowPosition
     }
     */
    return [];
});