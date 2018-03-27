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
            $(":file").filestyle('dragdrop', true);
            $(":file").filestyle('btnClass', 'btn-danger');
            $(":file").filestyle('size', 'sm');

            // DOM references
            let objLoaderModal = modal;
            let objFileOpenButton = objLoaderModal.find("#objFileOpenButton");
            let objButtonTooltipWrapper = objFileOpenButton.closest(".tooltip-wrapper");
            let objFileInput = objLoaderModal.find("#objFileInput");

            // Enable tooltip
            objLoaderModal.find('[data-toggle="tooltip"]').tooltip();
            objLoaderModal.find('[data-toggle="popover"]').popover();

            // Toggles load button and its tooltip
            let toggleLoadButton = function(state) {
                objFileOpenButton.prop('disabled', !state);
                objButtonTooltipWrapper.tooltip(state ? 'disable' : 'enable');
            };

            // Function used to validate and unlock load button
            let localObjValidate = function() {
                if (objFileInput.val() === "") {
                    toggleLoadButton(false);
                }
                else {
                    toggleLoadButton(true);
                }
            };

            // When file is selected enable "Load" button
            objFileInput.change(localObjValidate);

            let localOnLoadClick = function () {
                let objFile = objFileInput.prop('files')[0];
                scope.loadLocalObjFile(objFile);
                objLoaderModal.modal('hide');
            };

            // region Server obj files
            // Holds the active obj item from the list
            let activeObjListItem;

            let errorMsgSpan = modal.find("#objListErrorMsg");

            let serverObjValidate = function () {
                if (activeObjListItem !== undefined) {
                    toggleLoadButton(true);
                }
                else {
                    toggleLoadButton(false);
                }
            };

            let serverOnLoadClick = function () {
                let filename = activeObjListItem.data('filename');
                scope.loadServerObjFile(filename);
                objLoaderModal.modal('hide');
            };


            scope.toggleServerFile = function($event) {
                // Deselect previously selected item
                if (activeObjListItem !== undefined) {
                    activeObjListItem.removeClass("active");
                }

                // Mark current item as selected
                activeObjListItem = $($event.currentTarget);
                activeObjListItem.addClass("active");

                // Validate input
                serverObjValidate();
            };

            scope.validateSelection = function (searchString) {
                if (activeObjListItem !== undefined && !activeObjListItem.data('filename').split('.')[0].toLowerCase().includes(searchString.toLowerCase())) {
                    activeObjListItem = undefined;
                    serverObjValidate();
                }
            };

            // When the modal is shown fetch the obj list
            modal.on('show.bs.modal', function() {
                errorMsgSpan.html('');
                scope.requestFileListFromServer(function (errorMsg) {
                    errorMsgSpan.text(errorMsg);
                });
            });
            //endregion

            let currentTab = "#localObjTab";

            modal.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                let newTab = $(e.target).attr("href"); // activated tab

                // Disable load button and preform data validation for the selected tab
                toggleLoadButton(false);

                // Update current tab
                currentTab = newTab;

                if (newTab === "#localObjTab") {
                    localObjValidate();
                }
                else if (newTab === "#serverObjTab") {
                    serverObjValidate()
                }
            });

            objFileOpenButton.click(function() {
                if (currentTab === "#localObjTab") {
                    localOnLoadClick();
                }
                else if (currentTab === "#serverObjTab") {
                    serverOnLoadClick();
                }
            });
        },
        templateUrl: "app/components/modals/objLoading/objLoaderModal.html"
    }
});