/**
 * Created by Primoz on 19.7.2016.
 */

app.directive('navigator', function() {
   return {
       restrict: 'E',
       replace: true,
       scope: {
           translationValues: "=",
           rotationValues: "=",
           navigatorToggle: "="
       },
       link: function (scope, element, attrs) {
           // Enable navigator fading out
           element.stop().fadeTo("slow", 0.5);

           element.hover(function(){
               $(this).stop().fadeTo( "fast" , 1.0);
           }, function(){
               $(this).stop().fadeTo( "fast" , 0.5);
           });

           // Enables element dragging via drag handle
           element.draggable({
               handle: ".drag-handle"
           });

           // Enables navigator closing via X button
           element.find(".navigator-btn-close").click(function() {
               scope.$apply(function(){
                   if (attrs.type === 'rotation') {
                       scope.navigatorToggle.rotation = false;
                   } else {
                       scope.navigatorToggle.translation = false;
                   }
               });
           });

           if (attrs.type === "translation") {
               // Translation magnitude
               var handleTranslationCircle = function(circle) {
                   var outX = (event.clientX - circle.position().left - circle.attr("r")) / circle.attr("r");
                   var outY = -((event.clientY - circle.position().top - circle.attr("r")) / circle.attr("r"));

                   outX = outX > 1.0 ? 1.0 : (outX < -1.0 ? -1.0 : outX);
                   outY = outY > 1.0 ? 1.0 : (outY < -1.0 ? -1.0 : outY);

                   scope.translationValues.x = outX;
                   scope.translationValues.z = -outY;
               };

               // Left side circle handler
               element.find(".navigator-circ-left").mousedown(function() {
                   scope.translationValues.y = -1;
               });

               // Left side circle handler
               element.find(".navigator-circ-right").mousedown(function() {
                   scope.translationValues.y = 1;
               });

               // Main circle drag handler
               element.find(".navigator-btn-circ-nav").mousedown(function() {
                   handleTranslationCircle($(this));
               });

               element.find(".navigator-btn-circ-nav").draggable({
                   start: function(event, ui) {
                   },
                   drag: function(event, ui) {
                       handleTranslationCircle(ui.helper)
                   },
                   stop: function(event, ui) {}
               });
           }
           else {
               // Rotation magnitude
               var handleRotationCircle = function(circle) {
                   var outX = (event.clientX - circle.position().left - circle.attr("r")) / circle.attr("r");
                   var outY = -((event.clientY - circle.position().top - circle.attr("r")) / circle.attr("r"));

                   outX = outX > 1.0 ? 1.0 : (outX < -1.0 ? -1.0 : outX);
                   outY = outY > 1.0 ? 1.0 : (outY < -1.0 ? -1.0 : outY);

                   scope.rotationValues.y = -outX;
                   scope.rotationValues.x = outY;
               };

               // Left side circle handler
               element.find(".navigator-circ-left").mousedown(function() {
                   scope.rotationValues.z = 1;
               });

               // Right side circle handler
               element.find(".navigator-circ-right").mousedown(function() {
                   scope.rotationValues.z = -1;
               });

               // Main circle drag handler
               element.find(".navigator-btn-circ-nav").mousedown(function() {
                   handleRotationCircle($(this));
               });

               element.find(".navigator-btn-circ-nav").draggable({
                   start: function(event, ui) {
                   },
                   drag: function(event, ui) {
                       handleRotationCircle(ui.helper);
                   },
                   stop: function(event, ui) {}
               });

           }


        },
       templateUrl: function(element, attributes) {
           return 'app/components/input/' + attributes.type + 'Navigator.html';
       }
   };
});