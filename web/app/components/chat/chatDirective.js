/**
 * Created by Primoz on 22. 08. 2016.
 */


app.directive("chat", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            var chatHolder = element.find(".chat-holder");
            var chatInput = element.find(".chat-input");
            var chatOpenBtn = element.find(".chat-open");
            var chatPanel = element.find(".chat-panel");

            // Fading button
            chatOpenBtn.stop().fadeTo("slow", 0.5);
            chatOpenBtn.hover(function(){
                $(this).stop().fadeTo( "fast" , 1.0);
            }, function(){
                $(this).stop().fadeTo( "fast" , 0.5);
            });

            // Open button set up
            chatOpenBtn.click(function () {
                chatHolder.css("bottom", "0");
            });

            // Close button set up
            element.find(".chat-close").click(function () {
               chatHolder.css("bottom", "-350px");
            });

            scope.$watchGroup(['sharingState.hostingInProgress', 'sharingState.listeningInProgress'], function(newValues, oldValues) {
                if (!newValues[0] && !newValues[1]) {
                    chatHolder.css("bottom", "-350px");
                }
            });

            // Scroll
            var moveDown = true;

            var updateScroll = function() {
                if (moveDown) {
                    chatPanel.stop().animate({scrollTop: chatPanel[0].scrollHeight}, 'slow');
                }
            };

            scope.$watch("messages.length", function (newValue, oldValue) {
                updateScroll();
            });

            chatPanel.on('scroll', function(){
                moveDown = chatPanel[0].scrollTop === (chatPanel[0].scrollHeight - 256);
            });

            // Text input
            chatInput.keyup(function (e) {
                if (e.keyCode === 13) {
                    var msg = chatInput.val();

                    // Add to messages if long enough
                    if (msg.length !== 0) {
                        scope.sendMessage(msg);
                    }

                    // Clear input
                    chatInput.val("");
                }
            });

        },
        templateUrl: function(element, attributes) {
            return 'app/components/chat/chat.html';
        }
    }
});