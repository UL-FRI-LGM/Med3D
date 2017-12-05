/**
 * Created by Primoz on 15.6.2016.
 */

let port = 8080;

let path = require('path');
let bodyParser = require('body-parser');
// Init express
let express = require('express');
let app = express();
// Init express path
app.use(express.static(path.resolve(__dirname + "/../")));
app.use(bodyParser.json());

// Create server and link it to express
let server = require("http").createServer(app);

// Init database manager singleton
let DatabaseManager = require('./database/DatabaseManager');
DatabaseManager.initialize('mongodb://localhost:27017/med3d_db', true);

// Init session manager singleton
let SessionManager = require('./session_management/SessionManager');

// Init socket manager singleton
let SocketManager = require('./sockets/SocketManager');
SocketManager.initialize(server);

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
                DatabaseManager.fetchObjFilenames(function (filelist) {
                    res.send({status: 0, data: filelist});
                });
                break;
            case "mhdList":
                DatabaseManager.fetchMhdFilenames(function (filelist) {
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
                DatabaseManager.fetchObjData(req.body.filename, function (error, data) {
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
                DatabaseManager.fetchMhdData(req.body.filename, function (error, data) {
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
                res.send({status: 0, data: SessionManager.fetchSessionsMeta()});
                break;
            default:
                res.send({status: 2, errMsg: "Unknown request type."});
                break;
        }
    }
});

server.listen(port);
console.log("Listening on port: ", port);
