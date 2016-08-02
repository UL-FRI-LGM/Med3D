/**
 * Created by Primoz on 20.7.2016.
 */

var meshLoadingController = function($scope, TaskManagerService) {

    $scope.loadObj = function (file) {
        // Create task
        var runnable = function (onLoad, onProgress, onError) {
            // Init .obj loader
            var objLoader = new M3D.ObjLoader();
    
            var privateOnLoad = function(data) {
                var group = new M3D.Group();
    
                for (var i = 0; i < data.length; i++) {
                    data[i].material = new M3D.MeshPhongMaterial();
                    data[i].material.specular = new THREE.Color("#777777");
                    data[i].material.color = new THREE.Color("#FF0000");
                    group.add(data[i]);
                }

                // Pass group to onLoad callback
                onLoad(group);
            };
    
            var privateOnProgress = function(event) {
                // Calculate finished percentage
                onProgress(event.loaded / event.total * 100);
            };

            var privateOnError = function () {
                onError({code: 1, msg: "Failed to load .obj file!"})
            };

            objLoader.loadFile(file, privateOnLoad, privateOnProgress, privateOnError);
        };

        var task = {
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
    }
};

app.controller('MeshLoadingController', meshLoadingController);