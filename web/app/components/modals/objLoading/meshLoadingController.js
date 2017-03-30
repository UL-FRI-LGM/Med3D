/**
 * Created by Primoz on 20.7.2016.
 */

let meshLoadingController = function($scope, TaskManagerService) {

    TaskManagerService.addResultCallback("");

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

        var task = {
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