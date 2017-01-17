/**
 * Created by Primoz on 6. 08. 2016.
 */

var annotationsSidebarController = function($scope, Annotations, PublicRenderData, InputService) {
    $scope.annotations = Annotations;
    $scope.publicRenderData = PublicRenderData;
};

app.controller('AnnotationsSidebarController', annotationsSidebarController);