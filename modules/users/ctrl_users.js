angular
    .module("digAPP")
    .controller('usersCtrl', function ($scope, $rootScope, $state, $http, $window) {
        $scope.userLevel = 'User';
        $scope.isWrong = false;
        var data = [];
        var locationsData = [];
        var parentCountry;

        loadAllData = async function () {

            let users = await db
                .collection('users')
                .get();
            let locations = await db
                .collection('locations')
                .get();

            users.forEach((user) => {
                var temp = user.data();
                temp['uid'] = user.id;
                data.push(temp);
            });

            locations.forEach((location) => {
                var temp = location.data();
                temp['uid'] = location.id;
                locationsData.push(temp);
            });

            $scope.countries = locationsData;

            $('#manageUsersTable').bootstrapTable({data: data});

        }

        $('#manageUsersContainer').hide();
        $rootScope.isLoading = true;
        (async() => {
            try {
                await loadAllData();
                $rootScope.isLoading = false;
                $scope.$digest();
                $rootScope.$digest();
                $('#manageUsersContainer').show();
            } catch (e) {
                $rootScope.isLoading = false;
                $scope.$digest();
                $rootScope.$digest();
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
                for ( var i = 0; i < parentCountry.states.length; i++ )
                {
                    if ( parentCountry.states[i].name == stateName )
                    {
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

        $scope.manageUser = (uid) => {
            var index = getIndexFromUID(data, uid);
            $state.go('manageUser', {'userID': data[index].uid});
        }

        $scope.deleteUser = (uid) => {
            var index = getIndexFromUID(data, uid);
            toastr.options = {
                "positionClass": "toast-bottom-right"
            };
            console.log('delete user ' + data[index].name);
            bootbox.confirm({
                message: "Are you sure you want to delete the user '" + data[index].name + "'?",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    if (result) {
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        $http({
                                method: "POST",
                                url: "https://us-central1-dignpick.cloudfunctions.net/api/deleteUser",
                                data: {
                                    'uid': data[index].uid
                                }
                            }).then(function mySuccess(response) {
                            $rootScope.isLoading = false;
                            toastr.success("User Deleted");
                            console.log("Document successfully deleted!");
                            data.splice(index, 1);
                            $('#manageUsersTable').bootstrapTable('load', data);
                        }, function myError(response) {
                            $rootScope.isLoading = false;
                            toastr.error("Error in user deleting");
                            console.error("Error removing document: ", error);
                        });
                    }
                }
            });
        }

        formatIDCount = (value, row, index, field) => {
            return index + 1;
        }

        formatManageButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().manageUser(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Manage</button>'
        }

        formatDeleteButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteUser(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-danger">Delete</button>'
        }

        $scope.createUser = () => {
            $rootScope.isLoading = true;

            var user = {
                'email': $scope.userEmail,
                'name': $scope.userName,
                'password': $scope.userPassword,
                'mobile': $scope.userMobile,
                'state': $scope.userCity,
                'country': $scope.userCountry,
                'area': $scope.userArea,
                'level': $scope.userLevel
            };

            $http({
                    method: "POST",
                    url: "https://us-central1-dignpick.cloudfunctions.net/api/registerNewUser",
                    data: {
                        'user': user
                    }
                }).then(function mySuccess(response) {
                var createdUser = response.data.user;
                data.push(createdUser);
                $('#manageUsersTable').bootstrapTable('load', data);
                $rootScope.isLoading = false;
                toastr.success("User Created");
                $scope.userName = '';
                $scope.userPassword = '';
                $scope.userEmail = '';
                $scope.userCity = '';
                $scope.userMobile = '';
                $scope.userCountry = '';
                $scope.userLevel = 'User';
            }, function myError(response) {
                $rootScope.isLoading = false;
                console.log(response.data);
                toastr.error("Error " + response.data.Error.message);
            });
        }
    });