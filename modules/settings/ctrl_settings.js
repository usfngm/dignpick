angular
    .module("digAPP")
    .controller('settingsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        console.log('test settings');
        $state.go('locationsSettings');
    });