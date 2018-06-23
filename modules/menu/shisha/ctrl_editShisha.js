angular
    .module("digAPP")
    .controller('editShisha', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        $('#editShishaContainer').hide();

        var rest;
        var restItems = [];

        loadAllData = (success, fail) => {
            db
                .collection("places")
                .doc($scope.uid)
                .get()
                .then((doc) => {
                    rest = doc.data();
                    db
                        .collection("shisha")
                        .where("place", "==", $scope.uid)
                        .get()
                        .then((shishaResults) => {
                            for (var j = 0; j < shishaResults.size; j++) {
                                var tempShisha = shishaResults.docs[j].data();
                                tempShisha.uid = shishaResults.docs[j].id;
                                restItems.push(tempShisha);
                            }
                            success();
                        })
                        .catch((error) => {
                            fail();
                        });
                })
                .catch((error) => {
                    fail();
                });

        };

        $scope.uid = $stateParams.restID;
        console.log('EDIT ' + $scope.uid);
        $rootScope.isLoading = true;
        loadAllData(() => {
            $scope.restName = rest.name;
            $rootScope.isLoading = false;
            $rootScope.$digest();
            console.log(rest);
            console.log(restItems);
            $('#mainShishaTable').bootstrapTable({ data: restItems });
            $('#editShishaContainer').show();
        }, () => {
            $('#editShishaContainer').show();
            $rootScope.isLoading = false;
            $rootScope.$digest();
            $state.go('manageRest');
        })

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatShishaPrice = (value, row, index, field) => {
            return '&#163;' + restItems[index].price;
        }

        $scope.editItem = (index) => {
            $scope.currentShishaName = restItems[index].name;
            $scope.currentShishaPrice = restItems[index].price;
            $scope.currentShishaIndex = index;
            $('#editShishaModal').modal('show');
            $scope.$digest();
        }

        $scope.editItemSubmit = () => {
            var uid = restItems[$scope.currentShishaIndex].uid;
            var tempShisha = restItems[$scope.currentShishaIndex];
            tempShisha.name = $scope.currentShishaName;
            tempShisha.price = $scope.currentShishaPrice;
            $('#editShishaModal').modal('hide');
            $rootScope.isLoading = true;
            db.collection("shisha").doc(uid).set(tempShisha).then((doc) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Updated");
                restItems[$scope.currentShishaIndex] = tempShisha;
                $('#mainShishaTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Update Failed");
            })
        }

        $scope.newItem = () => {
            $('#createShishaModal').modal('show');
        }

        $scope.createItemSubmit = () => {
            $('#createShishaModal').modal('hide');
            $rootScope.isLoading = true;
            var tempShisha = {
                'name': $scope.newItemName,
                'price': $scope.newItemPrice,
                'place': $scope.uid,
            };
            console.log(tempShisha);
            db.collection('shisha').add(tempShisha).then((doc) => {
                tempShisha.uid = doc.id;
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Added");
                restItems.push(tempShisha);
                $scope.newItemName = '';
                $scope.newItemPrice = '';
                $('#mainShishaTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Creation Failed");
            });
        }

        $scope.deleteItem = (index) => {
            console.log(restItems[index].uid);
            bootbox.confirm({
                message: "Are you sure you want to delete '" + restItems[index].name + "'?",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-primary'
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
                        db.collection("shisha").doc(restItems[index].uid).delete().then((doc) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success("Item Deleted");
                            console.log("Document successfully deleted!");
                            restItems.splice(index, 1);
                            $('#mainShishaTable').bootstrapTable('load', restItems);
                        }).catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error("Error in user deleting");
                            console.error("Error removing document: ", error);
                        });
                    }
                }
            });
        }

        formatEditShishaButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editItem(' + index + ')" type="button" class="btn btn-primary">Edit Item</button>'
        }

        formatDeleteShishaButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteItem(' + index + ')" type="button" class="btn btn-danger">Delete Item</button>'
        }
    });