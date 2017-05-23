/**
 * Created by Primoz on 20. 08. 2016.
 */

app.directive('sharingClientModal', function() {
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

            var modalActive = false;
            var joinButton = element.find("#joinSessionButton");
            joinButton.attr("disabled", true);

            var sessionListGroup = element.find("#sessionListGroup");
            var errorMsgSpan = element.find("#sessionClientModalError");
            var usernameInput = element.find(".input-username");
            var emptyListItem = element.find(".empty-list-item");

            var selectedSession = null;
            var joiningInProgress = false;


            var validateInput = function() {
                var disable = false;
                disable = disable || selectedSession === null;
                disable = disable || joiningInProgress;
                disable = disable || usernameInput.val().length < 3;

                joinButton.attr("disabled", disable);
            };

            usernameInput.bind("propertychange change click keyup input paste", function () {
                validateInput();
            });


            // Ajax load data
            // When the modal is shown fetch the obj list
            element.on('show.bs.modal', function() {
                errorMsgSpan.html('');
                modalActive = true;
                pollSessionList();
            });

            element.on('hide.bs.modal', function() {
                errorMsgSpan.html('');
                modalActive = false;
            });

            var pollSessionList = function () {
                $.ajax ({
                    type: "POST",
                    url: '/api/session-info',
                    data: JSON.stringify({reqType: "active-list"}),
                    contentType: "application/json",
                    success: function (jsonData) {
                        if (jsonData !== undefined && jsonData.status === 0) {
                            errorMsgSpan.text("");

                            var item;
                            var anchor;
                            var sessionHostHolder;
                            var sessionIdHolder;

                            // Remove finished sessions
                            sessionListGroup.children().each(function() {
                                var current = $(this);

                                if (jsonData.data.filter(function(entry) { return entry.sessionId === current.data("uuid"); }).length <= 0) {
                                    if (selectedSession === $(this)) {
                                        selectedSession = null;
                                        // disable button
                                        validateInput();
                                    }
                                    $(this).remove();
                                }
                            });

                            // Display empty array note
                            if (jsonData.data.length > 0) {
                                emptyListItem.css("display", "none");
                            }
                            else {
                                emptyListItem.css("display", "block");
                            }


                            for (var i = 0; i < jsonData.data.length; i++) {
                                var isNew = false;

                                // Check if entry for this file already exists (reuse anchor if exists)
                                var match = sessionListGroup.find("[data-uuid='" + jsonData.data[i].sessionId + "']");
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
                                        'data-uuid': jsonData.data[i].sessionId
                                    });
                                }

                                sessionHostHolder = jQuery('<div/>', {
                                    style: 'padding: 0;',
                                    class: 'col-sm-7',
                                    html: '<span style="font-weight: 500;">' + jsonData.data[i].ownerUsername + '</span>'
                                });

                                sessionIdHolder = jQuery('<div/>', {
                                    style: 'padding: 0;',
                                    class: 'col-sm-5',
                                    html: '<span style="float: right; font-weight: 500;">' +jsonData.data[i].sessionId + '</span>'
                                });



                                // Add inner elements
                                anchor.append(sessionHostHolder);
                                anchor.append(sessionIdHolder);

                                if (isNew) {
                                    anchor.click(function () {
                                        // Deselect previously selected item
                                        if (selectedSession !== null) {
                                            selectedSession.removeClass("active");
                                        }

                                        // Mark current item as selected
                                        selectedSession = $(this);
                                        selectedSession.addClass("active");
                                        validateInput();
                                    });

                                    sessionListGroup.append(anchor);
                                }
                            }
                        }
                        else {
                            errorMsgSpan.text('Received error ' + jsonData.status + ' from the server.\nError message: ' + jsonData.errMsg);
                        }
                    },
                    error: function() {
                        errorMsgSpan.text('Failed to fetch files from the server.');
                    },
                    complete: setTimeout(function() { if (modalActive) pollSessionList()}, 5000),
                    timeout: 4000
                });
            };

            joinButton.click(function () {
                joinButton.attr("disabled", true);
                joiningInProgress = true;

                if (!scope.sharingState.listeningInProgress) {
                    scope.joinSession(usernameInput.val(), selectedSession.data("uuid"), function (event) {
                        joiningInProgress = false;
                        joinButton.attr("disabled", false);
                        element.modal('hide');
                    });
                }
            });

        },
        templateUrl: function(element, attributes) {
            return 'app/components/collaboration/clientModal.html';
        }
    };
});