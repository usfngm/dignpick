angular
    .module("digAPP")
    .controller('editDrinks', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        $('#editDrinksContainer').hide();

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
                        .collection("drinks")
                        .where("place", "==", $scope.uid)
                        .get()
                        .then((drinksResults) => {
                            for (var j = 0; j < drinksResults.size; j++) {
                                var tempDrink = drinksResults.docs[j].data();
                                tempDrink.uid = drinksResults.docs[j].id;
                                restItems.push(tempDrink);
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
            $('#mainDrinkTable').bootstrapTable({ data: restItems });
            $('#editDrinksContainer').show();
        }, () => {
            $('#editDrinksContainer').show();
            $rootScope.isLoading = false;
            $rootScope.$digest();
            $state.go('manageRest');
        })

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatDrinkPrice = (value, row, index, field) => {
            return '&#163;' + restItems[index].price;
        }

        $scope.editItem = (index) => {
            $scope.currentDrinkName = restItems[index].name;
            $scope.currentDrinkPrice = restItems[index].price;
            $scope.currentDrinkIndex = index;
            $('#editDrinkModal').modal('show');
            $scope.$digest();
        }

        $scope.editItemSubmit = () => {
            var uid = restItems[$scope.currentDrinkIndex].uid;
            var tempDrink = restItems[$scope.currentDrinkIndex];
            tempDrink.name = $scope.currentDrinkName;
            tempDrink.price = $scope.currentDrinkPrice;
            $('#editDrinkModal').modal('hide');
            $rootScope.isLoading = true;
            db.collection("drinks").doc(uid).set(tempDrink).then((doc) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Updated");
                restItems[$scope.currentDrinkIndex] = tempDrink;
                $('#mainDrinkTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Update Failed");
            })
        }

        $scope.newItem = () => {
            $('#createDrinkModal').modal('show');
        }

        $scope.createItemSubmit = () => {
            $('#createDrinkModal').modal('hide');
            $rootScope.isLoading = true;
            var tempDrink = {
                'name': $scope.newItemName,
                'price': $scope.newItemPrice,
                'place': $scope.uid,
            };
            console.log(tempDrink);
            db.collection('drinks').add(tempDrink).then((doc) => {
                tempDrink.uid = doc.id;
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Added");
                restItems.push(tempDrink);
                $scope.newItemName = '';
                $scope.newItemPrice = '';
                $('#mainDrinkTable').bootstrapTable('load', restItems);
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
                        db.collection("drinks").doc(restItems[index].uid).delete().then((doc) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success("Item Deleted");
                            console.log("Document successfully deleted!");
                            restItems.splice(index, 1);
                            $('#mainDrinkTable').bootstrapTable('load', restItems);
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

        formatEditDrinkButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editItem(' + index + ')" type="button" class="btn btn-primary">Edit Item</button>'
        }

        formatDeleteDrinkButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteItem(' + index + ')" type="button" class="btn btn-danger">Delete Item</button>'
        }
    });