/**
 * Created by Ziga on 17.3.2016.
 */

 // TODO: complete redesign

M3D.ShaderLoader = class {

    constructor(manager) {
        this.manager = manager || new M3D.LoadingManager();
        this.loaded = [];
        this.requests = [];
    }

    load(url, onLoad, onProgress, onError) {
        var scope = this;
        this.loaded = [];
        this.requests = [];
        var loader = new M3D.XHRLoader(scope.manager);
        loader.setPath(this.path);
        var path = loader.extractUrlBase(url);
        loader.load(url, function(text) {
            onLoad(scope.parse(path, text));
        }, onProgress, onError);
    }

    setPath(path) {
        this.path = path;
    }

    parse(path, text) {
        var scope = this;
        var loader = new M3D.XHRLoader(scope.manager);
        loader.setPath(path);

        var shaders = [];
        var json = JSON.parse(text);
        var n = json.shaders.length;

        for (var i = 0; i < n; i++) {
            var shader = json.shaders[i];
            loader.load(shader.file, function(text) {
                shaders.push({
                    type: shader.type,
                    source: text
                });
            });
        }

        return shaders;
    }

}