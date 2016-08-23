/**
 * Created by Primoz on 22. 08. 2016.
 */

var camerasSidebarController = function($scope, PublicRenderData) {
    $scope.renderData = PublicRenderData;

    $scope.setActiveCam = function(camera) {
        if (camera !== $scope.renderData.activeCamera) {
            $scope.renderData.setActiveCamera(camera);
        }
    }
};

app.controller('CamerasSidebarController', camerasSidebarController);