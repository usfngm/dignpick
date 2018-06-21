angular
    .module("digAPP")
    .controller('menuCtrl', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        console.log('EDIT ' + $scope.uid);
    });