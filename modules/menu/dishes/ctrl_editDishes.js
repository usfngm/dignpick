angular
    .module("digAPP")
    .controller('editDishes', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        $('#editDishesContainer').hide();

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
                        .collection("dishes")
                        .where("place", "==", $scope.uid)
                        .get()
                        .then((dishesResults) => {
                            for (var j = 0; j < dishesResults.size; j++) {
                                var tempDish = dishesResults.docs[j].data();
                                tempDish.uid = dishesResults.docs[j].id;
                                restItems.push(tempDish);
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
            $('#mainDishTable').bootstrapTable({ data: restItems });
            $('#editDishesContainer').show();
        }, () => {
            $('#editDishesContainer').show();
            $rootScope.isLoading = false;
            $rootScope.$digest();
            $state.go('manageRest');
        })

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatDishPrice = (value, row, index, field) => {
            return '&#163;' + restItems[index].price;
        }

        $scope.editItem = (uid) => {
            var index = getIndexFromUID(restItems, uid);
            $scope.currentDishName = restItems[index].name;
            $scope.currentDishPrice = restItems[index].price;
            $scope.currentDishIndex = index;
            $('#editDishModal').modal('show');
            $scope.$digest();
        }

        $scope.editItemSubmit = () => {
            var uid = restItems[$scope.currentDishIndex].uid;
            var tempDish = restItems[$scope.currentDishIndex];
            tempDish.name = $scope.currentDishName;
            tempDish.price = $scope.currentDishPrice;
            $('#editDishModal').modal('hide');
            $rootScope.isLoading = true;
            db.collection("dishes").doc(uid).set(tempDish).then((doc) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Updated");
                restItems[$scope.currentDishIndex] = tempDish;
                $('#mainDishTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Update Failed");
            })
        }

        $scope.newItem = () => {
            $('#createDishModal').modal('show');
        }

        $scope.createItemSubmit = () => {
            $('#createDishModal').modal('hide');
            $rootScope.isLoading = true;
            var tempDish = {
                'name': $scope.newItemName,
                'price': $scope.newItemPrice,
                'place': $scope.uid,
            };
            console.log(tempDish);
            db.collection('dishes').add(tempDish).then((doc) => {
                tempDish.uid = doc.id;
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.success("Item Added");
                restItems.push(tempDish);
                $scope.newItemName = '';
                $scope.newItemPrice = '';
                $('#mainDishTable').bootstrapTable('load', restItems);
            }).catch((error) => {
                $rootScope.isLoading = false;
                $rootScope.$digest();
                toastr.error("Item Creation Failed");
            });
        }

        $scope.deleteItem = (uid) => {
            var index = getIndexFromUID(restItems, uid);
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
                        db.collection("dishes").doc(restItems[index].uid).delete().then((doc) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success("Item Deleted");
                            console.log("Document successfully deleted!");
                            restItems.splice(index, 1);
                            $('#mainDishTable').bootstrapTable('load', restItems);
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

        formatEditDishButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editItem(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Edit Item</button>'
        }

        formatDeleteDishButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteItem(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-danger">Delete Item</button>'
        }
    });