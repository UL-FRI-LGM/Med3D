/**
 * Created by Primoz on 26. 07. 2016.
 */

app.directive("marchingCubesModal", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, volumeModal, attributes) {
            // Make modal draggable
            volumeModal.draggable({
                handle: ".modal-header"
            });

            // File input styling
            $(":file").filestyle({buttonName: "btn-danger", buttonText: "&nbspChoose file", size: "sm"});


            // DOM references
            var volumeMhdFileInput = volumeModal.find("#volumeMhdFileInput");
            var volumeRawFileInput = volumeModal.find("#volumeRawFileInput");
            var volumeIsoValueInput = volumeModal.find("#volumeIsoValueInput");
            var volumeFileOpenButton = volumeModal.find("#volumeFileOpenButton");
            var volumeButtonTooltipWrapper = volumeFileOpenButton.closest(".tooltip-wrapper");

            // Enable tooltip
            volumeModal.find('[data-toggle="tooltip"]').tooltip();
            volumeModal.find('[data-toggle="popover"]').popover();

            // Input checking
            var volOpenUnlocker = function() {
                if (volumeMhdFileInput.val() === "" || volumeRawFileInput.val() === "" || volumeIsoValueInput.val() === "") {
                    volumeFileOpenButton.prop('disabled', true);
                    volumeButtonTooltipWrapper.tooltip('enable');
                }
                else {
                    volumeFileOpenButton.prop('disabled', false);
                    volumeButtonTooltipWrapper.tooltip('disable');
                }
            };

            volumeMhdFileInput.change(volOpenUnlocker);
            volumeRawFileInput.change(volOpenUnlocker);
            volumeIsoValueInput.change(volOpenUnlocker);

            // Start marching cubes
            volumeFileOpenButton.click(function() {
                var mhdFile = volumeMhdFileInput.prop('files')[0];
                var rawFile = volumeRawFileInput.prop('files')[0];
                var isoval = parseFloat(volumeIsoValueInput.val());

                scope.execMarchingCubes(mhdFile, rawFile, isoval);

                volumeModal.modal('hide');
            });

        },
        templateUrl: "app/components/modals/volumeLoading/marchingCubesModal.html"
    }
});