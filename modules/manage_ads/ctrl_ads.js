angular
    .module("digAPP")
    .controller('adsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        $('#manageAdsContainer').hide();
        $scope.adType = 'Image';
        $scope.uploadProgress = 0;
        $scope.adEnabled = 'yes';
        $scope.fileName = "Choose File";
        var file;
        var data = [];
        // Create a root reference
        var storageRef = firebase
            .storage()
            .ref();

        $rootScope.isLoading = true;

        $http({method: "POST", url: "https://us-central1-dignpick.cloudfunctions.net/api/getAllAds"}).then((response) => {
            console.log('REPONSE FROM WEB');
            console.log(response.data);
            data = response.data.results;
            $('#manageAdsTable').bootstrapTable({data: data});
            $rootScope.isLoading = false;
            $('#manageAdsContainer').show();
        }).catch((error) => {
            console.log("ERROR FROM WEB");
            console.log(error);
        });
        async function foo() {
            var locs = await db
                .collection('locations')
                .get();
            locs.forEach(doc => {
                console.log(doc.id, '=>', doc.data().name);
            });
            console.log("end");
        }

        foo();

        db
            .collection('locations')
            .get()
            .then(function (querySnapshot) {
                var results = [];
                var i = -1;
                querySnapshot.forEach(function (loc) {
                    i++;
                    // doc.data() is never undefined for query doc snapshots
                    var tempLoc = loc.data();
                    tempLoc['uid'] = loc.id;
                    tempLoc['states'] = [];
                    results[i] = tempLoc;
                    console.log(tempLoc);
                    db
                        .collection('locations')
                        .doc(loc.id)
                        .collection('states')
                        .get()
                        .then((statesResults) => {
                            var j = -1;
                            statesResults.forEach((state) => {
                                j++;
                                var tempState = state.data();
                                tempState['uid'] = state.id;
                                tempState['areas'] = [];
                                console.log(i);
                                console.log(results[i]);
                                results[i].states[j] = tempState;
                                console.log(tempState);
                                // START
                                db
                                    .collection('locations')
                                    .doc(loc.id)
                                    .collection('states')
                                    .doc(state.id)
                                    .collection('areas')
                                    .get()
                                    .then((areasResults) => {
                                        var k = -1;
                                        areasResults.forEach((area) => {
                                            k++;
                                            var tempArea = area.data();
                                            tempArea['uid'] = area.id;
                                            results[i].states[j].areas[k] = tempArea;
                                            console.log(results);

                                        });
                                    });
                                // END

                            });
                        });
                    console.log(loc.data());

                });
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

                        // db     .collection("ads")     .add(adObj)     .then((doc) => { adObj['uid'] =
                        // doc.id;         data.push(adObj); $('#manageAdsTable').bootstrapTable('load',
                        // data); $rootScope.isLoading = false;         $rootScope.$digest();
                        // toastr.success("Ad Created");         $scope.adTitle = ""; $scope.adType =
                        // "";         $scope.fromDate = "";         $scope.toDate = "";
                        // $scope.adType = 'Image';         $scope.uploadProgress = 0; $scope.adEnabled
                        // = 'yes';         $scope.fileName = "Choose File";     }) .catch((error) => {
                        //        $rootScope.isLoading = false; $rootScope.$digest();
                        // toastr.error("Error creating Ad");     });
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