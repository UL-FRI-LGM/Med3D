/**
 * Created by Primoz on 20. 08. 2016.
 */

let sharingController = function($scope, SharingService) {

    $scope.sharingService = SharingService;
    $scope.sharingSettings = SharingService.settings;
    $scope.sharingState = $scope.sharingService.state;

    $scope.startDataSharing = function (username, callback) {
        if (!$scope.sharingState.hostingInProgress) {
            $scope.sharingService.startHostingSession(username, function (event) {
                // Forward the event to the directive
                callback(event);
            });
        }
        else {
            callback({status: 1, msg: "Data is already being shared."});
        }
    };

    $scope.joinSession = function (username, uuid, callback) {
        if (!$scope.sharingState.listeningInProgress) {
            $scope.sharingService.joinSession(username, uuid, function (event) {
                // Forward the event to the directive
                callback(event);
            });
        }

        callback(null, {status: 1, msg: "Listening already in progress"})
    };


};

app.controller('SharingController', sharingController);