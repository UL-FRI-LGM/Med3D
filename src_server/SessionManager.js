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

        // New objects, materials and geometries need to be processed before the updates
        if (data.newObjects) {
            if (data.newObjects.objects) {
                session.addObjects(data.newObjects.objects);
            }
            
            if (data.newObjects.materials) {
                session.addMaterials(data.newObjects.materials);
            }
            
            if (data.newObjects.geometries) {
                session.addGeometries(data.newObjects.geometries);
            }
        }
        
        // Process the updates
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