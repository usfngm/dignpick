angular
    .module("digAPP")
    .controller('homeCtrl', function ($scope, $rootScope, $state, $window) {
        $scope.userName = JSON
            .parse($window.sessionStorage.user)
            .name;
        $scope.logout = () => {
            firebase
                .auth()
                .signOut();
        }
    });