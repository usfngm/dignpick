//Helper methods

angular
    .module("digAPP")
    .controller('editRestCtrl', function ($scope, $rootScope, $state, $stateParams, $window, $timeout, $http) {

        $scope.uid = $stateParams.restID;
        console.log('EDIT ' + $scope.uid);
        $('#editRestContainer').hide();
        $('#editRestContainerBack').hide();
        $scope.rest_tags = [];
        $scope.rest_types = [];
        var map;
        var marker;
        var places_array = [];
        var table_data = [];
        var branches_list = [];

        loadAllData = async function () {
            let tags = await db
                .collection('tags')
                .get();
            tags.forEach((tag) => {
                var tempTag = tag.data();
                tempTag['uid'] = tag.id;
                $scope[tempTag.name + 'Tag'] = false;
                tempTag['selected'] = false;
                $scope
                    .rest_tags
                    .push(tempTag);
            });

            let types = await db
                .collection('restaurant_types')
                .get();
            types.forEach((type) => {
                var tempType = type.data();
                tempType['uid'] = type.id;
                $scope
                    .rest_types
                    .push(tempType);
            });

            let restaurant = await db
                .collection("places")
                .doc($scope.uid)
                .get();

            setRestData(restaurant.data());

            let branches = await db
                .collection("branches")
                .doc($scope.uid)
                .get();

            branches_list = branches
                .data()
                .branches;
            fillBranchsTable();
        }

        $rootScope.isLoading = true;
        (async() => {
            await loadAllData();
            $rootScope.isLoading = false;
            $scope.$digest();
            $rootScope.$digest();
            $('#editRestContainer').show();
            $('#editRestContainerBack').show();
        })()

        const fillBranchsTable = () => {
            $('#branchesList').bootstrapTable('removeAll');
            $('#branchesList').bootstrapTable('append', branches_list);
            console.log(branches_list);
        }

        const checkTag = (tag) => {
            for (var i = 0; i < $scope.rest_tags.length; i++) {
                if ($scope.rest_tags[i].name == tag) 
                    $scope.rest_tags[i].selected = true;
                }
            }

        const setRestData = (data) => {
            console.log(data);
            $scope.restName = data.name;
            $scope.restDescription = data.description;
            $scope.restFoodType = data.foodType;
            $scope.restHotline = data.hotline;
            Object
                .keys(data.tags)
                .forEach(function (key) {
                    if (data.tags[key]) {
                        checkTag(key);
                    }
                });
        }

        const searchMap = (query, token, cb, error) => {
            $http({
                    method: "POST",
                    url: "https://us-central1-dignpick.cloudfunctions.net/api/searchPlaces",
                    data: {
                        'query': query,
                        'token': token
                    }
                })
                .then(function mySuccess(response) {
                    console.log(response);
                    var places = JSON
                        .parse(response.data.body)
                        .results;
                    var nextPageToken = JSON
                        .parse(response.data.body)
                        .next_page_token;
                    var status = JSON
                        .parse(response.data.body)
                        .status;
                    if (status == 'OK') {
                        cb(places, nextPageToken);
                    }
                    if (nextPageToken) {
                        setTimeout(function () {
                            searchMap(query, nextPageToken, cb, error);
                        }, 1000);
                    } else if (status == 'INVALID_REQUEST' && token) {
                        setTimeout(function () {
                            searchMap(query, token, cb, error);
                        }, 1000);
                    }
                }, function fail(response) {
                    console.log('fail');
                    error(response);
                    console.log(response);
                });
        }

        const fillTable = () => {
            table_data = [];

            for (var i = 0; i < places_array.length; i++) {
                var obj = {
                    'name': places_array[i].name,
                    'address': places_array[i].formatted_address,
                    'showOnMap': '<button onclick="angular.element(this).scope().showOnMap(&quot;' + places_array[i].id + '&quot;)" type="button" class="btn btn-primary">Show on map</button>',
                    'addToList': '<button onclick="angular.element(this).scope().addMapBranch(&quot;' + places_array[i].id + '&quot;)" type="button" class="btn btn-primary">Add to List</button>'
                }
                table_data.push(obj);
            }
            console.log('table data');
            console.log(table_data);
            $('#mapSearchtable').bootstrapTable('append', table_data);
            console.log('APPENDED');
            console.log(places_array);
        }

        $scope.showOnMap = (uid) => {
            console.log(places_array);
            var index = getIndexFromUID(places_array, uid);
            if (marker) {
                marker.setMap(null)
            };
            console.log('SHOW ' + places_array[index].name + ' ON MAP');
            map.panTo(places_array[index].geometry.location);
            marker = new google
                .maps
                .Marker({position: places_array[index].geometry.location, map: map});
            map.setZoom(14);
        }

        $scope.showOnMap2 = (uid) => {
            var index = getIndexFromUID(branches_list, uid);
            if (marker) {
                marker.setMap(null)
            };
            map.panTo(branches_list[index].geometry);
            marker = new google
                .maps
                .Marker({position: branches_list[index].geometry, map: map});
            map.setZoom(14);
        }

        $scope.searchMap = () => {
            $('#mapSearchtable').bootstrapTable('removeAll');
            places_array = [];
            searchMap($scope.searchPlaceName, null, (places, next_token) => {
                places_array = places_array.concat(places);
                console.log(places_array);
                fillTable();
            }, (error) => {
                console.log(error);
            })
        }

        $scope.addMapBranch = (uid) => {
            var index = getIndexFromUID(places_array, uid);
            var obj = {
                'uid': places_array[index].id,
                'address': places_array[index].formatted_address,
                'geometry': {
                    'lat': places_array[index].geometry.location.lat,
                    'lng': places_array[index].geometry.location.lng
                }
            }

            branches_list.push(obj);

            fillBranchsTable();
        }

        $scope.addManualBranch = () => {
            var address = $scope.manualAddress;
            var lat = $scope.manualLatitude;
            var lng = $scope.manualLongitude;

            $scope.manualAddress = '';
            $scope.manualLatitude = '';
            $scope.manualLongitude = '';

            var obj = {
                'uid': Date.now() + '',
                'address': address,
                'geometry': {
                    'lat': Number(lat),
                    'lng': Number(lng)
                }
            }

            branches_list.push(obj);

            fillBranchsTable();

        }

        $scope.deleteBranch = (uid) => {
            var index = getIndexFromUID(branches_list, uid);
            branches_list.splice(index, 1);
            fillBranchsTable();
        }

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatShowOnMap = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().showOnMap2(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Show on map</button>'
        }

        formatDelete = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteBranch(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-danger">Delete</button>'
        }

        $scope.submit = () => {
            $rootScope.isLoading = true;

            var obj ={
                name: $scope.restName,
                description: $scope.restDescription,
                foodType: $scope.restFoodType,
                hotline: $scope.restHotline,
                tags: {}
            }

            $scope.rest_tags.forEach((tag) => {
                obj.tags[tag.name] = tag.selected;
            });

            db
                .collection("places")
                .doc($scope.uid)
                .set(obj)
                .then(function (docRef) {
                    addBranches();
                })
                .catch(function (error) {
                    console.error("Error adding document: ", error);
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                });
        }

        const addBranches = () => {
            console.log("ADDING BRANCHES TO DB");
            console.log(branches_list);
            for (var i = 0; i < branches_list.length; i++) {
                if (branches_list[i]['geometry.lat']) {
                    branches_list[i].geometry.lat = Number(branches_list[i]['geometry.lat']);
                    delete branches_list[i]['geometry.lat'];
                }
                if (branches_list[i]['geometry.lng']) {
                    branches_list[i].geometry.lng = Number(branches_list[i]['geometry.lng']);
                    delete branches_list[i]['geometry.lng'];
                }
            }
            db
                .collection("branches")
                .doc($scope.uid)
                .set({'branches': branches_list})
                .then(function () {
                    console.log("Document successfully written!");
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $state.go('manageRest');
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                });
        }

        $scope.back = () => {
            $state.go('manageRest');
        }

        init_map = () => {
            map = new google
                .maps
                .Map(document.getElementById('map'), {
                    zoom: 5,
                    center: {
                        lat: 26.8206,
                        lng: 30.8025
                    }
                });
        }
        $timeout(function () {
            init_map();
            $('#mapSearchtable').bootstrapTable({data: table_data});
            $('#branchesList').bootstrapTable({data: branches_list});
        });
    });
