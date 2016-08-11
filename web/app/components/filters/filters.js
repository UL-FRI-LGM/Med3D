/**
 * Created by Primoz on 31. 07. 2016.
 */

app.filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
        if (input === undefined) {
            return "100%";
        }
        return $filter('number')(input, decimals) + '%';
    };
}]);