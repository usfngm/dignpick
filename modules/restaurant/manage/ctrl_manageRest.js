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
                    var place = doc.data();
                    place['uid'] = doc.id;
                    data.push(place);
                    i++;
                });
                $('#table').bootstrapTable({data: data});
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageRestContainer').show();
            });

        $scope.editPlace = (uid) => {
            var index = getIndexFromUID(data, uid);
            $state.go('editRest', {'restID': data[index].uid});
        }

        $scope.editMenu = (uid) => {
            var index = getIndexFromUID(data, uid);
            $rootScope.currentRest = data[index].name;
            $state.go('editMenu', {'restID': data[index].uid});
        }

        $scope.deletePlace = (uid) => {
            var index = getIndexFromUID(data, uid);
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
                callback: async function (result) {
                    if (result) {
                        try {
                            console.log(data[index]);
                            $rootScope.isLoading = true;
                            $rootScope.$digest();

                            var storageRef = firebase
                                .storage()
                                .ref();

                            if (data[index].coverPhotoLoc) {
                                console.log("DELETING " + data[index].coverPhotoLoc);
                                await storageRef
                                    .child(data[index].coverPhotoLoc)
                                    .delete();
                                console.log(data[index].coverPhotoLoc + " DELETED");
                            }

                            for (var i = 0; i < data[index].gallery.length; i++) {
                                console.log("DELETING " + data[index].gallery[i].fileLoc);
                                await storageRef
                                    .child(data[index].gallery[i].fileLoc)
                                    .delete();
                                console.log(data[index].gallery[i].fileLoc + " DELETED");
                            }
                        } catch (e) {
                            console.log(e.t);
                        }

                        try {

                            await db
                                .collection('places')
                                .doc(data[index].uid)
                                .delete();

                            await db
                                .collection('branches')
                                .doc(data[index].uid)
                                .delete();

                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success("Place Deleted");
                            console.log("Document successfully deleted!");
                            data.splice(index, 1);
                            $('#table').bootstrapTable('load', data);

                        } catch (e) {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error("Error in Deletion");
                        }

                    }
                }
            });
        }

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatDeletePlaceButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deletePlace(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-danger">Delete</button>'
        }

        formatEditPlaceButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editPlace(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Edit Info</button>'
        }

        formatEditMenuButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editMenu(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Manage Menu</button>'
        }

        $scope.createPlace = () => {
            $state.go('newRest');
        };

    });