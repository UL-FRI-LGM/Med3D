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

            // Toggles load button and its tooltip
            var toggleLoadButton = function(state) {
                objFileOpenButton.prop('disabled', !state);
                objButtonTooltipWrapper.tooltip(state ? 'disable' : 'enable');
            };

            // Function used to validate and unlock load button
            var localObjValidate = function() {
                if (objFileInput.val() === "") {
                    toggleLoadButton(false);
                }
                else {
                    toggleLoadButton(true);
                }
            };

            // When file is selected enable "Load" button
            objFileInput.change(localObjValidate);

            var localOnLoadClick = function () {
                var objFile = objFileInput.prop('files')[0];
                scope.loadLocalObjFile(objFile);
                objLoaderModal.modal('hide');
            };

            // region Server obj files
            // Holds the active obj item from the list
            var activeObjListItem;

            var errorMsgSpan = modal.find("#objListErrorMsg");
            var objListGroup = modal.find("#objListGroup");

            var serverObjValidate = function () {
                if (activeObjListItem !== undefined) {
                    toggleLoadButton(true);
                }
                else {
                    toggleLoadButton(false);
                }
            };

            var serverOnLoadClick = function () {
                var filename = activeObjListItem.data('filename');
                scope.loadServerObjFile(filename);
                objLoaderModal.modal('hide');
            };

            var formatBytes = function(bytes, decimals) {
                if(bytes == 0) return '0 B';
                var k = 1024;
                var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                var i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
            };

            // When the modal is shown fetch the obj list
            modal.on('show.bs.modal', function() {
                errorMsgSpan.html('');

                $.ajax ({
                    type: "POST",
                    url: '/api/file-management',
                    data: JSON.stringify({reqType: "objList"}),
                    contentType: "application/json",
                    success: function (jsonData) {
                        if (jsonData !== undefined && jsonData.status === 0) {
                            var item;
                            var anchor;
                            var nameHolder;
                            var uploadDate;
                            var uploadDateHolder;
                            var sizeHolder;

                            // TODO: Add removal if element no longer exists

                            for (var i = 0; i < jsonData.data.length; i++) {
                                var isNew = false;

                                // Check if entry for this file already exists (reuse anchor if exists)
                                var match = objListGroup.find("[data-filename='" + jsonData.data[i].name + "']");
                                if (match.length > 0) {
                                    anchor = match.first();
                                    anchor.html("");
                                }
                                else {
                                    isNew = true;
                                    anchor = jQuery('<a/>', {
                                        href: '#',
                                        class: 'list-group-item',
                                        style: 'height: 40px',
                                        'data-filename': jsonData.data[i].name
                                    });
                                }


                                nameHolder = jQuery('<div/>', {
                                    class: 'col-sm-3',
                                    style: 'padding: 0; text-weight: 500',
                                    text: jsonData.data[i].name.split(".")[0]

                                });

                                uploadDate = new Date(jsonData.data[i].uploadDate);
                                var strUpload = uploadDate.getDate() + ". " + (uploadDate.getMonth() + 1) + ". " + uploadDate.getFullYear() + "  " + uploadDate.getHours() + ":" + uploadDate.getMinutes();

                                uploadDateHolder = jQuery('<div/>', {
                                    class: 'col-sm-7',
                                    style: 'white-space: pre;',
                                    text: strUpload
                                });

                                sizeHolder = jQuery('<div/>', {
                                    class: 'col-sm-2',
                                    style: 'text-align: right; padding: 0',
                                    text: formatBytes(jsonData.data[i].size)
                                });

                                // Add inner elements
                                anchor.append(nameHolder);
                                anchor.append(uploadDateHolder);
                                anchor.append(sizeHolder);

                                if (isNew) {
                                    anchor.click(function () {
                                        // Deselect previously selected item
                                        if (activeObjListItem !== undefined) {
                                            activeObjListItem.removeClass("active");
                                        }

                                        // Mark current item as selected
                                        activeObjListItem = $(this);
                                        activeObjListItem.addClass("active");

                                        // Validate input
                                        serverObjValidate();
                                    });

                                    objListGroup.append(anchor);
                                }
                            }
                        }
                        else {
                            errorMsgSpan.text('Received error ' + jsonData.status + ' from the server.\nError message: ' + jsonData.errMsg);
                        }
                    },
                    error: function() {
                        errorMsgSpan.text('Failed to fetch files from the server.');
                    }
                });
            });
            //endregion

            var currentTab = "#localObjTab";

            modal.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                var newTab = $(e.target).attr("href"); // activated tab

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