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

            // Enable tooltips
            scope.initTooltip = function (owner) {
                element.find('[data-toggle="tooltip"]').tooltip({title: owner, placement: "left"});
            };

            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // Configure scroll bar
            element.find('.mCustomScrollbar').mCustomScrollbar({ alwaysShowScrollbar: 1, updateOnContentResize: true});

            // Sliders initialization
            let thicknessHandle = element.find('#thicknessHandle');
            element.find('#thicknessSlider').slider({
                value: 5,
                min: 1,
                max: 32,
                step: 1,
                create: function() {
                    scope.publicRenderData.lineThickness = $(this).slider( "value" );
                    thicknessHandle.text( $(this).slider( "value" ) );
                },
                slide: function( event, ui ) {
                    scope.publicRenderData.lineThickness = ui.value;
                    thicknessHandle.text(ui.value);
                }
            });

            let hardnessHandle = element.find('#hardnessHandle');
            element.find('#hardnessSlider').slider({
                value: 0.1,
                min: 0,
                max: 1,
                step: 0.01,
                create: function() {
                    scope.publicRenderData.lineHardness = $(this).slider( "value" );
                    hardnessHandle.text( $(this).slider( "value" ) );
                },
                slide: function( event, ui ) {
                    scope.publicRenderData.lineHardness = ui.value;
                    hardnessHandle.text( ui.value );
                }
            });

            // Configure color picker
            let sliders = {
                saturation: {
                    maxLeft: 220,
                    maxTop: 125,
                    callLeft: 'setSaturation',
                    callTop: 'setBrightness'
                },
                hue: {
                    maxLeft: 0,
                    maxTop: 125,
                    callLeft: false,
                    callTop: 'setHue'
                }
            };


            element.find('#lineColorPicker').colorpicker({
                color: "rgb(1, 1, 1)",
                container: true,
                inline: true,
                sliders: sliders}).on('changeColor', function(e) {
                                        scope.publicRenderData.lineColor.set(e.color.toString('rgb'));
                                    });


            // On click modify adding annotation value
            scope.addAnnotation = function () {
                let activeCamera = scope.publicRenderData.cameraManager.activeCamera;
                let newAnnotation = new DrawnAnnotation("Untitled annotation", activeCamera.position.clone(), activeCamera.rotation.toVector3().clone());
                newAnnotation.addLayer();

                newAnnotation.__editingTitle = true;
                scope.annotations.addDrawnAnnotation(newAnnotation);
            };

            scope.rmAnnotation = function (index) {
                scope.annotations.rmDrawnAnnotation(index);
            };

            scope.toggleAnnotationActive = function (annotation) {
               scope.annotations.toggleDrawnAnnotationActive(annotation);
            };

            scope.toggleLayerDisplayed = function (ann, layer) {
                if (!layer.isDisplayed) {
                    layer.displayed = true;
                }
                else {
                    if (layer === ann.drawLayer) {
                        ann.drawLayer = null;
                    }

                    layer.displayed = false;
                }
            };

            scope.moveLayer = function (ann, layer, up) {
                let idx = ann.layers.indexOf(layer);

                if (idx > -1) {
                    if (up && idx > 0) {
                        ann.layers[idx] = ann.layers[idx - 1];
                        ann.layers[idx - 1] = layer;
                    }
                    else if (!up && idx < ann.layers.length - 1) {
                        ann.layers[idx] = ann.layers[idx + 1];
                        ann.layers[idx + 1] = layer;
                    }
                }
            };

            scope.toggleDrawingLayer = function (event, ann, layer) {
                if (ann.drawLayer === layer) {
                    ann.drawLayer = null;
                }
                else {
                    ann.drawLayer = layer;
                }
                event.stopPropagation();
            };

            scope.removeDrawingLayer = function (event, ann, layer) {
                scope.annotations.removeDrawingLayer(ann, layer);
                event.stopPropagation();
            };

            scope.addDrawingLayer = function(annotation) {
                scope.annotations.addDrawingLayer(annotation);
            };

            scope.stopEditingTitle = function (layer) {
                layer.__editingTitle = false;
                if (layer.title.length <= 0) {
                    layer.title = "Untitled"
                }
            };

            scope.undoLine = function () {
                // Remove last line
                scope.annotations.selectedDrawnAnnotation.drawLayer.undo();
            }

        },
        templateUrl: function(element, attributes) {
            return 'app/components/annotations/drawnAnnotationsSidebar.html';
        }
    }
});