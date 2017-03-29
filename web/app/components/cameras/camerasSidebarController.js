/**
 * Created by Primoz on 22. 08. 2016.
 */

var camerasSidebarController = function($scope, PublicRenderData) {
    $scope.renderData = PublicRenderData;

    $scope.setActiveCam = function(camera) {
        let cameraManager = $scope.renderData.cameraManager;

        if (camera !== cameraManager.activeCamera) {
            cameraManager.setActiveCamera(camera);
        }
    }
};

app.controller('CamerasSidebarController', camerasSidebarController);