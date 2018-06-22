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

        $stateProvider.state(loginState);
        $stateProvider.state(homeState);
        $stateProvider.state(manageRestaurantsState);
        $stateProvider.state(newRestaurantsState);
        $stateProvider.state(editRestaurantState);
        $stateProvider.state(editMenuState);
        $stateProvider.state(viewAddUsersState);
        $stateProvider.state(manageUser);

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
                var to = transition
                    .to()
                    .name;
                $rootScope.selectedTab = to;
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
            if (to == 'manageUser') {
                $rootScope.selectedTab = 'viewAddUsers';
            }
            else if (to == 'newRest' || to == 'editRest') {
                $rootScope.selectedTab = 'manageRest';
            }
            else
                $rootScope.selectedTab = to;

            return true;
        });
    });

// /*     A Helper method for hiding the navigation bar when the     Login page
// is dispayed */ var handleNavBarVisibility = (from, to, $rootScope) => {
// if (to === 'login') {         $rootScope.hideNavBar = true;     } else {
//    $rootScope.hideNavBar = false;     } }