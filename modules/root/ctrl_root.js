angular
    .module("digAPP")
    .controller('rootCtrl', function ($scope, $rootScope, $state, $window) {
        toastr.options = {
            "positionClass": "toast-bottom-right"
        };
        getIndexFromUID = (arr, uid) => {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].uid == uid) 
                    return i;
                if (arr[i].id == uid) 
                    return i;
                }
            return -1;
        }
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
                                if (doc.data().level == 'Admin') {
                                    if (doc.exists) {
                                        $window.sessionStorage.user = JSON.stringify(doc.data());
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        $state.go('manageRest');
                                    } else {
                                        firebase
                                            .auth()
                                            .signOut();
                                        $window.sessionStorage.user = '';
                                        $rootScope.isLoading = false;
                                        $rootScope.$digest();
                                        $state.go('login');
                                    }
                                } else {
                                    firebase
                                        .auth()
                                        .signOut();
                                    $window.sessionStorage.user = '';
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    $state.go('login');
                                    toastr.error("Access Denied");
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