

    $('#modal-tag486').on('shown.bs.modal', function () {
        alert('hello');
    })

angular.module('ac30WebApp', [
    'ngRoute',
    'ngFileUpload'
]);

angular.
    module('ac30WebApp').
        config(['$routeProvider', '$locationProvider', '$sceProvider',
            function configure($routeProvider,$locationProvider,$sceProvider) {
                $sceProvider.enabled(false);            
                // $locationProvider.html5Mode(true);
                // $locationProvider.hashPrefix('!');

                $routeProvider.
                    // route for the home page
                    when('/home', {
                        templateUrl : '/Views/drivescan.html',
                        controller  : 'mainController'
                    }).
                    // route for the NodeRed page
                    when('/node-red', {
                        templateUrl : '/Views/node-red.html',
                        controller  : 'mainController'
                    }).
                    // route for the Services page
                    when('/service', {
                        templateUrl : '/Views/service.html',
                        controller  : 'mainController'
                    }). 
                    // route for the System page
                    when('/system', {
                        templateUrl : '/Views/system.html',
                        controller  : 'driveSystemController'
                    }).
                    otherwise('/home');
            }
        ]).
        run(['$rootScope', '$location', 
            function($rootScope, $location){
                var path = function() { return $location.path();};
                $rootScope.$watch(path, function(newVal, oldVal){
                $rootScope.activetab = newVal;
                //$rootScope.endPoint = 'http://localhost:8080';
                });
            }]);

        