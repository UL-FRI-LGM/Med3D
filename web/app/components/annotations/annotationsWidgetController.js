/**
 * Created by Primoz on 6. 08. 2016.
 */

var annotationsWidgetController = function($scope, Annotations) {
    $scope.annotations = Annotations;
};

app.controller('AnnotationsWidgetController', annotationsWidgetController);