/**
 * Created by Primoz on 20. 08. 2016.
 */

app.directive('sharingHostModal', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Bind the modal to the navbar trigger
            element.attr("id", attributes.trigger);

            // Make modal draggable
            element.draggable({
                handle: ".modal-header"
            });

            var startingSharing = false;

            // Disable by default
            var sharingButton = element.find("#startDataSharingButton");
            sharingButton.attr("disabled", true);

            var usernameInput = element.find('.input-username');

            usernameInput.bind("propertychange change click keyup input paste", function () {
                if (!startingSharing) {
                    sharingButton.attr("disabled", usernameInput.val().length < 3);
                }
            });

            sharingButton.click(function () {
                sharingButton.attr("disabled", true);
                startingSharing = true;

                scope.startDataSharing(usernameInput.val(), function (event) {
                    sharingButton.attr("disabled", false);
                    startingSharing = false;
                    element.modal('hide');
                });
            });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/collaboration/hostModal.html';
        }
    };
});