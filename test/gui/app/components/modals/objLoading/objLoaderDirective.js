/**
 * Created by Primoz on 20.7.2016.
 */
app.directive("objLoaderModal", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, modal, attributes) {
            // Make modal draggable
            modal.draggable({
                handle: ".modal-header"
            });

            // File input styling
            $(":file").filestyle({buttonName: "btn-danger", buttonText: "&nbspChoose file", size: "sm"});

            // DOM references
            var objLoaderModal = modal;
            var objFileOpenButton = objLoaderModal.find("#objFileOpenButton");
            var objButtonTooltipWrapper = objFileOpenButton.closest(".tooltip-wrapper");
            var objFileInput = objLoaderModal.find("#objFileInput");

            // Enable tooltip
            objLoaderModal.find('[data-toggle="tooltip"]').tooltip();
            objLoaderModal.find('[data-toggle="popover"]').popover();

            // When file is selected enable "Open" button
            objFileInput.change(function() {
                if (objFileInput.val() === "") {
                    objFileOpenButton.prop('disabled', true);
                    objButtonTooltipWrapper.tooltip('enable');
                }
                else {
                    objFileOpenButton.prop('disabled', false);
                    objButtonTooltipWrapper.tooltip('disable');
                }
            });

            // Open click handler
            objFileOpenButton.click(function() {

                var objFile = objFileInput.prop('files')[0];
                scope.loadObj(objFile);
                objLoaderModal.modal('hide');
            });

        },
        templateUrl: "app/components/modals/objLoading/objLoaderModal.html"
    }
});