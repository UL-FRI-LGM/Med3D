/**
 * Created by Primoz on 9. 08. 2016.
 */

let assert = require('assert');
let mongodb = require('mongodb');
let path = require('path');
let fs = require('fs');
let mkdirp = require('mkdirp');

DatabaseManager = class {

    constructor(url, initDb) {
        // Fetch client reference
        this._MongoClient = mongodb.MongoClient;

        // Url of the database
        this._url = null;

        // Mongo database reference
        this._db = null;

        // Paths to resource files
        this._objPath = "./database_init_resources/obj/";
        this._volPath = "./database_init_resources/mhd/";

        // Initialize filename filters
        this._mhdFilter = function (value) {
            let splitted = value.split(".");
            return splitted[splitted.length - 1] === "mhd";
        };

        this._rawFilter = function (value) {
            let splitted = value.split(".");
            return splitted[splitted.length - 1] === "raw";
        };
    }

    /**
     * Tries to connect to the Mongo database located on the given URL. This function also fills the database with resources
     * if the initDB flag is set to true.
     * @param url URL specifying the location of the Mongo database
     * @param initDB Flag specifying whether the database should be initialized
     */
    initialize(url, initDB) {
        let self = this;

        // Set the database reference
        this._url = url;

        // Connect to the Mongo database
        this._MongoClient.connect(this._url, function (error, database) {

            // Assert if there was a problem during connection establishing
            assert.ifError(error);

            // Store reference to the database
            self._db = database;

            // If initDB flag is set to true load .obj and .mhd files and store them into the database
            if (initDB) {
                self._loadObjFiles(true);
                self._loadMhdFiles(true);
            }
        });
    }

    _writeFile(path, name) {
        let bucket = new mongodb.GridFSBucket(this._db);

        fs.createReadStream(path).pipe(bucket.openUploadStream(name))
            .on('error', function (error) {
                assert.ifError(error);
            })
            .on('finish', function () {
                console.log("Inserted " + name + " in the database.");
            });
    };

    _removeFile(id, callback) {
        let self = this;

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

    _fetchFile(name, callback) {
        let chunks = [];

        let bucket = new mongodb.GridFSBucket(this._db);
        let downloadStream = bucket.openDownloadStreamByName(name);

        let data = "";
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

    _loadObjFiles(overwrite) {
        let self = this;

        // Create empty resource directories if they do not exist.
        mkdirp.sync(this._objPath);

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

    _loadMhdFiles (overwrite) {
        let self = this;

        // Create empty resource directories if they do not exist.
        mkdirp.sync(this._volPath);

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

    findFile(name, selector, callback) {
        this._db.collection('fs.files').findOne({filename: name}, selector, function (error, item) {
            assert.ifError(error);

            callback(item);
        });
    };

    fetchObjData(name, callback) {
        this._fetchFile(name, callback);
    };

    fetchMhdData(name, callback) {
        let self = this;

        let rawName = name.split(".")[0] + ".raw";

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
        let prefix = name.split(".")[0];

        let volumeData = {
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
        let self = this;

        let filenames = [];
        let nameLookup = {};

        let cursor = this._db.collection('fs.files').find({filename: /.*\.mhd/}, {filename: 1, length: 1, uploadDate: 1});
        cursor.each(function (error, item) {
            assert.equal(error, null);

            if (item != null) {
                let fileItem = {name: item.filename, size: item.length, uploadDate: item.uploadDate};
                filenames.push(fileItem);
                nameLookup[fileItem.name.split(".")[0]] = fileItem;
            } else {
                // Add size of raw files object
                cursor = self._db.collection('fs.files').find({filename: /.*\.raw/}, {filename: 1, length: 1});

                cursor.each(function (error, item) {
                    assert.equal(error, null);

                    if (item != null) {
                        let correspondingFile = nameLookup[item.filename.split(".")[0]];
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

        let filenames = [];
        let cursor = this._db.collection('fs.files').find({filename: /.*\.obj/}, {filename: 1, length: 1, uploadDate: 1});
        cursor.each(function (error, item) {
            assert.equal(error, null);

            if (item != null) {
                filenames.push({name: item.filename, size: item.length, uploadDate: item.uploadDate});
            } else {
                callback(filenames);
            }
        });
    };
};

const instance = new DatabaseManager();

module.exports = instance;