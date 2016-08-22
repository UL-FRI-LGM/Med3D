/**
 * Created by Primoz on 22. 08. 2016.
 */

var chatController = function($scope, Messages, SharingService) {
    $scope.messages = Messages;
    $scope.sharingService = SharingService;
    $scope.sharingState = $scope.sharingService.state;

    $scope.sendMessage = function (msg) {
        $scope.$apply(function () {
            $scope.messages.push({sender: "You", message: msg});
            $scope.sharingService.sendChatMessage(msg);
        });
    }
};

app.controller('ChatController', chatController);