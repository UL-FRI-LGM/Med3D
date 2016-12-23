/**
 * Created by Primoz on 20. 12. 2016.
 */

app.factory('PublicRenderData', function(){
    return {
        contentRenderGroup: null,
        canvasDimensions: {width: 1280, height: 1024},

        // Camera management
        activeCamera: null,
        cameras: [],
        sharedCameras: {},

        // Drawing parameters
        lineColor: new THREE.Vector3(1, 1, 1),
        lineThickness: 5, // px
        lineHardness: 0.1,

        // Function binder
        replaceRenderContent: null,
        setActiveCamera: null
    };
});