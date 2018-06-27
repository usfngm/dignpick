angular
    .module("digAPP")
    .controller('adsCtrl', function ($scope, $rootScope, $state, $stateParams, $window) {
        $scope.adType = 'imageAd';
        $scope.uploadProgress = 0;
        $scope.adEnabled = 'yes';
        $scope.fileName = "Choose File";
        var file;
        // Create a root reference
        var storageRef = firebase.storage().ref();

        $('#customFile').change(function (ev) {
            file = document.getElementById('customFile').files[0];
            if (file) {
                $scope.fileName = file.name;
                $scope.$digest();
                console.log(file);
                console.log(file.name.split('.').pop());
            }
        });

        onProgress = (prog) => {
            $scope.uploadProgress = prog;
            $('#adFormPB').animate({
                width: prog + '%'
            });
        }

        newAd = () => {
            // Upload file and metadata to the object 'images/mountains.jpg'
            var uploadTask = storageRef.child('ads/' + file.name + Date.now()).put(file);
            
        }

        $scope.newAd = () => {
            $('#createAdModal').modal('show');
        }
    });