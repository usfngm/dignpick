angular
    .module("digAPP")
    .controller('locationSettingsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        var locationsData = [];
        var parentCountry;
        var parentCountryIndex;
        var parentState;
        var parentStateIndex;
        var mode = 'new';
        var editIndex;
        var depth = 0;
        $('#locationSettingsContainer').hide();
        $rootScope.isLoading = true;

        resetLocationTable = () => {
            depth = 0;
            $('#countryNameBread').hide();
            $('#stateNameBread').hide();
            locationsData = JSON.parse(locationsDataJSON);
            $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
            countryTableLoaded();
        }

        unbindCallbacks = (i) => {
            for (var j = 0; j < i; j++) {
                $('#country' + j).unbind('click');
            }
        }

        listenForSearchEvents = () => {
            $('#countryFilterTable')
                .on('search.bs.table', function (e, element) {
                    if (depth == 0) {
                        countryTableLoaded();
                    } else if (depth == 1) {
                        statesTableLoaded(parentCountryIndex);
                    } else if (depth == 2) {
                        areasTableLoaded(parentCountryIndex);
                    }
                });
        }

        areasTableLoaded = (i) => {
            $('#countryFilterTable').bootstrapTable('hideColumn', 'expandBtn');
            $('#countryNameBread').unbind('click');
            $('#countryNameBread').click(() => {
                depth = 1;
                $('#stateNameBread').hide();
                $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states});
                statesTableLoaded(i);
                $('#countryFilterTable').bootstrapTable('resetSearch', '');
            })
            console.log(depth);
            console.log('PARENT COUNTRY = ' + parentCountry.name);
            console.log('PARENT STATE = ' + parentState.name);
            $('#newBtn').text('New Area');
        }

        statesTableLoaded = (i) => {
            $('#countryFilterTable').bootstrapTable('showColumn', 'expandBtn');
            for (let j = 0; j < locationsData[i].states.length; j++) {
                $('#country' + locationsData[i].states[j].name + locationsData[i].states[j].name.length).click(() => {
                    parentState = locationsData[i].states[j];
                    parentStateIndex = j;
                    depth++;
                    $('#stateNameBread').text(locationsData[i].states[j].name);
                    $('#stateNameBread').show();
                    unbindCallbacks(locationsData[i].states.length);
                    $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states[j].areas});
                    areasTableLoaded(i);
                    $('#countryFilterTable').bootstrapTable('resetSearch', '');
                });
            }
            console.log(depth);
            console.log('PARENT COUNTRY = ' + parentCountry.name);
            $('#newBtn').text('New Province');
        }
        countryTableLoaded = () => {
            $('#countryFilterTable').bootstrapTable('showColumn', 'expandBtn');
            for (let i = 0; i < locationsData.length; i++) {
                console.log('hello');
                $('#country' + locationsData[i].name + locationsData[i].name.length).click(() => {
                    parentCountry = locationsData[i];
                    parentCountryIndex = i;
                    depth++;
                    $('#countryNameBread').text(locationsData[i].name);
                    $('#countryNameBread').show();
                    unbindCallbacks(locationsData.length);
                    $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states});
                    statesTableLoaded(i);
                    $('#countryFilterTable').bootstrapTable('resetSearch', '');
                });
            }
            console.log(depth);
            $('#newBtn').text('New Country');
        }

        $('#homeNameBread').click(() => {
            depth = 0;
            $('#countryNameBread').hide();
            $('#stateNameBread').hide();
            $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
            countryTableLoaded();
            $('#countryFilterTable').bootstrapTable('resetSearch', '');
        });

        db
            .collection('locations')
            .get()
            .then((results) => {
                results.forEach(result => {
                    var tempResult = result.data();
                    tempResult['uid'] = result.id;
                    locationsData.push(tempResult);
                });
                console.log(locationsData);
                $('#countryFilterTable').bootstrapTable({data: locationsData});
                countryTableLoaded();
                listenForSearchEvents();
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#locationSettingsContainer').show();
            })
            .catch((error) => {
                console.log("ERROR FROM WEB");
                console.log(error);
            });

        formatIDCount = (value, row, index, field) => {
            return index + 1;
        }

        formatEditButton = (value, row, index, field) => {
            if (depth == 1) {
                parentCountry.states[index].uid = parentCountry.states[index].name + Date.now();
            } else if (depth == 2) {
                parentCountry.states[parentStateIndex].areas[index].uid = parentCountry.states[parentStateIndex].areas[index].name + Date.now();
            }
            return '<button onclick="angular.element(this).scope().editLocation(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Edit</button>'

        }

        formatDeleteButton = (value, row, index, field) => {
            if (depth == 1) {
                parentCountry.states[index].uid = parentCountry.states[index].name + Date.now();
            } else if (depth == 2) {
                parentCountry.states[parentStateIndex].areas[index].uid = parentCountry.states[parentStateIndex].areas[index].name + Date.now();
            }
            return '<button onclick="angular.element(this).scope().deleteLocation(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-danger">Delete</button>'
        }

        $scope.editLocation = (uid) => {

            mode = 'edit';

            if (depth == 0) {
                var index = getIndexFromUID(locationsData, uid);
                editIndex = index;
                $('#createLocationItemModalTitle').text('Edit Country');
                $('#createLocationItemLabel').text('Country Name');
                $('#createLocationItemInput').attr('placeholder', 'Country Name (Ex. Egypt)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Edit');
                $scope.locationName = locationsData[index].name;
                $scope.$digest();
            } else if (depth == 1) {
                var index = getIndexFromUID(parentCountry.states, uid);
                editIndex = index;
                $('#createLocationItemModalTitle').text('Edit Province');
                $('#createLocationItemLabel').text('Province Name');
                $('#createLocationItemInput').attr('placeholder', 'Province Name (Ex. Cairo)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Edit');
                $scope.locationName = parentCountry.states[index].name;
                $scope.$digest();
            } else if (depth == 2) {
                var index = getIndexFromUID(parentState.areas, uid);
                editIndex = index;
                $('#createLocationItemModalTitle').text('Edit Area');
                $('#createLocationItemLabel').text('Area Name');
                $('#createLocationItemInput').attr('placeholder', 'Area Name (Ex. Nasr City)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Edit');
                $scope.locationName = parentState.areas[index].name;
                $scope.$digest();
            }
            $('#createLocationItemModal').modal('show');
        }

        $scope.deleteLocation = (uid) => {
            if (depth == 0) {
                var index = getIndexFromUID(locationsData, uid);
                bootbox.confirm({
                    message: "Are you sure you want to delete '" + locationsData[index].name + "'?",
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
                            db
                                .collection('locations')
                                .doc(locationsData[index].uid)
                                .delete()
                                .then((doc) => {
                                    locationsData.splice(index, 1);
                                    $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
                                    countryTableLoaded();
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.success('Location Deleted');
                                    $('#countryFilterTable').bootstrapTable('resetSearch', '');
                                })
                                .catch((error) => {
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.error('Error in deleting');
                                });
                        }
                    }
                });
            } else if (depth == 1) {
                var index = getIndexFromUID(parentCountry.states, uid);
                bootbox.confirm({
                    message: "Are you sure you want to delete '" + parentCountry.states[index].name + "'?",
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
                            var temp = JSON.parse(JSON.stringify(parentCountry));
                            temp
                                .states
                                .splice(index, 1);
                            db
                                .collection('locations')
                                .doc(parentCountry.uid)
                                .set(temp)
                                .then((doc) => {
                                    parentCountry
                                        .states
                                        .splice(index, 1);
                                    $('#countryFilterTable').bootstrapTable('load', {'data': parentCountry.states});
                                    statesTableLoaded(parentCountryIndex);
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.success('Location Deleted');
                                    $('#countryFilterTable').bootstrapTable('resetSearch', '');
                                })
                                .catch((error) => {
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.error('Error in deleting');
                                    console.log(error);
                                });
                        }
                    }
                });
            } else if (depth == 2) {
                var index = getIndexFromUID(parentState.areas, uid);
                bootbox.confirm({
                    message: "Are you sure you want to delete '" + parentState.areas[index].name + "'?",
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
                            var temp = JSON.parse(JSON.stringify(parentCountry));
                            temp
                                .states[parentStateIndex]
                                .areas
                                .splice(index, 1);
                            db
                                .collection('locations')
                                .doc(parentCountry.uid)
                                .set(temp)
                                .then((doc) => {
                                    parentCountry
                                        .states[parentStateIndex]
                                        .areas
                                        .splice(index, 1);
                                    $('#countryFilterTable').bootstrapTable('load', {'data': parentState.areas});
                                    areasTableLoaded(parentCountryIndex);
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.success('Location Deleted');
                                    $('#countryFilterTable').bootstrapTable('resetSearch', '');
                                })
                                .catch((error) => {
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.error('Error in deleting');
                                });
                        }
                    }
                });
            }
        }

        formatExpandCountry = (value, row, index, field) => {
            return '<span class="countryExpand" id="country' + row.name + row.name.length + '">Expand &crarr;</span>'
        }

        $scope.newItem = () => {
            $scope.locationName = '';
            mode = 'new';
            if (depth == 0) {
                $('#createLocationItemModalTitle').text('New Country');
                $('#createLocationItemLabel').text('Country Name');
                $('#createLocationItemInput').attr('placeholder', 'Country Name (Ex. Egypt)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Add');
            } else if (depth == 1) {
                $('#createLocationItemModalTitle').text('New Province');
                $('#createLocationItemLabel').text('Province Name');
                $('#createLocationItemInput').attr('placeholder', 'Province Name (Ex. Cairo)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Add');
            } else if (depth == 2) {
                $('#createLocationItemModalTitle').text('New Area');
                $('#createLocationItemLabel').text('Area Name');
                $('#createLocationItemInput').attr('placeholder', 'Area Name (Ex. Nasr City)');
                $('#createLocationItemModalSubmitBtn').attr('value', 'Add');
            }
            $('#createLocationItemModal').modal('show');
        }

        $scope.createLocationItemSubmit = () => {
            $('#createLocationItemModal').modal('hide');
            $rootScope.isLoading = true;
            if (depth == 0) {
                if (mode == 'new') {
                    var temp = {
                        'name': $scope.locationName,
                        'states': []
                    }
                    db
                        .collection('locations')
                        .add(temp)
                        .then((doc) => {
                            console.log(doc);
                            temp['uid'] = doc.id;
                            locationsData.push(temp);
                            $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
                            countryTableLoaded();
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Country Added');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error('Error in Adding');
                            console.log(error);
                        });
                } else if (mode == 'edit') {
                    var tempCountry = JSON.parse(JSON.stringify(locationsData[editIndex]));
                    tempCountry.name = $scope.locationName;
                    db
                        .collection('locations')
                        .doc(tempCountry.uid)
                        .set(tempCountry)
                        .then((doc) => {
                            locationsData[editIndex].name = tempCountry.name;
                            $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
                            countryTableLoaded();
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Country Updated');
                            $('#countryFilterTable').bootstrapTable('resetSearch', '');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error('Error in Adding');
                            console.log(error);
                        });
                }
            } else if (depth == 1) {
                if (mode == 'new') {
                    var temp = {
                        'name': $scope.locationName,
                        'areas': []
                    }
                    var tempCountry = JSON.parse(JSON.stringify(parentCountry));
                    tempCountry
                        .states
                        .push(temp);
                    db
                        .collection('locations')
                        .doc(parentCountry.uid)
                        .set(tempCountry)
                        .then((doc) => {
                            parentCountry
                                .states
                                .push(temp);
                            $('#countryFilterTable').bootstrapTable('load', {'data': parentCountry.states});
                            statesTableLoaded(parentCountryIndex);
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Province Added');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            console.log(error);
                            toastr.error('Error in Adding');
                        });
                } else if (mode == 'edit') {
                    var tempCountry = JSON.parse(JSON.stringify(parentCountry));
                    tempCountry.states[editIndex].name = $scope.locationName;
                    db
                        .collection('locations')
                        .doc(parentCountry.uid)
                        .set(tempCountry)
                        .then((doc) => {
                            parentCountry.states[editIndex].name = tempCountry.states[editIndex].name;
                            $('#countryFilterTable').bootstrapTable('load', {'data': parentCountry.states});
                            statesTableLoaded(parentCountryIndex);
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Province Updated');
                            $('#countryFilterTable').bootstrapTable('resetSearch', '');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            console.log(error);
                            toastr.error('Error in Adding');
                        });
                }
            } else if (depth == 2) {
                if (mode == 'new') {
                    var temp = {
                        'name': $scope.locationName
                    }
                    var tempCountry = JSON.parse(JSON.stringify(parentCountry));
                    tempCountry
                        .states[parentStateIndex]
                        .areas
                        .push(temp);
                    db
                        .collection('locations')
                        .doc(parentCountry.uid)
                        .set(tempCountry)
                        .then((doc) => {
                            parentCountry
                                .states[parentStateIndex]
                                .areas
                                .push(temp);
                            $('#countryFilterTable').bootstrapTable('load', {'data': parentCountry.states[parentStateIndex].areas});
                            areasTableLoaded(parentCountryIndex);
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Area Added');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error('Error in Adding');
                        });
                } else if (mode == 'edit') {
                    var tempCountry = JSON.parse(JSON.stringify(parentCountry));
                    tempCountry.states[parentStateIndex].areas[editIndex].name = $scope.locationName;
                    db
                        .collection('locations')
                        .doc(parentCountry.uid)
                        .set(tempCountry)
                        .then((doc) => {
                            parentCountry.states[parentStateIndex].areas[editIndex].name = tempCountry.states[parentStateIndex].areas[editIndex].name;
                            $('#countryFilterTable').bootstrapTable('load', {'data': parentCountry.states[parentStateIndex].areas});
                            areasTableLoaded(parentCountryIndex);
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.success('Area Updated');
                            $('#countryFilterTable').bootstrapTable('resetSearch', '');
                        })
                        .catch((error) => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error('Error in Updating');
                        })
                }
            }

        }

    });