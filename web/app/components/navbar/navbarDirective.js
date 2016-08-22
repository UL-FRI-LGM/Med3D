/**
 * Created by Primoz on 21. 08. 2016.
 */

/**
 * Created by Primoz on 20. 08. 2016.
 */

app.directive('navbar', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Do not close on sub-dropdown click
            $('.dropdown-submenu-anchor').bind('click', function (e) {
                e.stopPropagation()
            });

            // Initialize fading
            $(".hover-div").stop().fadeTo("slow", 0.5);

            $(".hover-div").hover(function(){
                $(this).stop().fadeTo( "fast" , 1.0);
            }, function(){
                $(this).stop().fadeTo( "fast" , 0.5);
            });

            element.find("#sharingStopHostingButton").click(function (event) {
                scope.stopDataSharing(function () {
                    //TODO: IMPLEMENT THIS
                    });
            });

            element.find("#sharingLeaveSessionButton").click(function (event) {
                scope.leaveSession(function () {
                    //TODO: IMPLEMENT THIS
                });
            });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/navbar/navbar.html';
        }
    };
});