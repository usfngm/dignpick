angular
    .module("digAPP")
    .controller('manageUserCtrl', function ($scope, $rootScope, $state, $stateParams, $window, $timeout, $http) {

        //HALA
        var user;
        $scope.uid = $stateParams.userID;
        console.log('EDIT ' + $scope.uid);
        var data = [];
        var locationsData = [];
        var parentCountry;

        loadAllData = async function () {

            let userDB = await db
                .collection('users')
                .doc($scope.uid)
                .get();

            let locations = await db
                .collection('locations')
                .get();

            locations.forEach((location) => {
                var temp = location.data();
                temp['uid'] = location.id;
                locationsData.push(temp);
            });

            
            $scope.countries = locationsData;
            user = userDB.data();
            $scope.userName = user.name;
            $scope.userEmail = user.email;
            $scope.userMobile = user.mobile;
            $scope.userCountry = user.country;
            $scope.userState = user.state;
            $scope.userArea = user.area;
            $scope.userLevel = user.level;

            $scope.countryChanged(user.country);
            $scope.stateChanged(user.state);
        }

        $('#manageSingleUserContainer').hide();
        $rootScope.isLoading = true;
        (async() => {
            try {
                await loadAllData();
                $rootScope.isLoading = false;
                $scope.$digest();
                $rootScope.$digest();
                $('#manageSingleUserContainer').show();
            } catch (e) {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $state.go('viewAddUsers');
                toastr.error("Loading Error");
            }

        })()

        $scope.countryChanged = (countryName) => {
            if (countryName) {
                for (var i = 0; i < locationsData.length; i++) {
                    if (locationsData[i].name == countryName) {
                        parentCountry = locationsData[i];
                        parentCountryIndex = i;
                        $scope.states = parentCountry.states;
                        break;
                    }
                }
            } else {
                $scope.states = null;
                $scope.areas = null;
            }
        }

        $scope.stateChanged = (stateName) => {
            if (stateName) {
                for (var i = 0; i < parentCountry.states.length; i++) {
                    if (parentCountry.states[i].name == stateName) {
                        parentState = parentCountry.states[i];
                        parentStateIndex = i;
                        $scope.areas = parentCountry.states[i].areas;
                        break;
                    }
                }
            } else {
                $scope.areas = null;
            }
        }

        //HALA

        $scope.back = () => {
            $state.go('viewAddUsers');
        }

        $scope.updateUser = () => {

            $rootScope.isLoading = true;

            user['email'] = $scope.userEmail;
            user['name'] = $scope.userName;
            user['mobile'] = $scope.userMobile;
            user['state'] = $scope.userState;
            user['country'] = $scope.userCountry;
            user['level'] = $scope.userLevel;
            user['area'] = $scope.userArea;

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