/**
 * Created by Primoz on 7.6.2016.
 */

onmessage = function(msg) {
    var positions = [];
    var values = [];

    // number of cubes along a side
    var size = msg.data[0];
    var axisMin = -10;
    var axisMax = 10;
    var axisRange = axisMax - axisMin;

    // Generate a list of 3D positions and values
    for (var k = 0; k < size.z; k++) {
        for (var j = 0; j < size.y; j++) {
            for (var i = 0; i < size.x; i++) {
                // actual values
                var x = axisMin + axisRange * i / (size.x - 1);
                var y = axisMin + axisRange * j / (size.y - 1);
                var z = axisMin + axisRange * k / (size.z - 1);
                positions.push(x, y, z);

                //var value = (k === 10) ? -1 : 0;
                //var value = (j > 5 && j < 30 && i > 5 && i < 20 && k > 5 && k < 10) ? -1 : 0;
                //var value = x * x * x + y * y * z;
                //var value = Math.sin(5 * x) * Math.cos(5* y) - Math.tan(10 * z);
                var value = x * x + y * y - z * z - 25;
                values.push(value);
            }
        }
    }

    postMessage({positions: positions, values: values, size: size});
};