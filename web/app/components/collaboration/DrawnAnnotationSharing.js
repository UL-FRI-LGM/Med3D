/**
 * Created by Primoz on 24-May-17.
 */

DrawnAnnotationSharing = class {

    /**
     * Constructs new drawn annotation sharing controller.
     * @param annotations Global annotations service.
     */
    constructor(annotations) {
        let self = this;

        this._host = false;

        this.annotations = annotations;

        this.socketManager = M3D.SocketManager.instance;

        // region LOCAL UPDATE LISTENERS
        this._onAdd = function (annotation) {
            let data = {};
            data[annotation._uuid] = annotation.toJson();

            self.socketManager.emit("sessionDrawnAnnotations", {
                type: "add",
                annotations: data
            });
        };
        
        this._onRm = function (annotation) {
            self.socketManager.emit("sessionDrawnAnnotations", {
                type: "rm",
                uuid: annotation._uuid
            });
        };
        
        this._onClear = function () {
            self.socketManager.emit("sessionDrawnAnnotations", {
                type: "clear"
            });
        };
        
        this._onToggle = function () {
            
        };
        // region ENDREGION

        this.socketSubscriber = new M3D.SocketSubscriber();

        this.initSocketSubscriber();
    }

    initSocketSubscriber() {
        let self = this;

        this.socketSubscriber.addEventCallback("sessionDrawnAnnotations", function (request) {
            if (request.type === "update") {
                self.annotations.updateSharedDrawnAnnotations(request.userId, request.username, request.updates);
            }
            else if (request.type === "add") {
                self.annotations.addSharedDrawnAnnotations(request.data);
            }
            else if (request.type === "rm") {
                self.annotations.rmSharedDrawnAnnotation(request.userId, request.uuid);
            }
            else if (request.type === "clear") {
                self.annotations.clearSharedDrawnAnnotations();
            }
        });
    }


    startSharing(isHost) {
        this._host = isHost;
        if (isHost) {
            this.setupHost();
        }
        else {
            this.setupClient();
        }
    }

    stopSharing() {
        if (this._host) {
            this.socketSubscriber.emit("sessionDrawnAnnotations", {type: "clear"});
        }
        else {
            this.socketSubscriber.emit("sessionDrawnAnnotations", {type: "rm"});
        }

        // Clear the annotations and disown other user layers
        this.annotations.clearSharedDrawnAnnotations();
        this.annotations.disownSharedLayers();

        // Remove on change listeners
        this.annotations.rmListenerDrawnAnn("drawnAnnotationSharing");

        // Remove socket listener
        this.socketManager.rmSocketSubscriber(this.socketSubscriber);

        // Add change recorders to annotations
        this.annotations.rmChangeRecordersDA();
    }

    setupHost() {
        let request = { type: "add", annotations: this.annotations.drawnAnnotationsToJson()};

        // Add change recorders to annotations
        this.annotations.addChangeRecordersDA();

        // Upload initial data if there is any
        if (Object.keys(request.annotations).length > 0) {
            this.socketManager.emit("sessionDrawnAnnotations", request);
        }

        // Add drawn annotation listener
        this.annotations.addListenerDrawnAnn("drawnAnnotationSharing", this._onAdd, this._onRm, this._onClear, this._onToggle);

        this.socketManager.addSocketSubscriber(this.socketSubscriber);
    }

    setupClient() {
        let self = this;

        this.socketManager.emit("sessionDrawnAnnotations", {type: "fetch"}, function (initialData) {

            // Parse initial data
            self.annotations.addSharedDrawnAnnotations(initialData);

            // Add change recorders to annotations
            self.annotations.addChangeRecordersDA();

            // Add drawn annotation listener
            self.annotations.addListenerDrawnAnn("drawnAnnotationSharing", self._onAdd, self._onRm, function () {}, self._onToggle);

            self.socketManager.addSocketSubscriber(self.socketSubscriber);
        });
    }


    update() {
        let jsonUpdates = {};
        let annList = this.annotations.drawnAnnotationsList;

        // Merge updates into a single json file
        for (let i = 0; i < annList.length; i++) {
            if (annList[i].changeRecorder != null) {
                let changes = annList[i].changeRecorder.getAndClearChanges();
                if (changes != null) {
                    jsonUpdates[annList[i]._uuid] = changes;
                }
            }
        }

        if (Object.keys(jsonUpdates).length > 0) {
            this.socketManager.emit("sessionDrawnAnnotations", {type: "update", updates: jsonUpdates});
        }
    }
};