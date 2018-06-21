angular.module("digAPP").controller('loginCtrl', function ($scope, $rootScope) {
    console.log('LOGINN BRUH');
    $scope.login = (event) => {
        $rootScope.isLoading = true;
        console.log($rootScope);
        firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password).then((user) => {
            $rootScope.isLoading = false;
            $rootScope.$digest();
        }).catch(function(error) {
            var errorCode = error.code;
            if (errorCode == 'auth/invalid-email' || 
                errorCode == 'auth/user-not-found' || 
                errorCode == 'auth/wrong-password') {
                $scope.isWrong = true;
            }
            $rootScope.isLoading = false;
            $rootScope.$digest();
        });
    }
});