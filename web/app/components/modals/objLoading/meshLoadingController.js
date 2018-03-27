/**
 * Created by Primoz on 20.7.2016.
 */

let meshLoadingController = function($scope, TaskManagerService) {

    $scope.serverFiles = [];

    TaskManagerService.addResultCallback("");

    $scope.formatBytes = function(bytes, decimals) {
        if(bytes === 0) return '0 B';
        let k = 1024;
        let sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    $scope.matchesAnyServerFile = function(substring) {
        return $scope.serverFiles.some(file => file.filename.toLowerCase().includes(substring.toLowerCase()));
    };

    $scope.requestFileListFromServer = function (onError) {
        $scope.serverFiles = [];

        $.ajax ({
            type: "POST",
            url: '/api/file-management',
            data: JSON.stringify({reqType: "objList"}),
            contentType: "application/json",
            success: function (jsonData) {
                if (jsonData !== undefined && jsonData.status === 0) {
                    $scope.$apply(function() {
                        for (let i = 0; i < jsonData.data.length; i++) {
                            let uploadDate = new Date(jsonData.data[i].uploadDate);
                            let strUpload = uploadDate.getDate() + ". " + (uploadDate.getMonth() + 1) + ". " + uploadDate.getFullYear();
                            let splitFilename = jsonData.data[i].name.split(".");

                            $scope.serverFiles.push({
                                filename: splitFilename[0],
                                suffix: '.' + splitFilename[1],
                                uploadDate: strUpload,
                                size: $scope.formatBytes(jsonData.data[i].size, 0)
                            });
                        }
                    });
                }
                else {
                    onError('Received error ' + jsonData.status + ' from the server.\nError message: ' + jsonData.errMsg);
                }
            },
            error: function() {
                onError('Failed to fetch files from the server.');
            }
        });
    };

    $scope.loadLocalObjFile = function (file) {
        // Create task
        let runnable = function (onLoad, onProgress, onError) {
            // Init .obj loader
            let objLoader = new M3D.ObjLoader();

            let privateOnLoad = function(data) {
                let group = new M3D.Group();

                for (let i = 0; i < data.length; i++) {
                    data[i].material = new M3D.MeshPhongMaterial();
                    data[i].material.specular = new THREE.Color("#444444");
                    data[i].material.color = new THREE.Color("#8A0707");
                    data[i].material.shininess = 8;

                    group.add(data[i]);
                }

                // Pass group to onLoad callback
                onLoad(group);
            };

            let privateOnProgress = function(event) {
                // Calculate finished percentage
                onProgress(event.loaded / event.total * 100);
            };

            let privateOnError = function () {
                onError({code: 1, msg: "Failed to load .obj file!"})
            };

            objLoader.loadFile(file, privateOnLoad, privateOnProgress, privateOnError);
        };

        let task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Wavefront OBJ loading",
                description: "Loading object from the specified file. The loaded object will be added to the scene when successfully loaded.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "ObjLoader",
            run: runnable,
            cancel: function () {/* TODO */}
        };

        TaskManagerService.enqueueNewTask(task)
    };

    $scope.loadServerObjFile = function (filename) {
        let runnable = function (onLoad, onProgress, onError) {
            // Init .obj loader
            let objLoader = new M3D.ObjLoader();

            $.ajax({
                xhr: function() {
                    let xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(event) {
                        if (event.lengthComputable) {
                            // Track downloading progress
                            onProgress(event.loaded / event.total * 100);
                        }
                    }, false);

                    xhr.addEventListener("progress", function(event) {
                        if (event.lengthComputable) {
                            // Track downloading progress
                            onProgress(event.loaded / event.total * 100);
                        }
                    }, false);

                    return xhr;
                },
                type: "POST",
                url: '/api/file-management',
                data: JSON.stringify({reqType: "objFile", filename: filename}),
                contentType: "application/json",
                error: function(request) {
                    onError({code: 1, msg: request.responseText});
                },
                success: function(res){
                    if (res.status === 0) {
                        let group = new M3D.Group();

                        try {
                            // Try to parse the response data
                            let data = objLoader.parse(res.data);

                            // Create objects group
                            for (let i = 0; i < data.length; i++) {
                                data[i].material = new M3D.MeshPhongMaterial();
                                data[i].material.specular = new THREE.Color("#444444");
                                data[i].material.color = new THREE.Color("#8A0707");
                                data[i].material.shininess = 8;

                                group.add(data[i]);
                            }

                        }
                        catch(e) {
                            onError({code: 2, msg: "Unknown parsing error."});
                            return;
                        }

                        // Pass group to onLoad callback
                        onLoad(group);
                    }
                    else {
                        onError({code: res.status, msg: res.errMsg})
                    }
                }
            });
        };

        let task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Downloading OBJ",
                description: "Downloading selected OBJ from the server. The loaded object will be added to the scene when successfully loaded.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "ObjLoader",
            run: runnable,
            cancel: function () {/* TODO */}
        };

        TaskManagerService.enqueueNewTask(task)
    }
};

app.controller('MeshLoadingController', meshLoadingController);