/**
 * Created by Primoz on 6. 08. 2016.
 */

var annotationsSidebarController = function($scope, Annotations) {
    $scope.annotations = Annotations;
};

app.controller('AnnotationsSidebarController', annotationsSidebarController);