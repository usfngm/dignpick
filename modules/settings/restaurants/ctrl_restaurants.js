angular
    .module("digAPP")
    .controller('restaurantsSettingsCtrl', function ($scope, $rootScope, $state, $http, $stateParams, $window) {
        var restaurantTypesData = [];
        var restaurantTagsData = [];
        var editIndex;
        var resTypeMode = 'new';
        $('#restaurantsSettingsContainer').hide();
        $rootScope.isLoading = true;
        db
            .collection('restaurant_types')
            .get()
            .then((result) => {
                result.forEach((temp) => {
                    var tempObj = temp.data();
                    tempObj.uid = temp.id;
                    restaurantTypesData.push(tempObj);
                });
                db
                    .collection('tags')
                    .get()
                    .then((result) => {
                        result.forEach((temp) => {
                            var tempObj = temp.data();
                            tempObj.uid = temp.id;
                            restaurantTagsData.push(tempObj);
                        });
                        $('#restaurantsTypeTable').bootstrapTable({data: restaurantTypesData});
                        $('#restaurantsTagTable').bootstrapTable({data: restaurantTagsData});
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        $('#restaurantsSettingsContainer').show();
                    })

            })

        $scope.newResType = () => {
            $('#createResTypeModalTitle').text('New Restaurant Type');
            $('#createResTypeModalSubmitBtn').attr('value', 'Add');
            $scope.typeName = '';
            resTypeMode = 'new';
            $('#createResTypeModal').modal('show');
        }

        $scope.createResTypeSubmit = () => {
            if (resTypeMode == 'new') {
                $('#createResTypeModal').modal('hide');
                $rootScope.isLoading = true;
                var obj = {
                    'name': $scope.typeName
                }
                db
                    .collection('restaurant_types')
                    .add(obj)
                    .then((doc) => {
                        obj.uid = doc.id;
                        restaurantTypesData.push(obj);
                        $('#restaurantsTypeTable').bootstrapTable('load', {data: restaurantTypesData});
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        toastr.success('Type Added');
                        $scope.typeName = '';
                    })
                    .catch((error) => {
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        toastr.error('Error in Adding');
                    })
            } else if (resTypeMode == 'edit') {
                $('#createResTypeModal').modal('hide');
                $rootScope.isLoading = true;
                var obj = JSON.parse(JSON.stringify(restaurantTypesData[editIndex]));
                obj.name = $scope.typeName;
                db
                    .collection('restaurant_types')
                    .doc(obj.uid)
                    .set(obj)
                    .then((doc) => {
                        restaurantTypesData[editIndex] = obj;
                        $('#restaurantsTypeTable').bootstrapTable('load', {data: restaurantTypesData});
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        toastr.success('Type Edited');
                        $scope.typeName = '';
                    })
                    .catch((error) => {
                        $rootScope.isLoading = false;
                        $rootScope.$digest();
                        toastr.success('Error in Editing');
                        $scope.typeName = '';
                    })
            }
        }

        $scope.editType = (index) => {
            $('#createResTypeModalTitle').text('Edit Restaurant Type');
            $('#createResTypeModalSubmitBtn').attr('value', 'Edit');
            $scope.typeName = restaurantTypesData[index].name;
            $scope.$digest();
            $('#createResTypeModal').modal('show');
            editIndex = index;
            resTypeMode = 'edit';
        }

        $scope.deleteType = (index) => {
            bootbox.confirm({
                message: "Are you sure you want to delete '" + restaurantTypesData[index].name + "'?",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-primary'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    if (result) {
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        db
                            .collection('restaurant_types')
                            .doc(restaurantTypesData[index].uid)
                            .delete()
                            .then((doc) => {
                                restaurantTypesData.splice(index, 1);
                                $('#restaurantsTypeTable').bootstrapTable('load', {'data': restaurantTypesData});
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.success('Deleted');
                            })
                            .catch((error) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error('Error in deleting');
                            });
                    }
                }
            });
        }

        $scope.newResTag = () => {
            $scope.tagName = '';
            $('#createResTagModal').modal('show');
        }

        const createTagInRestaurants = async function (tag, cb, err) {
            db
                .collection('places')
                .get()
                .then((result) => {
                    result.forEach(async(temp) => {
                        var tempObj = temp.data();
                        tempObj.tags[tag] = false;
                        try {
                            await db
                                .collection('places')
                                .doc(temp.id)
                                .set(tempObj);
                        } catch (error) {
                            err(error);
                            return;
                        }
                    });
                    cb();
                })
        }

        const deleteTagInRestaurants = async function (tag, cb, err) {
            db
                .collection('places')
                .get()
                .then((result) => {
                    result.forEach(async(temp) => {
                        var tempObj = temp.data();
                        delete tempObj.tags[tag]
                        try {
                            await db
                                .collection('places')
                                .doc(temp.id)
                                .set(tempObj);
                        } catch (error) {
                            err(error);
                            return;
                        }
                    });
                    cb();
                })
        }

        $scope.createResTagSubmit = () => {
            if (/\s/.test($scope.tagName)) {
                alert('Tag names cannot contain whitespaces. Please try again.');
                return;
            }
            $('#createResTagModal').modal('hide');
            $rootScope.isLoading = true;
            var obj = {
                'name': $scope.tagName
            }

            db
                .collection('tags')
                .add(obj)
                .then((doc) => {
                    (async() => {
                        await createTagInRestaurants(obj.name, () => {
                            obj.uid = doc.id;
                            restaurantTagsData.push(obj);
                            $('#restaurantsTagTable').bootstrapTable('load', {'data': restaurantTagsData});
                            toastr.success('Tag Added');
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                        }, (error) => {
                            toastr.success('Error in adding');
                            $rootScope.isLoading = false;
                            $rootScope.$digest();
                        });
                    })();
                })
                .catch((error) => {
                    toastr.success('Error in adding');
                    $rootScope.isLoading = false;
                    $rootScope.$digest();
                })
        }

        $scope.deleteTag = (index) => {
            bootbox.confirm({
                message: "Are you sure you want to delete '" + restaurantTagsData[index].name + "'?",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-primary'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    if (result) {
                        $rootScope.isLoading = true;
                        $rootScope.$digest();
                        db
                            .collection('tags')
                            .doc(restaurantTagsData[index].uid)
                            .delete()
                            .then((doc) => {
                                deleteTagInRestaurants(restaurantTagsData[index].name, () => {
                                    restaurantTagsData.splice(index, 1);
                                    $('#restaurantsTagTable').bootstrapTable('load', {'data': restaurantTagsData});
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.success('Deleted');
                                }, (err) => {
                                    $rootScope.isLoading = false;
                                    $rootScope.$digest();
                                    toastr.error('Error in deleting');
                                });
                            })
                            .catch((error) => {
                                $rootScope.isLoading = false;
                                $rootScope.$digest();
                                toastr.error('Error in deleting');
                            });
                    }
                }
            });
        }

        formatEditButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().editType(' + index + ')" type="button" class="btn btn-primary">Edit</button>'
        }

        formatDeleteButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteType(' + index + ')" type="button" class="btn btn-danger">Delete</button>'
        }

        formatDeleteTagButton = (value, row, index, field) => {
            return '<button onclick="angular.element(this).scope().deleteTag(' + index + ')" type="button" class="btn btn-danger">Delete</button>'
        }

    });