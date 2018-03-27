/**
 * Created by Primoz on 6. 08. 2016.
 */

app.directive("scenePropertiesSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {
            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // Configure scroll bar
            element.find('.mCustomScrollbar').mCustomScrollbar({ alwaysShowScrollbar: 1, updateOnContentResize: true});

            // Sliders initialization
            let transparencyHandle = element.find('#transparencyHandle');
            element.find('#transparencySlider').slider({
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                create: function() {
                    transparencyHandle.text( $(this).slider( "value" ) );
                },
                slide: function( event, ui ) {
                    transparencyHandle.text(ui.value);
                    if (scope.renderData !== undefined) {
                        scope.renderData.traverse(function (obj) {
                            if (obj instanceof M3D.Mesh) {
                                if (ui.value === 100) {
                                    obj.material.transparent = false;
                                }
                                else {
                                    obj.material.opacity = ui.value / 100;
                                    obj.material.transparent = true;
                                }
                            }
                        });
                    }
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
                    if (scope.renderData !== undefined) {
                        scope.renderData.traverse(function (obj) {
                            if (obj instanceof M3D.Mesh) {
                                obj.material.color.set(e.color.toString('rgb'));
                            }
                        });
                    }
                });
        },
        templateUrl: function(element, attributes) {
            return 'app/components/scene_properties/scenePropertiesSidebar.html';
        }
    }
});