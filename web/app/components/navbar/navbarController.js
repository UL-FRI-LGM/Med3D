/**
 * Created by Primoz on 20. 08. 2016.
 */

var navbarController = function($scope, SharingService) {
    $scope.sharingService = SharingService;
    $scope.sharingState = $scope.sharingService.state;


    $scope.leaveSession = function (callback) {
        if ($scope.sharingState.listeningInProgress) {
            $scope.sharingService.leaveSession(function (event) {
                if (event.status === 0) {
                    $scope.$apply(function () {
                        $scope.sharingState.listeningInProgress = false;
                    });
                }

                // Forward the event to the directive
                callback(event);
            });
        }

        callback({status: 1, msg: "No active session"});
    };


    $scope.stopDataSharing = function (callback) {
        if ($scope.sharingState.hostingInProgress) {
            $scope.sharingService.stopHostingSession(function (event) {
                if (event.status === 0) {
                    $scope.$apply(function () {
                        $scope.sharingState.hostingInProgress = false;
                    });
                }

                // Forward the event to the directive
                callback(event);
            });
        }
        else {
            callback({status: 1, msg: "Data is not being shared."});
        }
    };

};

app.controller('NavbarController', navbarController);