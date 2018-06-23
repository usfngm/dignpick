angular
    .module("digAPP")
    .controller('manageRestCtrl', function ($scope, $rootScope, $state, $window) {
        $('#manageRestContainer').hide();
        console.log('manage');
        var data = [];
        var docRef = db.collection('places');
        $rootScope.isLoading = true;
        docRef
            .get()
            .then(function (querySnapshot) {
                var i = 1;
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    var place = {
                        'id': i,
                        'name': doc
                            .data()
                            .name,
                        'uid': doc.id,
                    };
                    data.push(place);
                    i++;
                });
                $('#table').bootstrapTable({ data: data });
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageRestContainer').show();
            });

        $scope.editPlace = (index) => {
            $state.go('editRest', { 'restID': data[index].uid });
        }

        $scope.editMenu = (index) => {
            $rootScope.currentRest = data[index].name;
            $state.go('editMenu',
                {
                    'restID': data[index].uid
                });
        }

        $scope.deletePlace = (index) => {
            bootbox.confirm({
                message: "Are you sure you want to delete '" + data[index].name + "'?",
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
                        var docRef = db.collection('places').doc(data[index].uid);
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        docRef.delete().then((doc) => {
                            docRef = db.collection('branches').doc(data[index].uid);
                            docRef.delete().then((doc) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.success("Place Deleted");
                                console.log("Document successfully deleted!");
                                data.splice(index, 1);
                                $('#table').bootstrapTable('load', data);
                            }).catch((error) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error("Error in place deleting");
                                console.error("Error removing document: ", error);
                            });
                        }).catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error("Error in place deleting");
                            console.error("Error removing document: ", error);
                        })
                    }
                }
            });
        }

        formatDeletePlaceButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deletePlace(' + index + ')" type="button" class="btn btn-danger">Delete</button>'
        }

        formatEditPlaceButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editPlace(' + index + ')" type="button" class="btn btn-primary">Edit Info</button>'
        }

        formatEditMenuButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editMenu(' + index + ')" type="button" class="btn btn-primary">Manage Menu</button>'
        }

        $scope.createPlace = () => {
            $state.go('newRest');
        };


    });