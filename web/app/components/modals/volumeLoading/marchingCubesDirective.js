/**
 * Created by Primoz on 26. 07. 2016.
 */

app.directive("marchingCubesModal", function () {
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
            var volumeMhdFileInput = modal.find("#volumeMhdFileInput");
            var volumeRawFileInput = modal.find("#volumeRawFileInput");
            var localTabIsoInput = modal.find("#localMhdTab .volume-loader-iso-input");
            var serverTabIsoInput = modal.find("#serverMhdTab .volume-loader-iso-input");
            var volumeFileOpenButton = modal.find("#volumeFileOpenButton");
            var volumeButtonTooltipWrapper = volumeFileOpenButton.closest(".tooltip-wrapper");

            // Enable tooltip
            modal.find('[data-toggle="tooltip"]').tooltip();
            modal.find('[data-toggle="popover"]').popover();

            // Toggled load button and it's tooltip
            var toggleLoadButton = function(state) {
                volumeFileOpenButton.prop('disabled', !state);
                volumeButtonTooltipWrapper.tooltip(state ? 'disable' : 'enable');
            };

            // Local tab input checking
            var localMhdValidate = function() {
                if (volumeMhdFileInput.val() === "" || volumeRawFileInput.val() === "" || localTabIsoInput.val() === "") {
                    toggleLoadButton(false);
                }
                else {
                    toggleLoadButton(true);
                }
            };

            // Setup local tab listeners
            volumeMhdFileInput.change(localMhdValidate);
            volumeRawFileInput.change(localMhdValidate);
            localTabIsoInput.change(localMhdValidate);


            // SERVER

            var activeMhdListItem;

            var errorMsgSpan = modal.find("#mhdListErrorMsg");
            var mhdListGroup = modal.find("#mhdListGroup");

            var serverMhdValidate = function () {
                if (activeMhdListItem !== undefined && serverTabIsoInput.val() !== "") {
                    toggleLoadButton(true);
                }
                else {
                    toggleLoadButton(false);
                }
            };

            var formatBytes = function(bytes, decimals) {
                if(bytes == 0) return '0 B';
                var k = 1024;
                var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                var i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
            };

            modal.on('show.bs.modal', function() {
                errorMsgSpan.html('');

                $.ajax ({
                    type: "POST",
                    url: '/api/file-management',
                    data: JSON.stringify({reqType: "mhdList"}),
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
                                var match = mhdListGroup.find("[data-filename='" + jsonData.data[i].name + "']");
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
                                        if (activeMhdListItem !== undefined) {
                                            activeMhdListItem.removeClass("active");
                                        }

                                        // Mark current item as selected
                                        activeMhdListItem = $(this);
                                        activeMhdListItem.addClass("active");

                                        // Validate input
                                        serverMhdValidate();
                                    });

                                    mhdListGroup.append(anchor);
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


            var currentTab = "#localMhdTab";

            modal.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                var newTab = $(e.target).attr("href"); // activated tab

                // Disable load button and preform data validation for the selected tab
                toggleLoadButton(false);

                // Update current tab
                currentTab = newTab;

                if (newTab === "#localMhdTab") {
                    localMhdValidate();
                }
                else if (newTab === "#serverMhdTab") {
                    serverMhdValidate()
                }
            });

            var localOnLoadClick = function () {
                var mhdFile = volumeMhdFileInput.prop('files')[0];
                var rawFile = volumeRawFileInput.prop('files')[0];
                var isoVal = parseFloat(localTabIsoInput.val());

                scope.localMhdLoad(mhdFile, rawFile, isoVal);

                modal.modal('hide');
            };

            var serverOnLoadClick = function () {
                var filename = activeMhdListItem.data('filename');
                var isoVal = parseFloat(serverTabIsoInput.val());

                scope.serverMhdLoad(filename, isoVal);

                modal.modal('hide');
            };


            // Start marching cubes
            volumeFileOpenButton.click(function() {
                console.log(currentTab);
                if (currentTab === "#localMhdTab") {
                    localOnLoadClick();
                }
                else if (currentTab === "#serverMhdTab") {
                    serverOnLoadClick();
                }
            });

        },
        templateUrl: "app/components/modals/volumeLoading/marchingCubesModal.html"
    }
});