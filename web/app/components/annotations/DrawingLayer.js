/**
 * Created by Primoz on 30. 01. 2017.
 */

DrawingLayer = class {

    constructor(title, owner = null) {

        // Unique identifier
        this._uuid = THREE.Math.generateUUID();

        this._title = title;

        /** Line representation of the drawing. This is a list of arrays where each sub-array represents a line that was
         drawn on the image */
        this._lines = [];

        /** Drawing layer texture */
        this._texture = new M3D.Texture();
        this._texture.applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

        this._isDisplayed = true;

        /** If null. Current user is the owner, otherwise the owner name is specified in this variable. */
        this._owner = owner;

        this._dirty = false;

        this._changeRecorder = null;
    }

    createChangeRecorder() {
        this._changeRecorder = new DrawingLayer.ChangeRecorder();
        return this._changeRecorder;
    }

    removeChangeRecorder() {
        this._changeRecorder = null;
    }

    /**
     * Creates new line entry with the given THREE.Vector2 Vector is converted to array for easier JSON packing.
     * @param {THREE.Vector2} point Starting point of the line
     * @param thickness Line thickness specified as float
     * @param hardness Line hardness specified as float
     * @param color Line color
     */
    createNewLineEntry(point, thickness, hardness, color) {
        let line = {
            uuid: THREE.Math.generateUUID(),
            points: point.toArray(),
            thickness: thickness,
            hardness: hardness,
            color: color.toArray()
        };

        this._lines.push(line);

        if (this._changeRecorder != null) {
            this._changeRecorder.onNewLine(line);
        }
    }

    addLinePoint(point) {
        Array.prototype.push.apply(this._lines[this._lines.length - 1]["points"], point.toArray());

        if (this._changeRecorder != null) {
            this._changeRecorder.onNewLinePoint(this._lines[this._lines.length - 1].uuid, point);
        }
    }

    undo() {
        if (this._lines.length > 0) {
            let line = this._lines.pop();
            this._dirty = true;

            if (this._changeRecorder != null) {
                this._changeRecorder.onRmLine(line.uuid);
            }
        }
    }

    toJson() {
        return {
            uuid: this._uuid,
            title: this._title,
            lines: this._lines
        }
    }

    static fromJson(json, owner) {
        let layer = new DrawingLayer(json.title, owner);
        layer._lines = json.lines;
        layer._uuid = json.uuid;
        layer._dirty = true;

        return layer;
    }

    update(updateData) {
        // Update layer title
        if (updateData.hasOwnProperty("title")) {
            this._title = updateData.title;
        }

        // Remove lines that were marked for removal
        let num = 0;

        if (updateData.hasOwnProperty("removedLines")) {
            for (let i = this._lines.length - 1; i >= 0; i--) {
                if (updateData.removedLines.indexOf(this._lines[i].uuid) > 0) {
                    this._lines.splice(i, 1);
                    num++;

                    if (num >= this._removedLines.length) {
                        break;
                    }
                }
            }
        }

        // Add new lines
        if (updateData.hasOwnProperty("newLines")) {
            Array.prototype.push.apply(this._lines, updateData.newLines);
        }

        // Add new line points
        num = 0;

        if (updateData.hasOwnProperty("newLinePoints")) {
            let numLinePoints = Object.keys(updateData.newLinePoints).length;

            for (let i = this._lines.length - 1; i >= 0; i--) {
                if (updateData.newLinePoints.hasOwnProperty(this._lines[i].uuid)) {
                    Array.prototype.push.apply(this._lines[i].points, updateData.newLinePoints[this._lines[i].uuid]);
                    num++;

                    if (num >= numLinePoints) {
                        break;
                    }
                }
            }

            // Mark as dirty for redraw
            this._dirty = true;
        }
    }

    get changeRecorder() { return this._changeRecorder; }
    get texture() { return this._texture; }
    get lines() { return this._lines; }
    get title() { return this._title; }
    get isDisplayed() { return this._isDisplayed; }
    get owner() { return this._owner; }
    get dirty() { return this._dirty; }

    set title(value) {
        this._title = value;
        if (this._changeRecorder != null) {
            this._changeRecorder.onTitleChange(value);
        }
    }
    set displayed(value) { this._isDisplayed = value; }
    set owner(value) { this._owner = value; }
    set dirty(value) { this._dirty = value; }
};

DrawingLayer.ChangeRecorder = class {

    constructor() {
        /**
         {
             title: "changed title",
             newLines: [],
             removedLines: [uuid],
             newLinePoints: {uuid -> points},
         }
         */
        this._changes = {};
    }

    onTitleChange(newTitle) {
        this._changes.title = newTitle;
    }

    onNewLine(line) {
        if (this._changes.hasOwnProperty("newLines")) {
            this._changes.newLines.push(line);
        }
        else {
            this._changes.newLines = [line];
        }
    }

    onRmLine(uuid) {
        // Check if the removed line is among the newly added lines
        if (this._changes.hasOwnProperty("newLines")) {
            for (let i = 0; i < this._changes.newLines.length; i++) {
                if (this._changes.newLines[i].uuid === uuid) {
                    this._changes.newLines.splice(i, 1);
                    return;
                }
            }
        }

        // If not mark it for removal
        if (this._changes.hasOwnProperty("removedLines")) {
            this._changes.removedLines.push(uuid);
        }
        else {
            this._changes.removedLines = [uuid];
        }
    }

    onNewLinePoint(lineUuid, point) {
        // Check if the targeted line is among the newly added lines
        if (this._changes.hasOwnProperty("newLines")) {
            for (let i = 0; i < this._changes.newLines.length; i++) {
                if (this._changes.newLines[i].uuid === lineUuid) {
                    Array.prototype.push.apply(this._changes.newLines[i].points, point.toArray());
                    return;
                }
            }
        }

        if (!this._changes.hasOwnProperty("newLinePoints")) {
            this._changes.newLinePoints = {};
        }

        if (this._changes.newLinePoints.hasOwnProperty(lineUuid)) {
            Array.prototype.push.apply(this._changes.newLinePoints[lineUuid], point.toArray());
        }
        else {
            this._changes.newLinePoints[lineUuid] = point.toArray();
        }
    }

    getAndClearChanges() {
        if (Object.keys(this._changes).length === 0) {
            return null;
        }

        // Clear and return the changes
        let tmp = this._changes;
        this._changes = {};

        return tmp;
    }
};