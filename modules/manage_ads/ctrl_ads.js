angular
    .module("digAPP")
    .controller('adsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        $('#manageAdsContainer').hide();
        $scope.adType = 'Image';
        $scope.uploadProgress = 0;
        $scope.adEnabled = 'yes';
        $scope.fileName = "Choose File";

        var modalMode = 'create';
        var manageIndex;

        var locationsData = [];
        var locationsDataJSON;
        var file;
        var data = [];
        var parentCountry;
        var parentState;
        var depth = 0;
        // Create a root reference
        var storageRef = firebase
            .storage()
            .ref();

        $rootScope.isLoading = true;

        changeModalMode = (mode) => {
            if (mode == 'create') {
                modalMode = mode;
                $('#adModal').text('New Ad');
                $('#createAdModalSubmitBtn').attr('value', 'Add');
                $('#customFile').attr("required", true);
            } else if (mode == 'manage') {
                modalMode = mode;
                $('#adModal').text('Manage Ad');
                $('#createAdModalSubmitBtn').attr('value', 'Update');
                $('#customFile').removeAttr("required");
            }
        }

        resetLocationTable = () => {
            $('#countryFilterTable').bootstrapTable('showColumn', 'expandBtn');
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

        areasTableLoaded = (i) => {
            $('#countryFilterTable').bootstrapTable('hideColumn', 'expandBtn');
            $('#countryNameBread').unbind('click');
            $('#countryNameBread').click(() => {
                depth = 1;
                $('#stateNameBread').hide();
                $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states});
                statesTableLoaded(i);
            })
            console.log(depth);
            console.log('PARENT COUNTRY = ' + parentCountry.name);
            console.log('PARENT STATE = ' + parentState.name);
        }
        statesTableLoaded = (i) => {
            $('#countryFilterTable').bootstrapTable('showColumn', 'expandBtn');
            for (let j = 0; j < locationsData[i].states.length; j++) {
                $('#country' + j).click(() => {
                    parentState = locationsData[i].states[j];
                    depth++;
                    $('#stateNameBread').text(locationsData[i].states[j].name);
                    $('#stateNameBread').show();
                    unbindCallbacks(locationsData[i].states.length);
                    $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states[j].areas});
                    areasTableLoaded(i);
                });
            }
            console.log(depth);
            console.log('PARENT COUNTRY = ' + parentCountry.name);
        }
        countryTableLoaded = () => {
            $('#countryFilterTable').bootstrapTable('showColumn', 'expandBtn');
            for (let i = 0; i < locationsData.length; i++) {
                console.log('hello');
                $('#country' + i).click(() => {
                    parentCountry = locationsData[i];
                    depth++;
                    $('#countryNameBread').text(locationsData[i].name);
                    $('#countryNameBread').show();
                    unbindCallbacks(locationsData.length);
                    $('#countryFilterTable').bootstrapTable('load', {'data': locationsData[i].states});
                    statesTableLoaded(i);
                });
            }
            console.log(depth);
        }

        isAllUnchecked = (data) => {
            for (var i = 0; i < data.length; i++) {
                if (data[i].selected) 
                    return false;
                }
            return true;
        }

        uncheckAll = (data) => {
            for (var i = 0; i < data.length; i++) {
                data[i].selected = false;
            }
        }

        listenForCheckEvents = () => {
            $('#countryFilterTable')
                .on('check.bs.table', function (e, element) {
                    if (depth == 2) {
                        parentState.selected = true;
                        parentCountry.selected = true;
                    } else if (depth == 1) {
                        parentCountry.selected = true;
                    }
                });
            $('#countryFilterTable').on('uncheck.bs.table', function (e, element) {
                if (depth == 2) {
                    if (isAllUnchecked(parentState.areas)) {
                        parentState.selected = false;
                    }
                    if (isAllUnchecked(parentCountry.states)) {
                        parentCountry.selected = false;
                    }
                } else if (depth == 1) {
                    if (isAllUnchecked(parentCountry.states)) {
                        parentCountry.selected = false;
                    }
                    uncheckAll(parentState.areas);
                } else if (depth == 0) {
                    uncheckAll(element.states);
                    for (var i = 0; i < element.states.length; i++) {
                        uncheckAll(element.states[i].areas);
                    }
                }
            });

            $('#countryFilterTable').on('check-all.bs.table', function (e, rows) {
                if (depth == 2) {
                    parentState.selected = true;
                    parentCountry.selected = true;
                } else if (depth == 1) {
                    parentCountry.selected = true;
                }
            });
            $('#countryFilterTable').on('uncheck-all.bs.table', function (e, rows) {
                if (depth == 2) {
                    parentState.selected = false;
                    if (isAllUnchecked(parentCountry.states)) {
                        parentCountry.selected = false;
                    }
                } else if (depth == 1) {
                    parentCountry.selected = false;
                    for (var i = 0; i < rows.length; i++) {
                        uncheckAll(rows[i].areas);
                    }
                    console.log(rows);
                } else if (depth == 0) {
                    for (var i = 0; i < rows.length; i++) {
                        uncheckAll(rows[i].states);
                        for (var j = 0; j < rows[i].states.length; j++) {
                            uncheckAll(rows[i].states[j].areas);
                        }
                    }
                }
            });
        };

        $('#homeNameBread').click(() => {
            depth = 0;
            $('#countryNameBread').hide();
            $('#stateNameBread').hide();
            $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
            countryTableLoaded();
        });

        $http({method: "POST", url: "https://us-central1-dignpick.cloudfunctions.net/api/getAllAds"}).then((response) => {
            console.log('REPONSE FROM WEB');
            console.log(response.data);
            data = response.data.results;
            db
                .collection('locations')
                .get()
                .then((results) => {
                    results.forEach(result => {
                        var tempResult = result.data();
                        locationsData.push(tempResult);
                    });
                    locationsDataJSON = JSON.stringify(locationsData);
                    $('#manageAdsTable').bootstrapTable({data: data});
                    $('#countryFilterTable').bootstrapTable({data: locationsData});
                    countryTableLoaded();
                    listenForCheckEvents();
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $('#manageAdsContainer').show();
                    console.log(locationsData);
                })
                .catch((error) => {
                    console.log("ERROR FROM WEB");
                    console.log(error);
                });

        }).catch((error) => {
            console.log("ERROR FROM WEB");
            console.log(error);
        });

        $('#customFile').change(function (ev) {
            file = document
                .getElementById('customFile')
                .files[0];
            if (file) {
                if (!file.type.includes("video") && !file.type.includes("image")) {
                    alert("Unsupported format, please try again.")
                    file = null;
                    $scope.fileName = "Choose File";
                    $scope.$digest();
                } else {
                    $scope.fileName = file.name;
                    $scope.$digest();
                }
            }
        });

        onProgress = (prog) => {
            $scope.uploadProgress = prog;
            $scope.$digest();
            $('#adFormPB').css('width', prog + '%');
        }

        newAd = () => {
            file = document
                .getElementById('customFile')
                .files[0];

            if (file) {

                $('#createAdModalSubmitBtn').val('Loading...');
                $('#createAdModalSubmitBtn').attr("disabled", "disabled");
                $('#createAdModalDismissBtn').attr("disabled", "disabled");
                $('#createAdModalCloseBtn').attr("disabled", "disabled");
                $('#adTitleForm').attr("disabled", "disabled");
                $('#adTypeForm').attr("disabled", "disabled");
                $('#fromDateForm').attr("disabled", "disabled");
                $('#toDateForm').attr("disabled", "disabled");
                $('#adEnabledForm').attr("disabled", "disabled");
                $('#customFile').attr("disabled", "disabled");

                //removeAttr Upload file and metadata to the object 'images/mountains.jpg'
                $('#pb').css('visibility', 'visible');
                var uploadLoc = 'ads/' + file.name + Date.now();
                var uploadTask = storageRef
                    .child(uploadLoc)
                    .put(file);

                // Listen for state changes, errors, and completion of the upload.
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                        function (snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total
                    // number of bytes to be uploaded
                    var progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    console.log('Upload is ' + progress + '% done');
                    onProgress(progress);
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function (error) {

                    // A full list of error codes is available at
                    // https://firebase.google.com/docs/storage/web/handle-errors
                    switch (error.code) {
                        case 'storage/unauthorized':
                            $('#createAdModalSubmitBtn').val('Add');
                            $('#createAdModalSubmitBtn').removeAttr("disabled");
                            $('#createAdModalDismissBtn').removeAttr("disabled");
                            $('#createAdModalCloseBtn').removeAttr("disabled");
                            $('#adTitleForm').removeAttr("disabled");
                            $('#adTypeForm').removeAttr("disabled");
                            $('#fromDateForm').removeAttr("disabled");
                            $('#toDateForm').removeAttr("disabled");
                            $('#adEnabledForm').removeAttr("disabled");
                            $('#customFile').removeAttr("disabled");
                            $scope.uploadProgress = 0;
                            $('#adFormPB').css('width', 0 + '%');
                            $('#pb').css('visibility', 'hidden');
                            $scope.$digest();
                            toastr.error("Unknown Server Error");
                            break;

                        case 'storage/canceled':
                            $('#createAdModalSubmitBtn').val('Add');
                            $('#createAdModalSubmitBtn').removeAttr("disabled");
                            $('#createAdModalDismissBtn').removeAttr("disabled");
                            $('#createAdModalCloseBtn').removeAttr("disabled");
                            $('#adTitleForm').removeAttr("disabled");
                            $('#adTypeForm').removeAttr("disabled");
                            $('#fromDateForm').removeAttr("disabled");
                            $('#toDateForm').removeAttr("disabled");
                            $('#adEnabledForm').removeAttr("disabled");
                            $('#customFile').removeAttr("disabled");
                            $scope.uploadProgress = 0;
                            $('#adFormPB').css('width', 0 + '%');
                            $('#pb').css('visibility', 'hidden');
                            $scope.$digest();
                            toastr.error("Unknown Server Error");
                            break;

                        case 'storage/unknown':
                            $('#createAdModalSubmitBtn').val('Add');
                            $('#createAdModalSubmitBtn').removeAttr("disabled");
                            $('#createAdModalDismissBtn').removeAttr("disabled");
                            $('#createAdModalCloseBtn').removeAttr("disabled");
                            $('#adTitleForm').removeAttr("disabled");
                            $('#adTypeForm').removeAttr("disabled");
                            $('#fromDateForm').removeAttr("disabled");
                            $('#toDateForm').removeAttr("disabled");
                            $('#adEnabledForm').removeAttr("disabled");
                            $('#customFile').removeAttr("disabled");
                            $scope.uploadProgress = 0;
                            $('#adFormPB').css('width', 0 + '%');
                            $('#pb').css('visibility', 'hidden');
                            $scope.$digest();
                            toastr.error("Unknown Server Error");
                            break;
                    }
                }, function () {
                    // Upload completed successfully, now we can get the download URL
                    var fileLoc;
                    uploadTask
                        .snapshot
                        .ref
                        .getDownloadURL()
                        .then(function (downloadURL) {
                            fileLoc = downloadURL;
                            var from = $scope.fromDate;
                            var to = $scope.toDate;
                            var adObj = {
                                'title': $scope.adTitle,
                                'type': $scope.adType,
                                'from': from.getDate() + '/' + (from.getMonth() + 1) + '/' + from.getFullYear(),
                                'to': to.getDate() + '/' + (to.getMonth() + 1) + '/' + to.getFullYear(),
                                'enabled': $scope.adEnabled == 'yes'
                                    ? true
                                    : false,
                                'url': fileLoc,
                                'uploadLoc': uploadLoc,
                                'filter': {}
                            }

                            if (modalMode == 'manage')
                            {
                                adObj['uid'] = data[manageIndex].uid;
                            }

                            if ($scope.maleGenderFilter && !$scope.femaleGenderFilter) {
                                adObj.filter['gender'] = 'male';
                            } else if (!$scope.maleGenderFilter && $scope.femaleGenderFilter) {
                                adObj.filter['gender'] = 'female';
                            }

                            if ($scope.fromAgeFilter && $scope.toAgeFilter) {
                                adObj.filter['age'] = {
                                    'from': $scope.fromAgeFilter,
                                    'to': $scope.toAgeFilter
                                };
                            }

                            if (!isAllUnchecked(locationsData)) {
                                adObj.filter['location'] = locationsData;
                            }

                            $('#createAdModalSubmitBtn').val(modalMode == 'manage' ? 'Update' : 'Add');
                            $('#createAdModalSubmitBtn').removeAttr("disabled");
                            $('#createAdModalDismissBtn').removeAttr("disabled");
                            $('#createAdModalCloseBtn').removeAttr("disabled");
                            $('#adTitleForm').removeAttr("disabled");
                            $('#adTypeForm').removeAttr("disabled");
                            $('#fromDateForm').removeAttr("disabled");
                            $('#toDateForm').removeAttr("disabled");
                            $('#adEnabledForm').removeAttr("disabled");
                            $('#customFile').removeAttr("disabled");
                            $('#createAdModal').modal('hide');

                            $rootScope.isLoading = true;
                            $rootScope.$digest();
                            var reqURL;

                            if (modalMode == 'create') {
                                reqURL = 'https://us-central1-dignpick.cloudfunctions.net/api/newAd';
                            } else if (modalMode == 'manage') {
                                reqURL = 'https://us-central1-dignpick.cloudfunctions.net/api/editAd';
                            }
                            $http({
                                method: "POST",
                                url: reqURL,
                                data: {
                                    'ad': adObj
                                }
                            }).then((response) => {
                                $rootScope.isLoading = false;
                                var resultAd = response.data.result;
                                if (modalMode == 'create') {
                                    data.push(resultAd);
                                    $('#manageAdsTable').bootstrapTable('load', data);
                                    toastr.success("Ad Created");
                                } else if (modalMode == 'manage') {
                                    data[manageIndex] = response.data.result;
                                    $('#manageAdsTable').bootstrapTable('load', data);
                                    toastr.success("Ad Updated");
                                }
                                $scope.adTitle = "";
                                $scope.adType = "";
                                $scope.fromDate = "";
                                $scope.toDate = "";
                                $scope.adType = 'Image';
                                $scope.uploadProgress = 0;
                                $scope.adEnabled = 'yes';
                                $scope.fileName = "Choose File";
                                $scope.fromAgeFilter = "";
                                $scope.toAgeFilter = "";
                                $('#pb').css('visibility', 'hidden');
                                $('#adFormPB').css('width', '0%');
                                $scope.maleGenderFilter = null;
                                $scope.femaleGenderFilter = null;
                                resetLocationTable();
                            }).catch((error) => {
                                $rootScope.isLoading = false;
                                toastr.error("Error creating Ad");
                            });

                        })
                        .catch((error) => {
                            $('#createAdModalSubmitBtn').val(modalMode == 'manage' ? 'Update' : 'Add');
                            $('#createAdModalSubmitBtn').removeAttr("disabled");
                            $('#createAdModalDismissBtn').removeAttr("disabled");
                            $('#createAdModalCloseBtn').removeAttr("disabled");
                            $('#adTitleForm').removeAttr("disabled");
                            $('#adTypeForm').removeAttr("disabled");
                            $('#fromDateForm').removeAttr("disabled");
                            $('#toDateForm').removeAttr("disabled");
                            $('#adEnabledForm').removeAttr("disabled");
                            $('#customFile').removeAttr("disabled");
                            $scope.uploadProgress = 0;
                            $('#adFormPB').css('width', 0 + '%');
                            $('#pb').css('visibility', 'hidden');
                            $scope.$digest();
                            toastr.error("Unknown Server Error");
                        });
                });
            } else {
                if (modalMode == 'manage') {
                    $('#createAdModal').modal('hide');
                    var from = $scope.fromDate;
                    var to = $scope.toDate;
                    var adObj = {
                        'title': $scope.adTitle,
                        'type': $scope.adType,
                        'from': from.getDate() + '/' + (from.getMonth() + 1) + '/' + from.getFullYear(),
                        'to': to.getDate() + '/' + (to.getMonth() + 1) + '/' + to.getFullYear(),
                        'enabled': $scope.adEnabled == 'yes'
                            ? true
                            : false,
                        'url': data[manageIndex].url,
                        'uploadLoc': data[manageIndex].uploadLoc,
                        'uid': data[manageIndex].uid,
                        'filter': {}
                    }


                    if ($scope.maleGenderFilter && !$scope.femaleGenderFilter) {
                        adObj.filter['gender'] = 'male';
                    } else if (!$scope.maleGenderFilter && $scope.femaleGenderFilter) {
                        adObj.filter['gender'] = 'female';
                    }

                    if ($scope.fromAgeFilter && $scope.toAgeFilter) {
                        adObj.filter['age'] = {
                            'from': $scope.fromAgeFilter,
                            'to': $scope.toAgeFilter
                        };
                    }

                    if (!isAllUnchecked(locationsData)) {
                        adObj.filter['location'] = locationsData;
                    }

                    $rootScope.isLoading = true;
                    var reqURL;

                    if (modalMode == 'create') {
                        reqURL = 'https://us-central1-dignpick.cloudfunctions.net/api/newAd';
                    } else if (modalMode == 'manage') {
                        reqURL = 'https://us-central1-dignpick.cloudfunctions.net/api/editAd';
                    }
                    $http({
                        method: "POST",
                        url: reqURL,
                        data: {
                            'ad': adObj
                        }
                    }).then((response) => {
                        $rootScope.isLoading = false;
                        var resultAd = response.data.result;
                        if (modalMode == 'create') {
                            data.push(resultAd);
                            $('#manageAdsTable').bootstrapTable('load', data);
                            toastr.success("Ad Created");
                        } else if (modalMode == 'manage') {
                            data[manageIndex] = response.data.result;
                            $('#manageAdsTable').bootstrapTable('load', data);
                            toastr.success("Ad Updated");
                        }
                        $scope.adTitle = "";
                        $scope.adType = "";
                        $scope.fromDate = "";
                        $scope.toDate = "";
                        $scope.adType = 'Image';
                        $scope.uploadProgress = 0;
                        $scope.adEnabled = 'yes';
                        $scope.fileName = "Choose File";
                        $scope.fromAgeFilter = "";
                        $scope.toAgeFilter = "";
                        $('#pb').css('visibility', 'hidden');
                        $('#adFormPB').css('width', '0%');
                        $scope.maleGenderFilter = null;
                        $scope.femaleGenderFilter = null;
                        resetLocationTable();
                    }).catch((error) => {
                        $rootScope.isLoading = false;
                        toastr.error("Error creating Ad");
                    });
                }
            }
        }

        $scope.fromDateChange = () => {
            if ($scope.fromDate && $scope.toDate) {
                if ($scope.fromDate > $scope.toDate) {
                    alert("Invalid Dates. The from date cannot be after the to date");
                    $scope.fromDate = "";
                    $scope.toDate = "";
                }
            }
        }

        $scope.toDateChange = () => {
            if ($scope.fromDate && $scope.toDate) {
                if ($scope.fromDate > $scope.toDate) {
                    alert("Invalid Dates. The from date cannot be after the to date");
                    $scope.fromDate = "";
                    $scope.toDate = "";
                }
            }
        }

        checkAreaByName = (countryIndex, stateIndex, name) => {
            for (var i = 0; i < locationsData[countryIndex].states[stateIndex].areas.length; i++) {
                if (locationsData[countryIndex].states[stateIndex].areas[i].name == name) {
                    locationsData[countryIndex].states[stateIndex].areas[i].selected = true;
                    return i;
                    break;
                }
            }
            return -1;
        }

        checkStateByName = (countryIndex, name) => {
            for (var j = 0; j < locationsData[countryIndex].states.length; j++) {
                if (locationsData[countryIndex].states[j].name == name) {
                    locationsData[countryIndex].states[j].selected = true;
                    return j;
                    break;
                }
            }
            return -1;
        }

        checkCountryByName = (name) => {
            for (var i = 0; i < locationsData.length; i++) {
                if (locationsData[i].name == name) {
                    locationsData[i].selected = true;
                    return i;
                    break;
                }
            }
            return -1;
        }

        loadDataIntoLocationTable = (location) => {
            if (location) {
                resetLocationTable();
                for (var i = 0; i < location.length; i++) {
                    if (location[i].selected) {
                        var countryIndex = checkCountryByName(location[i].name);
                        if (countryIndex != -1 && !isAllUnchecked(location[i].states)) {
                            for (var j = 0; j < location[i].states.length; j++) {
                                if (location[i].states[j].selected) {
                                    var stateIndex = checkStateByName(countryIndex, location[i].states[j].name);
                                    if (stateIndex != -1 && !isAllUnchecked(location[i].states[j].areas)) {
                                        for (var k = 0; k < location[i].states[j].areas.length; k++) {
                                            if (location[i].states[j].areas[k].selected) {
                                                checkAreaByName(countryIndex, stateIndex, location[i].states[j].areas[k].name);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                $('#countryFilterTable').bootstrapTable('load', {'data': locationsData});
                countryTableLoaded();
            }
        }

        loadDataIntoModal = (uid) => {
            var index = getIndexFromUID(data, uid);
            $scope.adTitle = data[index].title;
            $scope.adType = data[index].type;
            console.log(data[index].from);
            var fromDate = data[index]
                .from
                .split('/');
            $scope.fromDate = new Date(fromDate[2], fromDate[1] - 1, fromDate[0]);
            var toDate = data[index]
                .to
                .split('/');
            $scope.toDate = new Date(toDate[2], toDate[1] - 1, toDate[0]);
            $scope.adEnabled = data[index].enabled
                ? 'yes'
                : 'no';
            $scope.fileName = data[index].uploadLoc;
            if (data[index].filter.age) {
                $scope.fromAgeFilter = data[index].filter.age.from;
                $scope.toAgeFilter = data[index].filter.age.to;
            }
            if (data[index].filter.gender) {
                $scope.maleGenderFilter = data[index].filter.gender == 'male';
                $scope.femaleGenderFilter = data[index].filter.gender == 'female';
            }
            loadDataIntoLocationTable(data[index].filter.location);
            $scope.$digest();
        }

        resetModal = () => {
            $scope.adTitle = "";
            $scope.adType = "";
            $scope.fromDate = "";
            $scope.toDate = "";
            $scope.adType = 'Image';
            $scope.uploadProgress = 0;
            $scope.adEnabled = 'yes';
            $scope.fileName = "Choose File";
            $scope.fromAgeFilter = "";
            $scope.toAgeFilter = "";
            $('#pb').css('visibility', 'hidden');
            $('#adFormPB').css('width', '0%');
            $scope.maleGenderFilter = null;
            $scope.femaleGenderFilter = null;
            resetLocationTable();
        }

        $scope.manageAd = (uid) => {
            var index = getIndexFromUID(data, uid);
            manageIndex = index;
            console.log(data[index]);
            changeModalMode('manage');
            loadDataIntoModal(index);
            $('#createAdModal').modal('show');
        }

        $scope.createAdSubmit = () => {
            newAd();
        }

        $scope.newAd = () => {
            changeModalMode('create');
            resetModal();
            $('#createAdModal').modal('show');
        }

        formatIDCount = (value, row, index, field) => {
            return index + 1;
        }

        formatManageButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().manageAd(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Manage</button>'
        }

        $('#rofl').click(() => {
            alert('howa fi eh');
        })

        formatExpandCountry = (value, row, index, field) => {
            return '<span class="countryExpand" id="country' + index + '">Expand &crarr;</span>'
        }

        formatSelectPlace = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().manageAd(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Manage</button>'
        }

        formatAdStatus = (value, row, index, field) => {
            if (data[index].enabled) {
                if (data[index].status == 'Active') {
                    return '<span style="color: green; font-weight: bold;">Active</span>';
                } else {
                    return '<span style="color: red; font-weight: bold;">Inactive</span>';
                }
            } else {
                return '<span style="color: red; font-weight: bold;">Disabled</span>';
            }
        }
    });