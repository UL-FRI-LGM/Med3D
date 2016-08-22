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

            var sharingButton = element.find("#startDataSharingButton");

            sharingButton.click(function () {
                sharingButton.attr("disabled", true);

                scope.startDataSharing(function (event) {
                    // TODO: Handle errors
                    sharingButton.attr("disabled", false);
                    element.modal('hide');
                });
            });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/sharing/hostModal.html';
        }
    };
});