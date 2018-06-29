angular
    .module("digAPP")
    .controller('adsCtrl', function ($scope, $rootScope, $state, $stateParams, $window) {
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

        var docRef = db.collection('ads');
        $rootScope.isLoading = true;
        docRef
            .get()
            .then(function (querySnapshot) {
                querySnapshot
                    .forEach(function (doc) {
                        // doc.data() is never undefined for query doc snapshots
                        var temp = {
                            'uid': doc
                                .data()
                                .uid,
                            'title': doc
                                .data()
                                .title,
                            'type': doc
                                .data()
                                .type,
                            'from': doc
                                .data()
                                .from,
                            'to': doc
                                .data()
                                .to,
                            'enabled': doc
                                .data()
                                .enabled,
                            'url': doc
                                .data()
                                .url
                        };
                        data.push(temp);
                    });
                $('#manageAdsTable').bootstrapTable({ data: data });
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageAdsContainer').show();
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

                            db
                                .collection("ads")
                                .add(adObj)
                                .then((doc) => {
                                    adObj['uid'] = doc.id;
                                    data.push(adObj);
                                    $('#manageAdsTable').bootstrapTable('load', data);
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.success("Ad Created");
                                    $scope.adTitle = "";
                                    $scope.adType = "";
                                    $scope.fromDate = "";
                                    $scope.toDate = "";
                                    $scope.adType = 'Image';
                                    $scope.uploadProgress = 0;
                                    $scope.adEnabled = 'yes';
                                    $scope.fileName = "Choose File";
                                })
                                .catch((error) => {
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
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

        $scope.manageAd = (index) => {

        }

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
            var fromParts = data[index].from.split('/');
            var fromDate = new Date(fromParts[2], fromParts[1] - 1, fromParts[0]);
            var toParts = data[index].to.split('/');
            var toDate = new Date(toParts[2], toParts[1] - 1, toParts[0]);
            var current = Date.now();
            if (data[index].enabled) {
                if (current >= fromDate && toDate >= current) {
                    return '<span style="color: green; font-weight: bold;">Active</span>';
                }
                else {
                    return '<span style="color: red; font-weight: bold;">Inactive</span>';
                }
            }
            else {
                return '<span style="color: red; font-weight: bold;">Disabled</span>';
            }
            return 'fi eh';
        }
    });