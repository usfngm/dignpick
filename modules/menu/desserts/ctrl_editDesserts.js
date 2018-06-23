angular
    .module("digAPP")
    .controller('editDesserts', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        $('#editDessertsContainer').hide();

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
                        .collection("desserts")
                        .where("place", "==", $scope.uid)
                        .get()
                        .then((dessertsResults) => {
                            for (var j = 0; j < dessertsResults.size; j++) {
                                var tempDessert = dessertsResults.docs[j].data();
                                tempDessert.uid = dessertsResults.docs[j].id;
                                restItems.push(tempDessert);
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
            $('#mainDessertTable').bootstrapTable({ data: restItems });
            $('#editDessertsContainer').show();
        }, () => {
            $('#editDessertsContainer').show();
            $rootScope.isLoading = false;
            $rootScope.$digest();
            $state.go('manageRest');
        })

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatDessertPrice = (value, row, index, field) => {
            return '&#163;' + restItems[index].price;
        }

        $scope.editItem = (index) => {
            $scope.currentDessertName = restItems[index].name;
            $scope.currentDessertPrice = restItems[index].price;
            $scope.currentDessertIndex = index;
            $('#editDessertModal').modal('show');
            $scope.$digest();
        }

        $scope.editItemSubmit = () => {
            var uid = restItems[$scope.currentDessertIndex].uid;
            var tempDessert = restItems[$scope.currentDessertIndex];
            tempDessert.name = $scope.currentDessertName;
            tempDessert.price = $scope.currentDessertPrice;
            $('#editDessertModal').modal('hide');
            $rootScope.isLoading = true;
            db.collection("desserts").doc(uid).set(tempDessert).then((doc) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Updated");
                restItems[$scope.currentDessertIndex] = tempDessert;
                $('#mainDessertTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Update Failed");
            })
        }

        $scope.newItem = () => {
            $('#createDessertModal').modal('show');
        }

        $scope.createItemSubmit = () => {
            $('#createDessertModal').modal('hide');
            $rootScope.isLoading = true;
            var tempDessert = {
                'name': $scope.newItemName,
                'price': $scope.newItemPrice,
                'place': $scope.uid,
            };
            console.log(tempDessert);
            db.collection('desserts').add(tempDessert).then((doc) => {
                tempDessert.uid = doc.id;
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Added");
                restItems.push(tempDessert);
                $scope.newItemName = '';
                $scope.newItemPrice = '';
                $('#mainDessertTable').bootstrapTable('load', restItems);
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
                        db.collection("desserts").doc(restItems[index].uid).delete().then((doc) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success("Item Deleted");
                            console.log("Document successfully deleted!");
                            restItems.splice(index, 1);
                            $('#mainDessertTable').bootstrapTable('load', restItems);
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

        formatEditDessertButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editItem(' + index + ')" type="button" class="btn btn-primary">Edit Item</button>'
        }

        formatDeleteDessertButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteItem(' + index + ')" type="button" class="btn btn-danger">Delete Item</button>'
        }
    });