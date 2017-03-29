/**
 * Created by Primoz on 15.6.2016.
 */

var port = 8080;

var path = require('path');
var bodyParser = require('body-parser');
// Init express
let express = require('express');
let app = express();
// Init express path
app.use(express.static(path.resolve(__dirname + "\\..\\")));
app.use(bodyParser.json());

// Create server and link it to express
let server = require("http").createServer(app);
// Socket usage
let io = require("socket.io")(server);

// Init database
let DatabaseManager = require('./DatabaseManager');
let databaseManager = new DatabaseManager("mongodb://localhost:27017/med3d_db", true);

let SessionManager = require('./SessionManager');
let sessionManager = new SessionManager();

app.post('/api/file-management', function(req, res) {
    // Response will be json
    res.contentType('json');

    // Check if the request is correctly formed
    if (req.body === undefined || req.body.reqType === undefined) {
        res.send({status: 1, errMsg: "Badly formed request."});
    }
    else {
        switch(req.body.reqType) {
            case "objList":
                databaseManager.fetchObjFilenames(function (filelist) {
                    res.send({status: 0, data: filelist});
                });
                break;
            case "mhdList":
                databaseManager.fetchMhdFilenames(function (filelist) {
                    res.send({status: 0, data: filelist});
                });
                break;
            case "objFile":
                // Validate
                if (req.body.filename === undefined) {
                    res.send({status: 1, errMsg: "Badly formed request."});
                    return;
                }

                // Fetch data
                databaseManager.fetchObjData(req.body.filename, function (error, data) {
                    if (error !== null) {
                        res.send({status: error.status, errMsg: error.msg});
                    }
                    else {
                        res.send({status: 0, data: data});
                    }
                });
                break;
            case "mhdVolume":
                // Validate
                if (req.body.filename === undefined) {
                    res.send({status: 1, errMsg: "Badly formed request."});
                    return;
                }

                // Fetch data
                databaseManager.fetchMhdData(req.body.filename, function (error, data) {
                    if (error !== null) {
                        res.send({status: error.status, errMsg: error.msg});
                    }
                    else {
                        res.send({status: 0, data: data});
                    }
                });
                break;
            default:
                res.send({status: 2, errMsg: "Unknown request type."});
                break;
        }
    }
});

app.post('/api/session-info', function (req, res) {
    // Response will be json
    res.contentType('json');

    // Check if the request is correctly formed
    if (req.body === undefined || req.body.reqType === undefined) {
        res.send({status: 1, errMsg: "Badly formed request."});
    }
    else {
        switch (req.body.reqType) {
            case "active-list":
                res.send({status: 0, data: sessionManager.fetchSessionsMeta()});
                break;
            default:
                res.send({status: 2, errMsg: "Unknown request type."});
                break;
        }
    }


});


// Sockets
io.sockets.on('connection', function(socket) {
    let sessionId;
    let username;

    socket.on('session', function(request, callback) {

        console.log(socket.conn.transport.name);

        if (request.type === "create") {
            console.log("Create session request by user: " + request.username);

            // Check data
            if (!request.data) {
                console.warn("Tried to create a new session without initial data!");
                return;
            }

            console.log("Socket id: " + socket.id.substring(2));
            let session = sessionManager.createNewSession(socket.id.substring(2), request.username, request.data);

            if (!session) {
                console.warn("This host already owns a session!");
                return;
            }

            // Store session id
            sessionId = socket.id.substring(2);
            username = request.username;
            socket.join(session.host);

            // Notify the user that session creation has finished
            callback();
        }
        else if (request.type === "join") {
            console.log("Join session request by user: " + request.username);

            let session = sessionManager.fetchSession(request.sessionId);

            if (!session) {
                console.warn("Tried to create a new session without initial data!");
                socket.emit("connectResponse", {status: 1});
                return;
            }

            // Store session id
            sessionId = request.sessionId;
            username = request.username;
            socket.join(request.sessionId);
            socket.emit("connectResponse", {status: 0, initialData: session.initialData});
        }
    });

    socket.on('sessionDataUpdate', function(request, callback) {
        let hostId = socket.id.substring(2);
        if (sessionManager.updateSessionData(hostId, request)) {
            socket.broadcast.to(hostId).emit('sessionDataUpdate', request);
        }

        callback();
    });

    socket.on('sessionCameras', function (request, callback) {
        let forward;
        if (request.type === "add") {
            console.log(console.log(request.sessionId));

            sessionManager.addCamerasToSession(request.sessionId, socket.id.substring(2), username, request.cameras);

            // Forward new camera adding
            forward = {type: request.type, userId: socket.id.substring(2), data: {ownerUsername: username, list: request.cameras}};
            socket.broadcast.to(request.sessionId).emit('sessionCameras', forward);
        }

        else if (request.type === "update") {
            sessionManager.updateSessionCameras(request.sessionId, socket.id.substring(2), request.updates);

            // Forward to subscribers
            forward = {type: request.type, userId: socket.id.substring(2), timestamp: request.timestamp, updates: request.updates, data: {ownerUsername: username, list: request.newCameras}};
            socket.broadcast.to(request.sessionId).emit('sessionCameras', forward);
        }

        else if (request.type === "rm") {
            // Remove cameras
            sessionManager.rmCamerasFromSession(request.sessionId, socket.id.substring(2), request.uuid);

            // Forward to subscribers
            forward = {type: request.type, userId: socket.id.substring(2), uuid: request.uuid};
            socket.broadcast.to(request.sessionId).emit('sessionCameras', forward);
        }

        else if (request.type === "fetch") {
            console.log("Received fetch request!");

            // Fetch cameras and return them in the callback
            let cameras = sessionManager.fetchSessionCameras(request.sessionId, socket.id.substring(2));
            callback({status: (cameras !== null) ? 0 : 1, data: cameras});
        }

        callback();
    });

    socket.on('sessionAnnotations', function (request, callback) {
        let forward;

        if (request.type === "add") {
            sessionManager.addAnnotationsToSession(request.sessionId, socket.id.substring(2), username, request.data);

            // Forward to other listeners
            forward = {type: request.type, userId: socket.id.substring(2), data: {ownerUsername: username, list: request.data}};
            socket.broadcast.to(request.sessionId).emit('sessionAnnotations', forward);
        }
        else if (request.type === "rm") {
            sessionManager.rmSessionAnnotations(request.sessionId, socket.id.substring(2), request.index);

            // Forward to other listeners
            forward = {type: request.type, userId: socket.id.substring(2), index: request.index};
            socket.broadcast.to(request.sessionId).emit('sessionAnnotations', forward);
        }
        else if (request.type === "fetch") {
            let annotations = sessionManager.fetchSessionAnnotations(request.sessionId, socket.id.substring(2));
            callback({status: (annotations !== null) ? 0 : 1, data: annotations});
        }
        // Clear all of the data
        else if (request.type === "clear") {
            sessionManager.clearSessionAnnotations(request.sessionId);

            forward = {type: request.type};
            socket.broadcast.to(request.sessionId).emit('sessionAnnotations', forward);
        }

        callback();
    });

    socket.on('chat', function (request) {
        socket.broadcast.to(sessionId).emit('chat', request);
    });

    socket.on('disconnect', function() {
        let hostId = socket.id.substring(2);

        // On unexpected disconnect clear all annotation data
        if (sessionId !== undefined) {
            // Remove own annotations
            sessionManager.rmSessionAnnotations(sessionId, socket.id.substring(2));
            socket.broadcast.to(sessionId).emit('sessionAnnotations', {type: "rm", userId: socket.id.substring(2)});

            // Remove own cameras
            sessionManager.rmCamerasFromSession(sessionId, socket.id.substring(2));
            socket.broadcast.to(sessionId).emit('sessionCameras', {type: "rm", userId: socket.id.substring(2)});
        }

        if (sessionManager.fetchSession(hostId)) {
            // Clear all annotations
            socket.broadcast.to(hostId).emit('sessionAnnotations', {type: "clear"});
            // Notify session terminated
            socket.broadcast.to(hostId).emit('sessionTerminated');
            // Delete session
            sessionManager.deleteSession(hostId);
        }
    });
});

server.listen(port);
console.log("Listening on port: ", port);
