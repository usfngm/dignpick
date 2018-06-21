//Helper methods

angular
    .module("digAPP")
    .controller('newRestCtrl', function ($scope, $rootScope, $state, $window, $timeout, $http) {
        var map;
        var marker;

        var places_array = [];
        var table_data = [];

        var branches_list = [];

        $scope.restOutdoorsTag = false;
        $scope.restAtHomeTag = false;
        $scope.restShishaTag = false;
        $scope.restIndoorsTag = false;
        $scope.restFoodTag = false;
        $scope.restDateTag = false;
        $scope.restActivityTag = false;
        $scope.restReadTag = false;
        $scope.restWifiTag = false;
        $scope.restNightLifeTag = false;

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
                    'showOnMap': '<button onclick="angular.element(this).scope().showOnMap(' + i + ')" type="button" class="btn btn-primary">Show on map</button>',
                    'addToList': '<button onclick="angular.element(this).scope().addMapBranch(' + i + ')" type="button" class="btn btn-primary">Add to List</button>'
                }
                table_data.push(obj);
            }
            console.log('table data');
            console.log(table_data);
            $('#mapSearchtable').bootstrapTable('append', table_data);
            console.log('APPENDED');
            console.log(places_array);
        }

        $scope.showOnMap = (index) => {
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

        $scope.showOnMap2 = (index) => {
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

        $scope.addMapBranch = (index) => {

            var obj = {
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
                'address': address,
                'geometry': {
                    'lat': Number(lat),
                    'lng': Number(lng)
                }
            }

            branches_list.push(obj);

            fillBranchsTable();

        }

        const fillBranchsTable = () => {
            $('#branchesList').bootstrapTable('removeAll');
            $('#branchesList').bootstrapTable('append', branches_list);
            console.log(branches_list);
        }

        $scope.deleteBranch = (index) => {
            branches_list.splice(index, 1);
            fillBranchsTable();
        }

        formatID = (value, row, index, field) => {
            return index + 1;
        }

        formatShowOnMap = (value, row, index, field) => {
            //console.log(row);
            return '<button onclick="angular.element(this).scope().showOnMap2(' + index + ')" type="button" class="btn btn-primary">Show on map</button>'
        }

        formatDelete = (value, row, index, field) => {
            //console.log(row);
            return '<button onclick="angular.element(this).scope().deleteBranch(' + index + ')" type="button" class="btn btn-danger">Delete</button>'
        }

        $scope.submit = () => {
            $rootScope.isLoading = true;
            db
                .collection("places")
                .add({
                    name: $scope.restName,
                    description: $scope.restDescription,
                    foodType: $scope.restFoodType,
                    hotline: $scope.restHotline,
                    tags: {
                        outdoors: $scope.restOutdoorsTag,
                        atHome: $scope.restAtHomeTag,
                        shisha: $scope.restShishaTag,
                        indoors: $scope.restIndoorsTag,
                        food: $scope.restFoodTag,
                        date: $scope.restDateTag,
                        activity: $scope.restActivityTag,
                        read: $scope.restReadTag,
                        wifi: $scope.restWifiTag,
                        nightLife: $scope.restNightLifeTag
                    }
                })
                .then(function (docRef) {
                    addBranches(docRef.id);
                })
                .catch(function (error) {
                    console.error("Error adding document: ", error);
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                });
        }

        const addBranches = (id) => {
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
                .doc(id)
                .set({'branches': branches_list})
                .then(function () {
                    console.log("Document successfully written!");
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                });
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
