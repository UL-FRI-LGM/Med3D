/**
 * Created by Primoz on 9. 08. 2016.
 */

var assert = require('assert');
var mongodb = require('mongodb');
var fs = require('fs');

DatabaseManager = class {

    constructor(url, initDb) {
        var self = this;

        // Fetch client reference
        this._MongoClient = mongodb.MongoClient;

        // Database url
        this._url = url;

        // Paths
        this._objPath = "./database_init_resources/objects/";
        this._volPath = "./database_init_resources/mhd/";

        this._db = null;

        // Filters
        this._mhdFilter = function (value) {
            var splitted = value.split(".");
            return splitted[splitted.length - 1] === "mhd";
        };
        this._rawFilter = function (value) {
            var splitted = value.split(".");
            return splitted[splitted.length - 1] === "raw";
        };

        // Use connect method to connect to the Server
        this._MongoClient.connect(this._url, function (error, database) {
            assert.ifError(error);

            self._db = database;

            if (initDb) {
                self._initializeObjFiles(true);
                self._initializeMhdFiles(true);
            }
        });
    }

    _writeFile(path, name) {
        var bucket = new mongodb.GridFSBucket(this._db);

        fs.createReadStream(path).pipe(bucket.openUploadStream(name))
            .on('error', function (error) {
                assert.ifError(error);
            })
            .on('finish', function () {
                console.log("Inserted " + name + " in the database.");
            });
    };

    _removeFile(id, callback) {
        var self = this;

        // Delete chunks
        this._db.collection('fs.chunks').deleteMany({files_id: id}, function (error) {
            assert.ifError(error);

            // Delete file meta entry
            self._db.collection('fs.files').deleteOne({_id: id}, function (error) {
                assert.ifError(error);

                console.log("Successfully removed file with id: " + id);
                callback();
            });
        });
    };

    findFile(name, selector, callback) {
        this._db.collection('fs.files').findOne({filename: name}, selector, function (error, item) {
            assert.ifError(error);

            callback(item);
        });
    };

    _fetchFile(name, callback) {
        var chunks = [];

        var bucket = new mongodb.GridFSBucket(this._db);
        var downloadStream = bucket.openDownloadStreamByName(name);

        var data = "";
        // On new chunk
        downloadStream.on('data', function (chunk) {
            data += chunk.toString('binary');
        });

        // On error
        downloadStream.on('error', function (error) {
            callback({status: 1, msg: error.message}, null);
        });

        // On endstream
        downloadStream.on('end', function () {
            callback(null, data);
        });
    };

    fetchObjData(name, callback) {
        this._fetchFile(name, callback);
    };

    fetchMhdData(name, callback) {
        var self = this;

        var rawName = name.split(".")[0] + ".raw";

        // Fetch .mhd file
        self._fetchFile(name, function(mhdError, mhdData) {
            if (mhdError !== null) {
                callback(mhdError, null);
            }
            else {
                self._fetchFile(rawName, function (rawError, rawData) {
                    if (rawError !== null) {
                        callback(rawError, null);
                    }
                    callback(null, {mhd: mhdData, raw: rawData});
                });
            }
        })

    }

    fetchVolData(name, callback) {
        var prefix = name.split(".")[0];

        var volumeData = {
            mhd: null,
            raw: null
        };

        this._fetchFile(prefix + ".raw", function (error, data) {
            if (error !== null) {
                callback(error, null);
            }
            else {
                volumeData.raw = data;

                // Check if everything is loaded
                if (volumeData.mhd !== null) {
                    callback(null, data);
                }
            }
        });


        this._fetchFile(prefix + ".mhd", function (error, data) {
            if (error !== null) {
                callback(error, null);
            }
            else {
                volumeData.mhd = data;

                // Check if everything is loaded
                if (volumeData.raw !== null) {
                    callback(null, data);
                }
            }
        });
    }


    fetchMhdFilenames(callback) {
        var self = this;

        var filenames = [];
        var nameLookup = {};

        var cursor = this._db.collection('fs.files').find({filename: /.*\.mhd/}, {filename: 1, length: 1, uploadDate: 1});
        cursor.each(function (error, item) {
            assert.equal(error, null);

            if (item != null) {
                var fileItem = {name: item.filename, size: item.length, uploadDate: item.uploadDate};
                filenames.push(fileItem);
                nameLookup[fileItem.name.split(".")[0]] = fileItem;
            } else {
                // Add size of raw files object
                cursor = self._db.collection('fs.files').find({filename: /.*\.raw/}, {filename: 1, length: 1});

                cursor.each(function (error, item) {
                    assert.equal(error, null);

                    if (item != null) {
                        var correspondingFile = nameLookup[item.filename.split(".")[0]];
                        if (correspondingFile !== undefined) {
                            correspondingFile.size += item.length;
                        }

                    } else {
                        callback(filenames);
                    }
                });
            }
        });
    };

    fetchObjFilenames(callback) {

        var filenames = [];
        var cursor = this._db.collection('fs.files').find({filename: /.*\.obj/}, {filename: 1, length: 1, uploadDate: 1});
        cursor.each(function (error, item) {
            assert.equal(error, null);

            if (item != null) {
                filenames.push({name: item.filename, size: item.length, uploadDate: item.uploadDate});
            } else {
                callback(filenames);
            }
        });
    };


    _initializeObjFiles(overwrite) {
        var self = this;

        fs.readdir(self._objPath, function (error, objFiles) {
            assert.ifError(error);

            for (var i = 0; i < objFiles.length; i++) {
                // Generate file path
                let name = objFiles[i];
                let path = self._objPath + name;


                // Check if the file already exists.. If not write it to database.
                self.findFile(name, {_id: 1}, function (item) {
                    if (item !== null) {
                        if (overwrite) {
                            self._removeFile(item._id, function () {
                                self._writeFile(path, name);
                            });
                        }
                    }
                    else {
                        // Write file to the database
                        self._writeFile(path, name);
                    }
                });
            }
        });
    };

    _initializeMhdFiles (overwrite) {
        var self = this;

        fs.readdir(self._volPath, function (error, files) {
            assert.ifError(error);

            var mhdFiles = files.filter(self._mhdFilter);
            var rawFiles = files.filter(self._rawFilter);

            for (let i = 0; i < mhdFiles.length; i++) {
                let mhdName = mhdFiles[i];
                let rawName = rawFiles.find(function (value) {
                    return value.split(".")[0] === mhdName.split(".")[0];
                });

                if (rawName) {
                    let mhdPath = self._volPath + mhdName;
                    let rawPath = self._volPath + rawName;

                    // region Write raw file
                    // Check if the file already exists.. If not write it to database.
                    self.findFile(rawName, {_id: 1}, function (item) {
                        if (item !== null) {
                            if (overwrite) {
                                self._removeFile(item._id, function () {
                                    self._writeFile(rawPath, rawName);
                                });
                            }
                        }
                        else {
                            // Write file to the database
                            self._writeFile(rawPath, rawName);
                        }
                    });
                    // endregion

                    // Write mhd file
                    self.findFile(mhdName, {_id: 1}, function (item) {
                        if (item !== null) {
                            if (overwrite) {
                                self._removeFile(item._id, function () {
                                    self._writeFile(mhdPath, mhdName);
                                });
                            }
                        }
                        else {
                            // Write file to the database
                            self._writeFile(mhdPath, mhdName);
                        }
                    });
                    // endregion
                }
                else {
                    console.log("Could not find raw file match for file: " + mhdName);
                }
            }
        });
    };
};

module.exports = DatabaseManager;