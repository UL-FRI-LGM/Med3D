/**
 * Created by Primoz Lavric on 07-Mar-17.
 */

M3D.Math = class {

    /**
     * Computes a bounding sphere for the given set of spheres.
     * @param {Array.<THREE.Sphere>} spheres Array of THREE.Sphere objects.
     */
    static computeSpheresBoundingSphere(spheres) {

        // List of the sphere "axis extrema"
        let sphereAxisExtrema = [];

        for (let i = 0; i < spheres.length; i++) {
            // Bounding box
            let box = spheres[i].getBoundingBox();

            // Lower box (x, y, z)
            let boxMin = box.min;
            // Higher box (x, y, z)
            let boxMax = box.max;

            let center = spheres[i].center;

            // Generate 6 edge points of the sphere
            for (let j = 0; j < 3; j++) {
                sphereAxisExtrema.push(...center.toArray());
                sphereAxisExtrema[sphereAxisExtrema.length - (3 - j)] = boxMin.getComponent(j);

                sphereAxisExtrema.push(...center.toArray());
                sphereAxisExtrema[sphereAxisExtrema.length - (3 - j)] = boxMax.getComponent(j);
            }
        }

        // AABB bounding sphere method
        let boxAll = new THREE.Box3();
        let sphereAll = new THREE.Sphere();
        let vector = new THREE.Vector3();

        // Set initial bounding sphere based on the bounding box
        boxAll.setFromArray(sphereAxisExtrema);
        boxAll.center(sphereAll.center);

        // Optimize sphere radius
        let maxRadiusSq = 0;

        for (let i = 0; i < sphereAxisExtrema.length; i += 3) {
            vector.fromArray(sphereAxisExtrema, i);
            maxRadiusSq = Math.max(maxRadiusSq, sphereAll.center.distanceToSquared(vector));
        }

        sphereAll.radius = Math.sqrt(maxRadiusSq);

        if (isNaN(sphereAll.radius)) {
            console.error('Geometry error: Bounding sphere radius is NaN.');
        }

        return sphereAll;
    }
};