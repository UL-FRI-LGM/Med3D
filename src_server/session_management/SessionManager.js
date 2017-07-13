/**
 * Created by Primoz on 15.6.2016.
 */

let Session = require("./Session.js");

// TODO: Document this ASAP

SessionManager = class {

    constructor() {
        this._sessions = {};
    }

    sessionExists(room) {
        return this._sessions.hasOwnProperty(room);
    }

    createNewSession(host, username, data) {
        // Check if this host already owns a session
        if (host in this._sessions) {
            return null;
        }

        let session = new Session(host, username);
        session.initialize(data);
        this._sessions[host] = session;

        return session;
    }

    updateSessionData(host, data) {
        let session = this._sessions[host];

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

    // CAMERAS
    addCamerasToSession(sessionID, userID, username, cameras) {
        let session = this._sessions[sessionID];

        if (session) {
            session.addCameras(userID, username, cameras)
        }
    }

    rmCameraFromSession(sessionID, userID, uuid) {
        let session = this._sessions[sessionID];

        if (session) {
            session.rmCamera(userID, uuid)
        }
    }

    updateSessionCameras(sessionID, userID, update) {
        let session = this._sessions[sessionID];

        if (session) {
            session.updateCameras(userID, update)
        }
    }

    fetchSessionCameras(sessionID, userID) {
        let session = this._sessions[sessionID];

        if (session) {
            return session.fetchCameras(userID)
        }

        return null;
    }

    // ANNOTATIONS
    addAnnotationsToSession(sessionID, userID, username, annotations) {
        let session = this._sessions[sessionID];

        if (session) {
            session.addAnnotations(userID, username, annotations)
        }
    }

    // If index not specified.. Remove all
    rmSessionAnnotation(sessionID, userID, index) {
        let session = this._sessions[sessionID];

        if (session) {
            session.rmAnnotation(userID, index)
        }
    }

    fetchSessionAnnotations(sessionID, userID) {
        let session = this._sessions[sessionID];

        if (session) {
            return session.fetchAnnotations(userID)
        }

        return null;
    }

    clearSessionAnnotations(sessionID) {
        let session = this._sessions[sessionID];

        if (session) {
            session.clearAnnotations();
        }
    }

    // DRAWN ANNOTATIONS
    addDrawnAnnotationsToSession(sessionID, userID, username, annotations) {
        let session = this._sessions[sessionID];

        if (session) {
            session.addDrawnAnnotations(userID, username, annotations)
        }
    }

    // If index not specified.. Remove all
    rmSessionDrawnAnnotation(sessionID, userID, uuid) {
        let session = this._sessions[sessionID];

        if (session) {
            session.rmDrawnAnnotation(userID, uuid)
        }
    }

    fetchSessionDrawnAnnotations(sessionID, userID) {
        let session = this._sessions[sessionID];

        if (session) {
            return session.fetchDrawnAnnotations(userID)
        }

        return null;
    }

    clearSessionDrawnAnnotations(sessionID) {
        let session = this._sessions[sessionID];

        if (session) {
            session.clearDrawnAnnotations();
        }
    }

    updateSessionDrawnAnnotation(sessionID, userID, updates) {
        let session = this._sessions[sessionID];

        if (session) {
            session.updateDrawnAnnotations(userID, updates);
        }
    }


    deleteSession(host) {
        delete this._sessions[host];
    }

    fetchSession(host) {
        return this._sessions[host];
    }

    fetchSessionsMeta() {
        let metaArray = [];
        for (let sessionId in this._sessions) {
            metaArray.push({sessionId: sessionId, ownerUsername: this._sessions[sessionId].ownerUsername})
        }

        return metaArray;
    }
};

const instance = new SessionManager();

module.exports = instance;