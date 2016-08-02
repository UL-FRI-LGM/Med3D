/**
 * Created by Primoz on 20.7.2016.
 */

var settingController = function($scope, SettingsService) {

    // Pass through navigation toggles
    $scope.navigatorToggle = SettingsService.navigatorToggle;
};

app.controller('SettingsController', settingController);