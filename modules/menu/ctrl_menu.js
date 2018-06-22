angular
    .module("digAPP")
    .controller('menuCtrl', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.uid = $stateParams.restID;
        
        $('#editMenuContainerBack').hide();
        $('#editMenuContainer').hide();

        var rest;
        var restDrinks = [];
        var restDishes = [];
        var restShisha = [];
        var restDesserts = [];

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
                            for (var i = 0; i < drinksResults.size; i++) {
                                restDrinks.push(drinksResults.docs[i].data());
                            }
                            db
                                .collection("dishes")
                                .where("place", "==", $scope.uid)
                                .get()
                                .then((dishesResults) => {
                                    for (var j = 0; j < dishesResults.size; j++) {
                                        restDishes.push(dishesResults.docs[j].data());
                                    }
                                    success();
                                })
                                .catch((error) => {
                                    fail();
                                });
                        })
                        .catch((error) => {
                            fail();
                        })
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
            console.log(restDishes);
            console.log(restDrinks);
            $('#editMenuContainerBack').show();
            $('#editMenuContainer').show();
        }, () => {
            $('#editMenuContainerBack').show();
            $('#editMenuContainer').show();
            $rootScope.isLoading = false;
            $rootScope.$digest();
            $state.go('manageRest');
        })

    

    });