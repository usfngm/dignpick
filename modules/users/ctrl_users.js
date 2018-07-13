angular
    .module("digAPP")
    .controller('usersCtrl', function ($scope, $rootScope, $state, $http, $window) {
        $('#manageUsersContainer').hide();
        $scope.isWrong = false;
        var data = [];
        var docRef = db.collection('users');
        $rootScope.isLoading = true;
        docRef
            .get()
            .then(function (querySnapshot) {
                var i = 1;
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    var place = {
                        'uid': doc.data().uid,
                        'name': doc
                            .data()
                            .name,
                        'email': doc.data().email,
                        'city': doc.data().city,
                        'mobile': doc.data().mobile,
                        'delete': '<button type="button" class="btn btn-danger">Delete</button>'
                    };
                    data.push(place);
                    i++;
                });
                $('#manageUsersTable').bootstrapTable({ data: data });
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageUsersContainer').show();
            });

        $scope.manageUser = (uid) => {
            var index = getIndexFromUID(data, uid);
            $state.go('manageUser', { 'userID': data[index].uid });
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
                'city': $scope.userCity,
                'country': $scope.userCountry
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
            }, function myError(response) {
                $rootScope.isLoading = false;
                console.log(response.data);
                toastr.error("Error " + response.data.Error.message);
            });
        }
    });