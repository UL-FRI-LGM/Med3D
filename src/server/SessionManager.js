/**
 * Created by Primoz on 15.6.2016.
 */

"use strict";
var Session = require("./Session.js");

var SessionManager = class {

    constructor() {
        this._sessions = {};
    }

    sessionExists(room) {
        return this._sessions.hasOwnProperty(room);
    }

    createNewSession(host, data) {
        // Check if this host already owns a session
        if (host in this._sessions) {
            return null;
        }

        var session = new Session(host);
        session.initialize(data);
        this._sessions[host] = session;

        return session;
    }

    updateSession(host, data) {
        var session = this._sessions[host];

        if (!session) {
            console.warn("Host tried updating the session without owning one!");
            return false;
        }

        if (data.updates) {
            if (data.updates.objects) {
                session.updateObjects(data.updates.objects);
            }

            if (data.updates.geometries) {
                session.updateGeometries(data.updates.geometries);
            }

            if (data.updates.materials) {
                session.updateMaterials(data.updates.materials);
            }

            if (data.updates.camera) {
                session.updateCamera(data.updates.camera);
            }
        }

        return true;
    }

    deleteSession(host) {
        delete this._sessions[host];
    }

    fetchSession(host) {
        return this._sessions[host];
    }
};

module.exports = SessionManager;