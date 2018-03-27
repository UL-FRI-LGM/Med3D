/**
 * Created by Primoz on 6. 08. 2016.
 */

let scenePropertiesController = function($scope, PublicRenderData) {
    $scope.renderData = PublicRenderData.contentRenderGroup;
};

app.controller('ScenePropertiesController', scenePropertiesController);