//Helper methods

angular
    .module("digAPP")
    .controller('editRestCtrl', function ($scope, $rootScope, $state, $stateParams, $window, $timeout, $http) {

        //JQUERY VARS
        var coverPhotoFile;
        var currentGalleryFile;
        var storageRef = firebase
            .storage()
            .ref();
        var coverPhotoLoc;
        var coverPhotoUploadTask;
        var coverDownloadURL;
        var currentRest;
        $scope.galleryPhotos = [];

        const checkPhotosStillUploading = () => {
            if (coverPhotoFile && !coverDownloadURL)
                return true;
            for (var i = 0; i < $scope.galleryPhotos.length; i++) {
                if ($scope.galleryPhotos[i].finished == false)
                    return true;
            }
            return false;
        }

        const updateGalleryPhotos = () => {
            console.log($scope.galleryPhotos);
            for (var i = 0; i < $scope.galleryPhotos.length; i++) {
                var obj = $scope.galleryPhotos[i];
                if (!obj.img) {
                    console.log("IN");
                    $('#' + obj.id).css({
                        'background-image': "url(" + obj.downloadURL + ")"
                    });
                    $('#' + obj.id + "Percentage").hide();
                    $('#' + obj.id + "uploadingText").hide();
                    $('#' + obj.id + "ClosePhoto").click(() => {
                        var tempRest = JSON.parse(JSON.stringify(currentRest));
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        var removeIndex = tempRest
                            .gallery
                            .map(function (item) {
                                return item.id;
                            })
                            .indexOf(obj.id);

                        tempRest
                            .gallery
                            .splice(removeIndex, 1);

                        db
                            .collection("places")
                            .doc($scope.uid)
                            .set(tempRest)
                            .then(() => {
                                console.log("Deleteing " + currentRest.gallery[removeIndex].fileLoc);
                                storageRef
                                    .child(currentRest.gallery[removeIndex].fileLoc)
                                    .delete()
                                    .then(() => {
                                        console.log(currentRest.gallery[removeIndex].fileLoc + " Deleted");
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        currentRest = tempRest;
                                        $scope.galleryPhotos = currentRest.gallery;
                                        $scope.$digest();
                                    })
                                    .catch((error) => {
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        toastr.error("Error");
                                        console.log(error);
                                    })
                            })
                            .catch((error) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error("Error");
                                console.log(error);
                            });

                    });
                }
            }
        }

        $('#galleryAddContainer').click(() => {
            $('#galleryUpload').click();
        });

        const startGalleryUpload = (obj) => {
            var galleryPhotoUpload = storageRef
                .child(obj.fileLoc)
                .put(obj.file);

            // Listen for state changes, errors, and completion of the upload.
            galleryPhotoUpload.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                function (snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total
                    // number of bytes to be uploaded
                    var progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    console.log('Upload is ' + progress + '% done');
                    $('#' + obj.id + 'Percentage').text(progress + "%");
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
                            // User doesn't have permission to access the object
                            break;

                        case 'storage/canceled':
                            // User canceled the upload
                            break;

                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            break;
                    }
                }, function () {
                    // Upload completed successfully, now we can get the download URL
                    galleryPhotoUpload
                        .snapshot
                        .ref
                        .getDownloadURL()
                        .then(function (downloadURL) {
                            obj.finished = true;
                            $('#' + obj.id + 'uploadingText').text("Uploaded");
                            obj['downloadURL'] = downloadURL;
                        });
                });

            console.log(galleryPhotoUpload.snapshot.state);

            $('#' + obj.id + "ClosePhoto").click(() => {
                var state = galleryPhotoUpload.snapshot.state;
                console.log(state);
                if (state == "running") {
                    galleryPhotoUpload.cancel();
                } else {
                    $rootScope.isLoading = true;
                    $rootScope.$digest();
                    // Create a reference to the file to delete
                    var deleteRef = storageRef.child(obj.fileLoc);

                    console.log("Deleteing " + obj.fileLoc);
                    // Delete the file
                    deleteRef
                        .delete()
                        .then(() => {
                            console.log(obj.fileLoc + " deleted");
                            var removeIndex = $scope
                                .galleryPhotos
                                .map(function (item) {
                                    return item.id;
                                })
                                .indexOf(obj.id);
                            $scope
                                .galleryPhotos
                                .splice(removeIndex, 1);
                            currentRest.gallery = $scope.galleryPhotos;
                            $scope.$digest();
                            updateGalleryPhotos();
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                        })
                        .catch(() => {
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                            toastr.error("Error");
                        });
                }

            });
        }

        $('#galleryUpload')
            .change(function (ev) {
                var _URL = window.URL || window.webkitURL;
                currentGalleryFile = document
                    .getElementById('galleryUpload')
                    .files[0];
                if (currentGalleryFile) {
                    console.log(currentGalleryFile);
                    if (!currentGalleryFile.type.includes("image")) {
                        alert("Unsupported format, please try again.")
                        currentGalleryFile = null;
                    } else {
                        var image = new Image();
                        image.src = _URL.createObjectURL(currentGalleryFile);
                        image.onload = function () {
                            console.log("IMAGE LOADED");
                            var aspect_ratio = image.width / image.height;
                            if (aspect_ratio != 1) {
                                alert('Image size must be 1200 x 1200 or must have 1:1 aspect ratio (Square Image). Ple' +
                                    'ase select another image and try again.');
                                currentGalleryFile = null;
                            } else {
                                var obj = {
                                    'file': currentGalleryFile,
                                    'finished': false,
                                    'img': image.src,
                                    'id': currentGalleryFile
                                        .name
                                        .split('.')
                                        .join("") + Date.now(),
                                    'fileLoc': 'gallery/' + currentGalleryFile.name + Date.now(),
                                    'downloadURL': null
                                }
                                console.log(obj.file);
                                $scope
                                    .galleryPhotos
                                    .push(obj);
                                currentRest.gallery = $scope.galleryPhotos;
                                $scope.$digest();
                                $('#galleryUpload').val('');
                                startGalleryUpload(obj);
                            }
                        };
                        image.onerror = (er) => {
                            console.log(er);
                            console.log("ERROR");
                        };
                        console.log("IM HERE WAITING FOR IMAGE LOAD");
                    }
                }
            });

        var dotCount = 1;
        setInterval(function () {
            if (dotCount == 1) {
                $('#uploadingTextSpan').text('Uploading.');
            } else if (dotCount == 2) {
                $('#uploadingTextSpan').text('Uploading..');
            } else if (dotCount == 3) {
                $('#uploadingTextSpan').text('Uploading...');
                dotCount = 0;
            }
            dotCount++;
        }, 500);

        //JQUERY
        const listenForCoverPhotoUploadEvents = () => {
            $('#coverPhotoContainer').click(() => {
                $('#coverPhotoUpload').click();
            })

            $('#coverPhotoContainer').mouseenter(() => {
                $('#coverPhotoContentDefault').hide();
                $('#coverPhotoContentHover').show();
                $('#coverPhotoContentHover').css('display', 'flex');
            });

            $('#coverPhotoContainer').mouseleave(() => {
                $('#coverPhotoContentHover').hide();
                $('#coverPhotoContentDefault').show();
            });
        }

        const stopListeningForCoverPhotoUploadEvents = () => {
            $('#coverPhotoContainer').unbind('mouseleave');
            $('#coverPhotoContainer').unbind('mouseenter');
            $('#coverPhotoContainer').unbind('click');
        }

        $('#closeCoverPhotoUploading').click(() => {
            if (coverPhotoUploadTask) {
                var state = coverPhotoUploadTask.snapshot.state;
                console.log(state);
                if (state == "running") {
                    coverPhotoUploadTask.cancel();
                } else {
                    // Create a reference to the file to delete
                    var deleteRef = storageRef.child(coverPhotoLoc);
                    // Delete the file
                    deleteRef.delete();
                }
            } else {
                currentRest.coverPhotoURL = null;
                currentRest.coverPhotoLoc = null;
                $rootScope.isLoading = true;
                $rootScope.$digest();
                db
                    .collection("places")
                    .doc($scope.uid)
                    .set(currentRest)
                    .then(() => {
                        console.log("Deleteing " + coverPhotoLoc);
                        storageRef
                            .child(coverPhotoLoc)
                            .delete()
                            .then(() => {
                                console.log(coverPhotoLoc + " Deleted");
                                $rootScope.isLoading = false;
                                $rootScope.$digest();

                                $("#coverPhotoContainer").css({ 'background-image': "none" });
                                $('#coverPhotoContentHover').show();
                                $('#coverPhotoContentHover').css('display', 'flex');
                                $('#coverPhotoContentUploading').hide();
                                $('#coverPhotoContainer').addClass('pointerCrusor');
                                $("#coverPhotoUpload").val("");
                                $('#coverPhotoContentUploadingContent').hide();
                                coverPhotoLoc = null;
                                coverPhotoUploadTask = null;
                                coverPhotoFile = null;
                                coverDownloadURL = null;
                                setTimeout(listenForCoverPhotoUploadEvents, 100);

                            })
                            .catch((e) => {
                                console.log(e);
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error("Error");
                            })

                    })
                    .catch(() => {
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        toastr.error("Error");
                    })
            }

        });

        listenForCoverPhotoUploadEvents();

        const onProgress = (progress) => {
            $('#uploadingTextPercentage').text(progress + "%");
        }

        const coverPhotoUploadFinished = (downloadURL) => {
            coverDownloadURL = downloadURL;
            $('#uploadingTextPercentage').text("Upload Completed");
            $('#uploadingTextSpan').hide();
        }

        const startCoverPhotoUpload = (f) => {
            coverPhotoLoc = 'place_cover_photos/' + f.name + Date.now();
            coverPhotoUploadTask = storageRef
                .child(coverPhotoLoc)
                .put(f);

            // Listen for state changes, errors, and completion of the upload.
            coverPhotoUploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
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
                            // User doesn't have permission to access the object
                            break;

                        case 'storage/canceled':
                            // User canceled the upload
                            break;

                        case 'storage/unknown':
                            // Unknown error occurred, inspect error.serverResponse
                            break;
                    }
                }, function () {
                    // Upload completed successfully, now we can get the download URL
                    coverPhotoUploadTask
                        .snapshot
                        .ref
                        .getDownloadURL()
                        .then(function (downloadURL) {
                            coverPhotoUploadFinished(downloadURL);
                        });
                });
        }

        $('#coverPhotoUpload')
            .change(function (ev) {
                var _URL = window.URL || window.webkitURL;
                coverPhotoFile = document
                    .getElementById('coverPhotoUpload')
                    .files[0];
                if (coverPhotoFile) {
                    if (!coverPhotoFile.type.includes("image")) {
                        alert("Unsupported format, please try again.")
                        coverPhotoFile = null;
                    } else {
                        var image = new Image();
                        image.src = _URL.createObjectURL(coverPhotoFile);
                        image.onload = function () {
                            var aspect_ratio = image.width / image.height;
                            if (aspect_ratio != 2) {
                                alert('Image size must be 1200 x 600 or must have 2:1 aspect ratio.\nPlease select anot' +
                                    'her image and try again.');
                                coverPhotoFile = null;
                                $scope.coverPhotoError = true;
                                $scope.$digest();
                            } else {
                                $('#uploadingTextPercentage').text("0%");
                                $('#uploadingTextSpan').show();
                                $('#coverPhotoContentUploading').css('opacity', 0.5);
                                stopListeningForCoverPhotoUploadEvents();
                                $scope.coverPhotoError = false;
                                $scope.$digest();
                                $("#coverPhotoContainer").css({
                                    'background-image': "url(" + image.src + ")"
                                });
                                $('#coverPhotoContentHover').hide();
                                $('#coverPhotoContentDefault').hide();
                                $('#coverPhotoContentUploading').show();
                                $('#coverPhotoContainer').removeClass('pointerCrusor');
                                $('#coverPhotoContentUploadingContent').show();
                                $('#coverPhotoContentUploadingContent').css('display', 'flex');
                                startCoverPhotoUpload(coverPhotoFile);
                            }
                        };
                    }
                }
            });

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
            currentRest = restaurant.data();

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
        (async () => {
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
            if (data.coverPhotoURL) {
                coverDownloadURL = data.coverPhotoURL;
                coverPhotoLoc = data.coverPhotoLoc;
                stopListeningForCoverPhotoUploadEvents();
                $("#coverPhotoContainer").css({
                    'background-image': "url(" + data.coverPhotoURL + ")"
                });
                $('#coverPhotoContentHover').hide();
                $('#coverPhotoContentDefault').hide();
                $('#coverPhotoContentUploading').show();
                $('#coverPhotoContainer').removeClass('pointerCrusor');
                $('#coverPhotoContentUploadingContent').show();
                $('#coverPhotoContentUploadingContent').css('display', 'flex');
                $('#uploadingTextPercentage').hide();
                $('#uploadingTextSpan').hide();
            }
            if (data.gallery) {
                $scope.galleryPhotos = data.gallery;
                $scope.$digest();
                for (var i = 0; i < $scope.galleryPhotos.length; i++) {
                    var obj = $scope.galleryPhotos[i];
                    obj['finished'] = true;
                    console.log(obj.id + "Percentage");
                    $('#' + obj.id).css({
                        'background-image': "url(" + obj.downloadURL + ")"
                    });
                    $('#' + obj.id + "Percentage").hide();
                    $('#' + obj.id + "uploadingText").hide();
                    $('#' + obj.id + "ClosePhoto").click(() => {
                        var tempRest = JSON.parse(JSON.stringify(currentRest));
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        var removeIndex = tempRest
                            .gallery
                            .map(function (item) {
                                return item.id;
                            })
                            .indexOf(obj.id);

                        tempRest
                            .gallery
                            .splice(removeIndex, 1);

                        db
                            .collection("places")
                            .doc($scope.uid)
                            .set(tempRest)
                            .then(() => {
                                console.log("Deleteing " + currentRest.gallery[removeIndex].fileLoc);
                                storageRef
                                    .child(currentRest.gallery[removeIndex].fileLoc)
                                    .delete()
                                    .then(() => {
                                        console.log(currentRest.gallery[removeIndex].fileLoc + " Deleted");
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        currentRest = tempRest;
                                        $scope.galleryPhotos = currentRest.gallery;
                                        $scope.$digest();
                                        updateGalleryPhotos();
                                    })
                                    .catch((error) => {
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        toastr.error("Error");
                                        console.log(error);
                                    })
                            })
                            .catch((error) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error("Error");
                                console.log(error);
                            });

                    });
                }
            }
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
                .Marker({ position: places_array[index].geometry.location, map: map });
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
                .Marker({ position: branches_list[index].geometry, map: map });
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
            if (checkPhotosStillUploading()) {
                alert("Please wait til all the uploading is done and try again.");
                return;
            }
            $rootScope.isLoading = true;

            var galleryItems = [];
            $scope
                .galleryPhotos
                .forEach((photo) => {
                    var newObj = {
                        'id': photo.id,
                        'fileLoc': photo.fileLoc,
                        'downloadURL': photo.downloadURL
                    };
                    galleryItems.push(newObj);
                })

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

            var obj = {
                'name': $scope.restName,
                'description': $scope.restDescription
                    ? $scope.restDescription
                    : '',
                'foodType': $scope.restFoodType
                    ? $scope.restFoodType
                    : '',
                'hotline': $scope.restHotline
                    ? $scope.restHotline
                    : '',
                'tags': {},
                'coverPhotoURL': coverDownloadURL
                    ? coverDownloadURL
                    : null,
                'coverPhotoLoc': coverPhotoLoc
                    ? coverPhotoLoc
                    : null,
                'gallery': galleryItems,
                'branches': branches_list
            }

            $scope
                .rest_tags
                .forEach((tag) => {
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
                .set({ 'branches': branches_list })
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
            $('#mapSearchtable').bootstrapTable({ data: table_data });
            $('#branchesList').bootstrapTable({ data: branches_list });
        });
    });
