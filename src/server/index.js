/**
 * Created by Primoz on 15.6.2016.
 */

var port = 8080;

// Init express
var express = require('express');
var app = express();
var path = require('path');
// Create server and link it to express
var server = require("http").createServer(app);
// Socket usage
var io = require("socket.io")(server);
// For debugging purposes
app.use(express.static(path.resolve(__dirname + "../../../")));

var SessionManager = require('./SessionManager');

var sessionManager = new SessionManager();


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
