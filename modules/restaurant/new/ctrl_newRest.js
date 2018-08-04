angular
    .module("digAPP")
    .controller('newRestCtrl', function ($scope, $rootScope, $state, $window, $timeout, $http) {
        //JQUERY VARS
        var coverPhotoFile;
        var currentGalleryFile;
        var storageRef = firebase
            .storage()
            .ref();
        var coverPhotoLoc;
        var coverPhotoUploadTask;
        var coverDownloadURL;
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
                    // Create a reference to the file to delete
                    var deleteRef = storageRef.child(obj.fileLoc);

                    // Delete the file
                    deleteRef.delete();
                }
                var removeIndex = $scope
                    .galleryPhotos
                    .map(function (item) {
                        return item.id;
                    })
                    .indexOf(obj.id);
                $scope
                    .galleryPhotos
                    .splice(removeIndex, 1);
                $scope.$digest();

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

        var map;
        var marker;
        var places_array = [];
        var table_data = [];

        var branches_list = [];
        $scope.rest_tags = [];
        $scope.rest_types = [];

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
        }

        $('#newRestContainer').hide();
        $rootScope.isLoading = true;
        (async () => {
            await loadAllData();
            $rootScope.isLoading = false;
            $scope.$digest();
            $rootScope.$digest();
            $('#newRestContainer').show();
        })()

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
                    'uid': places_array[i].id,
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
            console.log(places_array);
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

        const fillBranchsTable = () => {
            $('#branchesList').bootstrapTable('removeAll');
            $('#branchesList').bootstrapTable('append', branches_list);
            console.log(branches_list);
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
            //console.log(row);
            return '<button onclick="angular.element(this).scope().showOnMap2(&quot;' + row.uid + '&quot;)" type="button" class="btn btn-primary">Show on map</button>'
        }

        formatDelete = (value, row, index, field) => {
            //console.log(row);
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
                'description': $scope.restDescription ? $scope.restDescription : '',
                'foodType': $scope.restFoodType ? $scope.restFoodType : '',
                'hotline': $scope.restHotline ? $scope.restHotline : '',
                'tags': {},
                'coverPhotoURL': coverDownloadURL ? coverDownloadURL : null,
                'coverPhotoLoc': coverPhotoLoc ? coverPhotoLoc : null,
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
                .add(obj)
                .then(function (docRef) {
                    addBranches(docRef.id);
                })
                .catch(function (error) {
                    console.error("Error adding document: ", error);
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    toastr.error('Error in Adding');
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
                .set({ 'branches': branches_list })
                .then(function () {
                    console.log("Document successfully written!");
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                    toastr.success('Restaurant Created');
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
        };

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
            while (true) {
                try {
                    init_map();
                    break;
                } catch (e) {
                    continue;
                }
            }
            $('#mapSearchtable').bootstrapTable({ data: table_data });
            $('#branchesList').bootstrapTable({ data: branches_list });
        });
    });
