angular
    .module("digAPP")
    .controller('menuCtrl', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        $scope.restName = $rootScope.currentRest;
        if (!$rootScope.currentRest)
        {
            db.collection('places').doc($scope.uid).get().then((doc) => {
                $scope.restName = doc.data().name;
            }).catch((error) => {

            });
        }
        $state.go('editMenuDishes', { 'restID': $stateParams.restID });
    });