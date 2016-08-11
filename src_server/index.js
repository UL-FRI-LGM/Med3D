/**
 * Created by Primoz on 15.6.2016.
 */

var port = 8080;

var path = require('path');
var bodyParser = require('body-parser');
// Init express
var express = require('express');
var app = express();
// Init express path
app.use(express.static(path.resolve(__dirname + "\\..\\")));
app.use(bodyParser.json());

// Create server and link it to express
var server = require("http").createServer(app);
// Socket usage
var io = require("socket.io")(server);

// Init database
var DatabaseManager = require('./DatabaseManager');
var databaseManager = new DatabaseManager("mongodb://localhost:27017/med3d_db", true);

var SessionManager = require('./SessionManager');
var sessionManager = new SessionManager();

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


// Sockets
io.sockets.on('connection', function(socket) {
    console.log("Client connected");

    socket.on('session', function(request, callback) {
        if (request.type === "create") {
            console.log("Create session request");
            // Check data
            if (!request.data) {
                console.warn("Tried to create a new session without initial data!");
                return;
            }

            console.log("Socket id: " + socket.id.substring(2));
            var session = sessionManager.createNewSession(socket.id.substring(2), request.data);

            if (!session) {
                console.warn("This host already owns a session!");
                return;
            }

            socket.join(session.host);

            callback();
        }
        else if (request.type === "join") {
            console.log("Join session request");

            var session = sessionManager.fetchSession(request.sessionId);

            if (!session) {
                console.warn("Tried to create a new session without initial data!");
                socket.emit("connectResponse", {status: 1});
                return;
            }

            socket.join(request.sessionId);
            socket.emit("connectResponse", {status: 0, initialData: session.initialData});
        }
    });

    socket.on('sessionUpdate', function(request, callback) {
        var hostId = socket.id.substring(2);
        if (sessionManager.updateSession(hostId, request)) {
            socket.broadcast.to(hostId).emit('sessionUpdate', request);
        }
        
        callback();
    });

    socket.on('disconnect', function() {
        var hostId = socket.id.substring(2);

        if (sessionManager.fetchSession(hostId)) {
            socket.broadcast.to(hostId).emit('sessionTerminated');
            sessionManager.deleteSession(hostId);
        }
    });
});

server.listen(port);
console.log("Listening on port: ", port);
