/**
 * Created by Primoz on 7.6.2016.
 */

onmessage = function(msg) {
    // number of cubes along a side
    var size = msg.data[0];
    /*var axisMin = -10;
    var axisMax = 10;


    var positions = new Float32Array(size.x * size.y * size.z * 3);*/
    var meta = {dimensions: size, axisMax: 10, axisMin: - 10};
    var values = new Float32Array(size.x * size.y * size.z);
    var axisRange = (meta.axisMax - meta.axisMin)

    var idx = 0;
    // Generate a list of 3D positions and values
    for (var k = 0; k < size.z; k++) {
        for (var j = 0; j < size.y; j++) {
            for (var i = 0; i < size.x; i++) {
                // actual values
                var x = meta.axisMin + axisRange * i / (size.x - 1);
                var y = meta.axisMin + axisRange * j / (size.y - 1);
                var z = meta.axisMin + axisRange * k / (size.z - 1);
                /*positions[idx * 3] = x;
                positions[idx * 3 + 1] = y;
                positions[idx * 3 + 2] = z;*/

                //var value = (k === 10) ? -1 : 0;
                //var value = (j > 5 && j < 30 && i > 5 && i < 20 && k > 5 && k < 10) ? -1 : 0;
                //var value = x * x * x + y * y * z;
                //var value = Math.sin(5 * x) * Math.cos(5* y) - Math.tan(10 * z);
                var value = x * x + y * y - z * z - 25;
                values[idx] = value;

                idx ++;
            }
        }
    }

    postMessage({values: values, meta: meta});
};