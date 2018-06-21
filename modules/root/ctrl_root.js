angular
    .module("digAPP")
    .controller('rootCtrl', function ($scope, $rootScope, $state, $window) {
        toastr.options = {
            "positionClass": "toast-bottom-right"
        };
        firebase
            .auth()
            .onAuthStateChanged((user) => {
                if (user) { // Logged In
                    if (!$window.sessionStorage.user) {
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        const uid = user.uid;
                        var docRef = db
                            .collection('users')
                            .doc(uid);
                        docRef
                            .get()
                            .then(function (doc) {
                                if (doc.exists) {
                                    $window.sessionStorage.user = JSON.stringify(doc.data());
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    $state.go('manageRest');
                                } else {
                                    $window.sessionStorage.user = '';
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    $state.go('login');
                                }
                            })
                            .catch(function (error) {
                                console.log("Error getting document:", error);
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                            });
                    } else {
                        //$state.go('manageRest');
                    }
                } else { // Not Logged In
                    $window.sessionStorage.user = '';
                    $state.go('login');
                    console.log("NOT LOGGED IN");
                }

            });
    });