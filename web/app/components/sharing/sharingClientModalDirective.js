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
            var sessionListGroup = element.find("#sessionListGroup");
            var errorMsgSpan = element.find("#sessionClientModalError");
            var selectedSession = null;

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
                            var sessionName;

                            // Remove finished sessions
                            sessionListGroup.children().each(function() {
                                if (jsonData.data.indexOf($(this).data("uuid")) < 0) {
                                    if (selectedSession === $(this)) {
                                        selectedSession = null
                                    }
                                    $(this).remove();
                                }
                            });


                            for (var i = 0; i < jsonData.data.length; i++) {
                                var isNew = false;

                                // Check if entry for this file already exists (reuse anchor if exists)
                                var match = sessionListGroup.find("[data-uuid='" + jsonData.data[i] + "']");
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
                                        'data-uuid': jsonData.data[i]
                                    });
                                }

                                sessionName = jQuery('<div/>', {
                                    style: 'padding: 0; text-weight: 500',
                                    text: jsonData.data[i]
                                });

                                // Add inner elements
                                anchor.append(sessionName);

                                if (isNew) {
                                    anchor.click(function () {
                                        // Deselect previously selected item
                                        if (selectedSession !== null) {
                                            selectedSession.removeClass("active");
                                        }

                                        // Mark current item as selected
                                        selectedSession = $(this);
                                        selectedSession.addClass("active");
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

            var joinButton = element.find("#joinSessionButton");

            joinButton.click(function () {
                joinButton.attr("disabled", true);

                if (scope.sharingState.listeningInProgress) {
                    scope.leaveSession(function (event) {
                        joinButton.attr("disabled", false);
                        element.modal('hide');
                    });
                }
                else {
                    scope.joinSession(selectedSession.data("uuid"), function (event) {
                        joinButton.attr("disabled", false);
                        element.modal('hide');
                    });
                }
            });

        },
        templateUrl: function(element, attributes) {
            return 'app/components/sharing/clientModal.html';
        }
    };
});