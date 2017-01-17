/**
 * Created by Primoz on 20.7.2016.
 */
app.directive("m3dCanvas", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, canvas, attributes) {

            // Initialize renderer
            var renderer = new M3D.MeshRenderer(canvas[0], M3D.WEBGL2);
            // Set the specified shader path
            renderer.addShaderLoaderUrls(attributes.shaderpath);

            // Pass the renderer to the controller
            scope.init(renderer, canvas[0]);

            // Canvas resizing
            window.onresize = function(){
                // Lookup the size the browser is displaying the canvas.
                var displayWidth  = canvas[0].clientWidth;
                var displayHeight = canvas[0].clientHeight;

                // Check if the canvas is not the same size.
                if (canvas[0].width != displayWidth || canvas[0].height != displayHeight) {

                    // Make the canvas the same size
                    canvas[0].width  = displayWidth;
                    canvas[0].height = displayHeight;

                    // Notify controller
                    scope.resizeCanvas(displayWidth, displayHeight);
                }
            };

            window.onresize();

            // On new annotation add click listener
            scope.$watch("annotations.newAnnotation", function(newValue) {
                if (newValue !== undefined) {
                    if (!scope.newAnnotationClick.active) {
                        canvas.click(scope.newAnnotationClick);
                        scope.newAnnotationClick.active = true;
                    }
                }
                else {
                    if (scope.newAnnotationClick.active) {
                        canvas.off("click");
                        scope.newAnnotationClick.active = false;
                    }
                }
            });
        },
        template: "<canvas width='1280px' height='720px'></canvas>"
    }
});