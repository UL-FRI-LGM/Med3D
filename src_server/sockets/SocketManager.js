/**
 * Created by Primoz Lavric on 20-May-17.
 */
const util = require('util')
let logDelimiter = "//////////////////////////////////////////////////////";

SocketManager = class {

    constructor() {
        // Database manager
        this.DatabaseManager = require('../database/DatabaseManager');
        // Session manager
        this.SessionManager = require('../session_management/SessionManager');

        this._socketOptions = {
            transports: ["websocket", "pooling"], // First try with websocket and if it fails fallback to pooling
            httpCompression: {threshold: 1024} // Compress the data when larger than 1024 bytes
        }
    }

    initialize(server) {
        let self = this;

        // Initialize sockets
        this.SocketIO = require("socket.io")(server, this._socketOptions);

        /**
         * Sets up on connection callback. This is called when a new socket connection is established with a client providing
         * us with a per client scope.
         */
        this.SocketIO.sockets.on('connection', function(socket) {
            // Data of the user connected to this socket
            let sessionId;
            let username;

            /**
             * User session creation or session joining handler. Based on the request it either creates a new session
             * or joins user into the session identified by unique ID.
             * REQUEST FORMAT:
             * {
             *     type: "create" when a user wants to create new session and "join" when a user wants to join the session,
             *     username: username of the request owner,
             *     data: session_initial_data (only present when type == "create"),
             *     sessionId: ID of the session to which a user wants to join (only present when type == "join")
             * }
             */
            socket.on('session', function(request, callback) {

                console.log(logDelimiter);

                if (request.type === "create") {
                    console.log("Received request to create session by user: " + request.username);
                    console.log("Socket protocol: " + socket.conn.transport.name);

                    // Check if the data is present
                    if (!request.data) {
                        console.warn("User tried to create a new session without initial data!");
                        return;
                    }

                    // Create a new session
                    let session = self.SessionManager.createNewSession(socket.id.substring(2), request.username, request.data);

                    // If the user already owns a session fallback (this should never happen)
                    if (!session) {
                        console.error("This host already owns a session!");
                        return;
                    }

                    // Store the session id and the username
                    sessionId = socket.id.substring(2);
                    username = request.username;
                    socket.join(session.host);

                    // Notify the user that session creation has finished
                    callback();
                }
                else if (request.type === "join") {
                    console.log("Received request to join session by user: " + request.username);

                    // Try to find the session to which user wants to join
                    let session = self.SessionManager.fetchSession(request.sessionId);

                    // Check if the requested session was found
                    if (!session) {
                        console.warn("User tried to join the session that does not exist!");
                        socket.emit("connectResponse", {status: 1});
                        return;
                    }

                    // Store the session id and the username
                    sessionId = request.sessionId;
                    username = request.username;

                    // Join the user into the session
                    socket.join(request.sessionId);
                    socket.emit("joinSessionResponse", {status: 0, initialData: session.initialData});
                }
            });

            /**
             * Chat handler. Forwards the messages to all of the users participating in the session.
             */
            socket.on('chat', function (request) {
                socket.broadcast.to(sessionId).emit('chat', request);
            });

            /**
             * Session data update handler. This is called by the host when the shared scene objects and parameters have
             * changed and need to be globally updated.
             */
            socket.on('sessionDataUpdate', function(request, callback) {
                let hostId = socket.id.substring(2);

                // Try to update the sessions data
                if (self.SessionManager.updateSessionData(hostId, request)) {
                    socket.broadcast.to(hostId).emit('sessionDataUpdate', request);
                }
                else {
                    console.log(logDelimiter);
                    console.error("Failed to update the session data!")
                }

                // Notify the user that the scene data has been successfully updated
                callback();
            });

            /**
             * Camera management handler. This can be called by any user participating in some session to manage the
             * owned cameras
             */
            socket.on('sessionCameras', function (request, callback) {

                /**
                 * ADD REQUEST:
                 * {
                 *      type: "add",
                 *      cameras: { uuid0: camera0, ... uuidN: cameraN }
                 * }
                 */
                if (request.type === "add") {
                    console.log(logDelimiter + "\nUser " + username + " added a new camera.");

                    // Add the new cameras to the session
                    self.SessionManager.addCamerasToSession(sessionId, socket.id.substring(2), username, request.cameras);

                    // Forward the new camera request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), data: {ownerUsername: username, list: request.cameras}};
                    socket.broadcast.to(sessionId).emit('sessionCameras', forward);
                    callback();
                }

                /**
                 * UPDATE REQUEST:
                 * {
                 *      type: "update",
                 *      updates: { uuid0: update0, ... uuidN: updateN },
                 *      newCameras: { uuid0: camera0, ... uuidN: cameraN }
                 * }
                 */
                else if (request.type === "update") {
                    // Update the cameras
                    self.SessionManager.updateSessionCameras(sessionId, socket.id.substring(2), request.updates);

                    // Add new cameras to the session
                    self.SessionManager.addCamerasToSession(sessionId, socket.id.substring(2), username, request.newCameras);

                    // Forward the camera update request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), timestamp: request.timestamp, updates: request.updates, data: {ownerUsername: username, list: request.newCameras}};
                    socket.broadcast.to(sessionId).emit('sessionCameras', forward);
                    callback();
                }

                /**
                 * REMOVE REQUEST:
                 * {
                 *      type: "rm",
                 *      uuid: "camera uuid", // If not specified all of the cameres belonging to this user will be removed.
                 * }
                 */
                else if (request.type === "rm") {
                    console.log(logDelimiter + "\nUser " + username + " removed a camera.");
                    // Remove the camera from the session
                    self.SessionManager.rmCameraFromSession(sessionId, socket.id.substring(2), request.uuid);

                    // Forward the camera removal request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), uuid: request.uuid};
                    socket.broadcast.to(sessionId).emit('sessionCameras', forward);
                    callback();
                }


                /**
                 * FETCH REQUEST:
                 * {
                 *      type: "fetch",
                 * }
                 */
                else if (request.type === "fetch") {
                    console.log(logDelimiter + "\nUser " + username + " fetched the cameras.");

                    // Fetch cameras and return them via callback
                    let cameras = self.SessionManager.fetchSessionCameras(sessionId, socket.id.substring(2));
                    callback({status: (cameras !== null) ? 0 : 1, data: cameras});
                }
            });

            /**
             * Session annotations handler. This can be called by any user participating in some session to manage the
             * owned annotations.
             */
            socket.on('sessionAnnotations', function (request, callback) {
                /**
                 * ADD REQUEST:
                 * {
                 *      type: "add",
                 *      annotations: [ annotation1 ... annotationN }
                 * }
                 */
                if (request.type === "add") {
                    console.log(logDelimiter + "\nUser " + username + " added new annotations.");

                    // Add the new annotations
                    self.SessionManager.addAnnotationsToSession(sessionId, socket.id.substring(2), username, request.annotations);

                    // Forward the new annotations request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), data: {ownerUsername: username, annotations: request.annotations}};
                    socket.broadcast.to(sessionId).emit('sessionAnnotations', forward);
                    callback();
                }

                /**
                 * REMOVE REQUEST:
                 * {
                 *      type: "rm",
                 *      index: int // If no index is given all the annotations belonging to this user will be removed
                 * }
                 */
                else if (request.type === "rm") {
                    console.log(logDelimiter + "\nUser " + username + " removed an annotation/s.");

                    self.SessionManager.rmSessionAnnotation(sessionId, socket.id.substring(2), request.index);

                    // Forward the remove request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), index: request.index};
                    socket.broadcast.to(sessionId).emit('sessionAnnotations', forward);
                    callback();
                }

                /**
                 * FETCH REQUEST:
                 * {
                 *      type: "fetch",
                 * }
                 */
                else if (request.type === "fetch") {
                    console.log(logDelimiter + "\nUser " + username + " fetched annotations.");

                    // Fetch the annotations of this session and return them via callback
                    let annotations = self.SessionManager.fetchSessionAnnotations(sessionId, socket.id.substring(2));
                    callback({status: (annotations !== null) ? 0 : 1, data: annotations});
                }


                /**
                 * FETCH REQUEST:
                 * {
                 *      type: "clear",
                 * }
                 */
                else if (request.type === "clear") {
                    // The clear request should only come from the session owner
                    if (socket.id.substring(2) !== sessionId) {
                        console.warn("User " + username + " who is not owner of this session tried to clear annotations!")
                        return;
                    }

                    console.log(logDelimiter + "\nUser " + username + " cleared the annotations.");

                    // Clear the session annotations
                    self.SessionManager.clearSessionAnnotations(sessionId);

                    // Forward the clear request to other session members
                    let forward = {type: request.type};
                    socket.broadcast.to(sessionId).emit('sessionAnnotations', forward);
                    callback();
                }
            });


            /**
             * Session drawn annotations handler. This can be called by any user participating in some session to manage the
             * owned drawn annotations.
             */
            socket.on('sessionDrawnAnnotations', function (request, callback) {
                /**
                 * ADD REQUEST:
                 * {
                 *      type: "add",
                 *      annotations: {uuid -> annotation}
                 * }
                 */
                if (request.type === "add") {
                    console.log(logDelimiter + "\nUser " + username + " added new drawn annotations.");

                    // Add the new annotations
                    self.SessionManager.addDrawnAnnotationsToSession(sessionId, socket.id.substring(2), username, request.annotations);

                    // Forward the new annotations request to other session members
                    let data = {};
                    data[socket.id.substring(2)] = {ownerUsername: username, annotations: request.annotations};
                    let forward = {type: request.type, data: data};
                    socket.broadcast.to(sessionId).emit('sessionDrawnAnnotations', forward);
                }

                /**
                 * REMOVE REQUEST:
                 * {
                 *      type: "rm",
                 *      index: int // If no index is given all the annotations belonging to this user will be removed
                 * }
                 */
                else if (request.type === "rm") {
                    console.log(logDelimiter + "\nUser " + username + " removed drawn annotation/s.");
                    self.SessionManager.rmSessionDrawnAnnotation(sessionId, socket.id.substring(2), request.uuid);

                    // Forward the remove request to other session members
                    let forward = {type: request.type, userId: socket.id.substring(2), uuid: request.uuid};
                    socket.broadcast.to(sessionId).emit('sessionDrawnAnnotations', forward);
                }

                /**
                 * FETCH REQUEST:
                 * {
                 *      type: "fetch",
                 * }
                 */
                else if (request.type === "fetch") {
                    console.log(logDelimiter + "\nUser " + username + " fetched annotations.");

                    // Fetch the annotations of this session and return them via callback
                    let annotations = self.SessionManager.fetchSessionDrawnAnnotations(sessionId, socket.id.substring(2));
                    callback((annotations === null) ? {} : annotations);
                }


                /**
                 * CLEAR REQUEST:
                 * {
                 *      type: "clear",
                 * }
                 */
                else if (request.type === "clear") {
                    // The clear request should only come from the session owner
                    if (socket.id.substring(2) !== sessionId) {
                        console.warn("User " + username + " who is not owner of this session tried to clear drawn annotations!")
                        return;
                    }

                    console.log(logDelimiter + "\nUser " + username + " cleared the drawn annotations.");

                    // Clear the session annotations
                    self.SessionManager.clearSessionDrawnAnnotations(sessionId);

                    // Forward the clear request to other session members
                    let forward = {type: request.type};
                    socket.broadcast.to(sessionId).emit('sessionDrawnAnnotations', forward);
                }

                /**
                 * UPDATE REQUEST
                 */
                else if (request.type === "update") {
                    self.SessionManager.updateSessionDrawnAnnotation(sessionId, socket.id.substring(2), request.updates);

                    let forward = {type: request.type, userId: socket.id.substring(2), username: username, updates: request.updates};
                    socket.broadcast.to(sessionId).emit('sessionDrawnAnnotations', forward);
                }
            });


            let stopSharing = function () {
                // If there is no session related data bound to this user stop here
                if (sessionId == null) {
                    return;
                }

                let clientId = socket.id.substring(2);

                // Leave the session room
                socket.leave(sessionId);

                // On disconnect clear all annotation data
                console.log("Removing " + username + " annotations.");
                // Remove own annotations
                self.SessionManager.rmSessionAnnotation(sessionId, socket.id.substring(2));
                socket.broadcast.to(sessionId).emit('sessionAnnotations', {type: "rm", userId: socket.id.substring(2)});

                // Remove own cameras
                self.SessionManager.rmCameraFromSession(sessionId, socket.id.substring(2));
                socket.broadcast.to(sessionId).emit('sessionCameras', {type: "rm", userId: socket.id.substring(2)});

                // If session owner terminate the session
                if (self.SessionManager.fetchSession(clientId)) {
                    console.log("Closing the session owned by " + username + ".");
                    // Clear all annotations
                    //socket.broadcast.to(clientId).emit('sessionAnnotations', {type: "clear"});
                    // Notify session terminated
                    socket.broadcast.to(clientId).emit('sessionTerminated');
                    // Delete session
                    self.SessionManager.deleteSession(clientId);
                }
            };

            socket.on('terminate', function () {
                console.log(logDelimiter + "\nUser " + username + " called terminate.");
                stopSharing();
            });

            /**
             * This is called when the client disconnects from the socket
             */
            socket.on('disconnect', function() {
                console.log(logDelimiter + "\nUser " + username + " disconnected.");
                stopSharing();

            });
        });
    }
};

const instance = new SocketManager();

module.exports = instance;