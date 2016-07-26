/**
 * Created by Primoz on 19.7.2016.
 */

var NavigatorController = function($scope, InputService, SettingsService) {
    // Binds navigator rotation and translation vector to InputService
    $scope.translationValues = InputService.navigatorsInput.translation;
    $scope.rotationValues = InputService.navigatorsInput.rotation;

    // Binds navigator enabled/disabled settings to SettingsService
    $scope.navigatorToggle = SettingsService.navigatorToggle;

    // Resets navigator input to the default
    $(document).mouseup(function() {
        $scope.translationValues.set(0, 0, 0);
        $scope.rotationValues.set(0, 0, 0);
    });
};

app.controller('NavigatorController', NavigatorController);