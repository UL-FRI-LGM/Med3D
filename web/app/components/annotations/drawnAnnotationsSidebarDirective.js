/**
 * Created by Primoz on 6. 08. 2016.
 */

app.directive("drawnAnnotationsSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // On click modify adding annotation value
            scope.addAnnotation = function () {
                let newAnnotation = new DrawnAnnotation("Untitled annotation", scope.publicRenderData.activeCamera.position.clone(), scope.publicRenderData.activeCamera.rotation.toVector3().clone());

                scope.annotations.drawnAnnotationsList.push(newAnnotation);
                scope.annotations.selectedDrawnAnnotation = newAnnotation;
            };

            scope.rmAnnotation = function (index) {
                if (scope.annotations.drawnAnnotationsList[index] === scope.annotations.selectedDrawnAnnotation) {
                    scope.annotations.selectedDrawnAnnotation = undefined;
                }

                scope.annotations.drawnAnnotationsList.splice(index, 1);
            };

            scope.toggleActive = function (index) {
                if (scope.annotations.selectedDrawnAnnotation === scope.annotations.drawnAnnotationsList[index]) {
                    scope.annotations.selectedDrawnAnnotation = undefined;
                }
                else {
                    scope.annotations.selectedDrawnAnnotation = scope.annotations.drawnAnnotationsList[index];
                }
            };


        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/drawnAnnotationsSidebar.html';
        }
    }
});