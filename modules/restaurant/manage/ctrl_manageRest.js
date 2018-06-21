angular
    .module("digAPP")
    .controller('manageRestCtrl', function ($scope, $rootScope, $state, $window) {
        $('#manageRestContainer').hide();
        console.log('manage');
        var data = [];
        var docRef = db.collection('places');
        $rootScope.isLoading = true;
        docRef
            .get()
            .then(function (querySnapshot) {
                var i = 1;
                querySnapshot.forEach(function (doc) {
                    // doc.data() is never undefined for query doc snapshots
                    var place = {
                        'id': i,
                        'name': doc
                            .data()
                            .name,
                        'uid': doc.id,
                        'delete': '<button type="button" class="btn btn-danger">Delete</button>'
                    };
                    data.push(place);
                    i++;
                });
                $('#table').bootstrapTable({data: data});
                $rootScope.isLoading = false;
                $rootScope.$digest();
                $('#manageRestContainer').show();
            });

        $scope.editPlace = (index) => {
            $state.go('editRest', {'restID': data[index].uid});
        }

        $scope.editMenu = (index) => {
            $state.go('editMenu', {'restID': data[index].uid});
        }

        formatEditPlaceButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editPlace(' + index + ')" type="button" class="btn btn-primary">Edit Info</button>'
        }

        formatEditMenuButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editMenu(' + index + ')" type="button" class="btn btn-primary">Manage Menu</button>'
        }

    });