angular
    .module("digAPP")
    .controller('manageUserCtrl', function ($scope, $rootScope, $state, $stateParams, $window, $timeout, $http) {

        var user;
        $scope.uid = $stateParams.userID;
        console.log('EDIT ' + $scope.uid);
        $('#manageSingleUserContainer').hide();
        $rootScope.isLoading = true;

        var docRef = db
            .collection("users")
            .doc($scope.uid);

        docRef
            .get()
            .then(function (doc) {
                if (doc.exists) {
                    user = doc.data();
                    $scope.userName = user.name;
                    $scope.userEmail = user.email;
                    $scope.userMobile = user.mobile;
                    $scope.userCountry = user.country;
                    $scope.userCity = user.city;
                    $scope.userLevel = user.level;
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $('#manageSingleUserContainer').show();
                } else {
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $state.go('viewAddUsers');
                }
            })
            .catch(function (error) {
                console.log("Error getting document:", error);
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageSingleUserContainer').show();
            });


        $scope.back = () => {
            $state.go('viewAddUsers');
        }

        $scope.updateUser = () => {

            $rootScope.isLoading = true;

            user['email'] = $scope.userEmail;
            user['name'] = $scope.userName;
            user['mobile'] = $scope.userMobile;
            user['city'] = $scope.userCity;
            user['country'] = $scope.userCountry;
            user['level'] = $scope.userLevel;

            var docRef = db
                .collection("users")
                .doc($scope.uid);

            docRef
                .set(user)
                .then((doc) => {
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $state.go('viewAddUsers');
                    toastr.success("User Updated");
                })
                .catch((error) => {
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    toastr.error("Error");
                });

        }

    });