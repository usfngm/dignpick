/*
    The App's Root Router
*/
angular
    .module("digAPP")
    .config(function ($stateProvider, $qProvider, $urlRouterProvider, $locationProvider) {

        // $qProvider.errorOnUnhandledRejections(false); Default Page is the login page
        // Default Page
        $urlRouterProvider.otherwise('/login');

        /*
        The login router view
        */
        var loginState = {
            name: 'login',
            url: '/login',
            templateUrl: 'modules/login/view_login.html'
        }

        var homeState = {
            name: 'home',
            url: '/home',
            templateUrl: 'modules/home/view_home.html'
        }

        var manageRestaurantsState = {
            name: 'manageRest',
            url: '/manageRestaurants',
            templateUrl: 'modules/restaurant/manage/view_manage_restaurants.html',
            parent: 'home'
        }

        var newRestaurantsState = {
            name: 'newRest',
            url: '/newRestaurant',
            templateUrl: 'modules/restaurant/new/view_new_restaurants.html',
            parent: 'home'
        }

        var editRestaurantState = {
            name: 'editRest',
            url: '/editRestaurant/:restID',
            templateUrl: 'modules/restaurant/edit/view_edit_restaurants.html',
            parent: 'home'
        }

        var editMenuState = {
            name: 'editMenu',
            url: '/menu/:restID',
            templateUrl: 'modules/menu/view_menu.html',
            parent: 'home'
        }

        var editMenuDishesState = {
            name: 'editMenuDishes',
            url: '/editDishes',
            templateUrl: 'modules/menu/dishes/view_edit_dishes.html',
            parent: 'editMenu'
        }

        var editMenuDrinksState = {
            name: 'editMenuDrinks',
            url: '/editDrinks',
            templateUrl: 'modules/menu/drinks/view_edit_drinks.html',
            parent: 'editMenu'
        }

        var editMenuDessertsState = {
            name: 'editMenuDesserts',
            url: '/editDesserts',
            templateUrl: 'modules/menu/desserts/view_edit_desserts.html',
            parent: 'editMenu'
        }

        var editMenuShishaState = {
            name: 'editMenuShisha',
            url: '/editShisha',
            templateUrl: 'modules/menu/shisha/view_edit_shisha.html',
            parent: 'editMenu'
        }

        var viewAddUsersState = {
            name: 'viewAddUsers',
            url: '/viewUsers',
            templateUrl: 'modules/users/view_add_users.html',
            parent: 'home'
        }

        var manageUser = {
            name: 'manageUser',
            url: '/manageUser/:userID',
            templateUrl: 'modules/users/manage/view_manage_user.html',
            parent: 'home'
        }

        var manageAds = {
            name: 'manageAds',
            url: '/manageAds',
            templateUrl: 'modules/manage_ads/view_manage.html',
            parent: 'home'
        }

        var settings = {
            name: 'settings',
            url: '/settings',
            templateUrl: 'modules/settings/view_settings.html',
            parent: 'home'
        }

        var locationsSettings = {
            name: 'locationsSettings',
            url: '/locations',
            templateUrl: 'modules/settings/locations/view_locations.html',
            parent: 'settings'
        }

        var restaurantSettings = {
            name: 'restaurantSettings',
            url: '/restaurants',
            templateUrl: 'modules/settings/restaurants/view_restaurants.html',
            parent: 'settings'
        }

        var appSettings = {
            name: 'appSettings',
            url: '/app',
            templateUrl: 'modules/settings/application/view_application.html',
            parent: 'settings'
        }

        $stateProvider.state(loginState);
        $stateProvider.state(homeState);
        $stateProvider.state(manageRestaurantsState);
        $stateProvider.state(newRestaurantsState);
        $stateProvider.state(editRestaurantState);
        $stateProvider.state(editMenuState);
        $stateProvider.state(viewAddUsersState);
        $stateProvider.state(manageUser);
        $stateProvider.state(editMenuDishesState);
        $stateProvider.state(editMenuDrinksState);
        $stateProvider.state(editMenuDessertsState);
        $stateProvider.state(editMenuShishaState);
        $stateProvider.state(manageAds);
        $stateProvider.state(settings);
        $stateProvider.state(locationsSettings);
        $stateProvider.state(restaurantSettings);
        $stateProvider.state(appSettings);

    })
    .run(function ($rootScope, $transitions, $state, $window) {

        // Initial selected tab
        $rootScope.selectedTab = 'manageRest';

        /*
         Listen for changes on navigation before
         they actually happen
        */
        $transitions.onBefore({}, function (transition) {
            /*
            A Helper snippet for checking whether the user is logged in
            or not before navigating to some pages
            */
            var user = $window.sessionStorage.user;
            if (transition.to().name === 'login') { // If navigating to login
                if (user) { // If logged in
                    $state.go('manageRest'); // Redirect to home
                    return false; // Stop current navigation
                }
            } else { // If navigating to any other page
                if (!user) { // If not logged in
                    $state.go('login'); // Redirect to login
                    return false; // Stop current navigation
                }

                /*
                    A helper snippet for highlighting the
                    selected tab
                */
                // var to = transition     .to()     .name; $rootScope.selectedTab = to;
            }

            return true;
        });

        // /*     Listening for changes on navigation when     it is starts */
        // $transitions.onStart({}, function (transition) {
        // handleNavBarVisibility(transition.from().name, transition.to().name,
        // $rootScope);     return true; });

        /*
        Listening for URL changed successfully
        */
        $transitions.onSuccess({}, function (transition) {
            var to = transition
                .to()
                .name;
            console.log(to);
            if (to == 'manageUser') {
                $rootScope.selectedTab = 'viewAddUsers';
            } else if (to == 'newRest' || to == 'editRest' || to == 'editMenu' || to == 'editMenuDrinks' || to == 'editMenuDishes' || to == "editMenuDesserts" || to == "editMenuShisha") {
                $rootScope.selectedTab = 'manageRest';
            } else if (to == 'locationsSettings' || to == 'restaurantSettings' || to == 'appSettings') {
                $rootScope.selectedTab = 'settings';
                $rootScope.settingsSelectedTab = to;
            } else 
                $rootScope.selectedTab = to;
            
            if (to == 'editMenuDrinks' || to == 'editMenuDishes' || to == "editMenuDesserts" || to == "editMenuShisha") {
                $rootScope.editMenuSelectedTab = to;
            }

            if (to == 'settings')
            {
                $state.go('locationsSettings');
            }

            return true;
        });
    });

// /*     A Helper method for hiding the navigation bar when the     Login page
// is dispayed */ var handleNavBarVisibility = (from, to, $rootScope) => { if
// (to === 'login') {         $rootScope.hideNavBar = true;     } else {
// $rootScope.hideNavBar = false;     } }