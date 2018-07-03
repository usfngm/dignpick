angular
    .module("digAPP")
    .controller('adsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        $('#manageAdsContainer').hide();
        $scope.adType = 'Image';
        $scope.uploadProgress = 0;
        $scope.adEnabled = 'yes';
        $scope.fileName = "Choose File";

        var locationsData = [];
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

        listenForCheckEvents = () => {
            $('#countryFilterTable')
                .on('check.bs.table', function (e, element) {
                    if (depth == 2) {
                        parentState.selected = true;
                        parentCountry.selected = true;
                    }
                });
            $('#countryFilterTable').on('uncheck.bs.table', function (e, element) {
                if (depth == 2) {
                    if (isAllUnchecked(parentState.areas)) {
                        parentState.selected = false;
                    }
                    if (isAllUnchecked(parentCountry.states))
                    {
                        parentCountry.selected = false;
                    }
                }
            });

            $('#countryFilterTable').on('check-all.bs.table', function (e, rows) {
                if (depth == 2) {
                    parentState.selected = true;
                    parentCountry.selected = true;
                }
                else if ( depth == 1 )
                {
                    parentCountry.selected = true;
                }
            });
            $('#countryFilterTable').on('uncheck-all.bs.table', function (e, rows) {
                if (depth == 2) {
                    parentState.selected = false;
                    if (isAllUnchecked(parentCountry.states))
                    {
                        parentCountry.selected = false;
                    }
                }
                else if ( depth == 1 )
                {
                    parentCountry.selected = false;
                    console.log(rows);
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
                    $('#manageAdsTable').bootstrapTable({data: data});
                    $('#countryFilterTable').bootstrapTable({data: locationsData});
                    countryTableLoaded();
                    listenForCheckEvents();
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    $('#manageAdsContainer').show();
                    console.log(locationsData);
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
                // console.log(file); console.log(file.name.split('.').pop());
                // console.log(file.type);
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
                        $('#createAdModal').modal('hide');

                        $rootScope.isLoading = true;
                        $rootScope.$digest();

                        $http({
                            method: "POST",
                            url: "https://us-central1-dignpick.cloudfunctions.net/api/newAd",
                            data: {
                                'ad': adObj
                            }
                        }).then((response) => {
                            var resultAd = response.data.result;
                            data.push(resultAd);
                            $('#manageAdsTable').bootstrapTable('load', data);
                            $rootScope.isLoading = false;
                            toastr.success("Ad Created");
                            $scope.adTitle = "";
                            $scope.adType = "";
                            $scope.fromDate = "";
                            $scope.toDate = "";
                            $scope.adType = 'Image';
                            $scope.uploadProgress = 0;
                            $scope.adEnabled = 'yes';
                            $scope.fileName = "Choose File";
                        }).catch((error) => {
                            $rootScope.isLoading = false;
                            toastr.error("Error creating Ad");
                        });

                    })
                    .catch((error) => {
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
                    });

            });

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

        $scope.manageAd = (index) => {}

        $scope.createAdSubmit = () => {
            newAd();
        }

        $scope.newAd = () => {
            $('#createAdModal').modal('show');
        }

        formatIDCount = (value, row, index, field) => {
            return index + 1;
        }

        formatManageButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().manageAd(' + index + ')" type="button" class="btn btn-primary">Manage</button>'
        }

        $('#rofl').click(() => {
            alert('howa fi eh');
        })

        formatExpandCountry = (value, row, index, field) => {
            return '<span class="countryExpand" id="country' + index + '">Expand &crarr;</span>'
        }

        formatSelectPlace = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().manageAd(' + index + ')" type="button" class="btn btn-primary">Manage</button>'
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