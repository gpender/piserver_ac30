var ac30WebApp = angular.module('ac30WebApp', ['ngRoute']);

ac30WebApp.config(function($sceProvider) {
    $sceProvider.enabled(false);
 });
// routes
ac30WebApp.config(function($routeProvider) {
    $routeProvider
 
        // route for the home page
        .when('/', {
            templateUrl : 'drivescan.html',
            controller  : 'mainController'
        })
 
        // route for the about page
        .when('/node-red', {
            templateUrl : 'node-red.html',
            controller  : 'mainController'
        })
 
        // route for the service page
        .when('/service', {
            templateUrl : 'service.html',
            controller  : 'driveSystemController'
        });
 
}).run(['$rootScope', '$location', function($rootScope, $location){
   var path = function() { return $location.path();};

    $rootScope.$watch(path, function(newVal, oldVal){
    $rootScope.activetab = newVal;
   });
}]);

ac30WebApp.factory('dctService', ['$q', '$rootScope', function($q, $rootScope) {
    // We return this object to anything injecting our service
    var service = {};
    // Create our websocket object with the address to the websocket
    var wsUrl = 'ws://' + window.location.host 
    var ws = new WebSocket(wsUrl + '/data/websocket')
    
    ws.onopen = function(){  
        console.log("Socket has been opened!");
        $rootScope.$broadcast('socket:opened');  
    };
    
    ws.onmessage = function(message) {
        listener(message);
    };

    function sendRequest(request) {
      console.log('Sending request', request);
      ws.send(JSON.stringify(request));
    }

    function listener(data) {
      var messageObj = data;
       var jsonObj = angular.fromJson(messageObj.data);
       $rootScope.$broadcast('drivefound',jsonObj);
    }
    
    service.DctScan = function() {
      if(ws.readyState == 1)
      {
        var request = {
            type: "DriveScan"
        }
        sendRequest(request);
      } 
    }
    return service;
}])

ac30WebApp.service("parameterSvc", function ($http, $q, $rootScope) {
    scopeSvc = this;

    // request names as follows->http://172.18.177.148/restricted/get_params.html?n0=1139
    this.getParameterValue = function(ipaddress, tag){
        return $http.get("http://" + ipaddress + "/restricted/get_params.html?n0=" + tag, { responseType: "text" })
        .success(function(res) {
            scopeSvc.parameterValue = res;//.split(',')[2];
        });      
    }
    
    // request names as follows->http://172.18.177.148/restricted/get_params.html?n0=1139
    this.setParameterValue = function(tag, value){
        var defer = $q.defer();
        $http.get("/restricted/parameters.act?V"+tag+"="+value, { responseType: "text" })
        .success(function (res) {
            //scopeSvc.parameterValue = res.split(',')[2];
            defer.resolve(res);
        })
        .error(function (err, status) {
            defer.reject(err);
        })
        return defer.promise;        
    }
    return this;
});


ac30WebApp.controller('mainController', function($scope, $http,dctService) {
    $scope.init = function() {
        dctService.DctScan();
    };
    $scope.formData = {};
    $scope.firstName = "John";
    $scope.lastName = "Doe";
    var foundDrives ={};        
    $scope.DriveList = foundDrives; 
    $scope.DriveIpAddress = "http://192.168.2.43";
    $scope.SelectedDrive;
    
    $scope.selectDrive = function(drive){
        $scope.SelectedDrive = drive;
        $scope.DriveIpAddress = "http://" + drive.IpAddress;
    }
    $scope.ScanDrives = function() {
        dctService.DctScan();
    }
    $scope.$on('drivefound', function(event,drive) {
        console.log('Drives Scan found ' + drive.Name);
        $scope.DriveList[drive.IpAddress] = drive;
        drive.url = "http://" + drive.IpAddress;
        // scope apply is not recommended but I haven't worked out how better to do it yet
        $scope.$apply();
    });

    function scan(){
        // Workaround for IE11. Added a time to the url to prevent caching.
        $http.get("/DCTScan?" + (new Date()).getTime()).success(function(data)
        {
            console.log(data);
        });
    }
    
    $scope.$on('socket:opened', function(event) {
        dctService.DctScan();
    });

    $scope.$on('$destroy', function iVeBeenDismissed() {
        console.log('maincontroller destroy');
    });
    $scope.init();
});

ac30WebApp.controller('driveSystemController', function($scope, $interval, $http, parameterSvc) {
    $scope.firstName = "John";
    $scope.ParameterDictionary = [];
    $scope.Tag= function(parameterTag)
    {
        if($scope.ParameterDictionary[parameterTag] == undefined ) 
        {
            $scope.ParameterDictionary[parameterTag] = "";
        }       
        return $scope.ParameterDictionary[parameterTag];
    }
        
    $scope.GetParameterValue = function(ipaddress, parameterTag)
    {
        parameterSvc.getParameterValue(ipaddress, parameterTag)
        .success(function(parameterValue) {            
            $scope.ParameterDictionary[parameterTag] = parameterValue;//.split(',')[2];
            console.log('parameterValue returned to controller.', parameterValue);
        })
        .error(function() {
            $scope.ParameterDictionary[parameterTag] = "Error";
            //console.log('parameterValue retrieval failed.');
        });
    };

    $scope.$on('$destroy', function iVeBeenDismissed() {
        console.log('driveSystemController destroy');
        $scope.stop();;//$interval.cancel(parameterReadInterval);
    });

    var parameterReadInterval = $interval(function(){
        for (var key in $scope.ParameterDictionary) 
        {
            $scope.GetParameterValue('192.168.2.43',key);
        }
    },100);
    // stops the interval
    $scope.stop = function() {
      $interval.cancel(parameterReadInterval);
    };
});

ac30WebApp.directive('tab', function() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div role="tabpanel" ng-show="active" ng-transclude></div>',
    require: '^tabset',
    scope: {
        heading: '@',
        ipaddress: '@'
    },
    link: function(scope, elem, attr, tabsetCtrl) {
        scope.active = false;
        tabsetCtrl.addTab(scope);
    }
}});

ac30WebApp.directive('tabset', function() {
  return {
    restrict: 'E',
    transclude: true,
    scope: { },
    templateUrl: '/assets/templates/tabset.html',
    bindToController: true,
    controllerAs: 'tabset',
    controller: function() {
        var self = this
        self.tabs = []
        self.addTab = function addTab(tab) {
        self.tabs.push(tab)
        if(self.tabs.length === 1) {
            tab.active = true
            }
        }
        self.select = function(selectedTab) {
            angular.forEach(self.tabs, function(tab) {
            if(tab.active && tab !== selectedTab) {
                tab.active = false;
            }
            })
            selectedTab.active = true;
        }
    }
  }
});


ac30WebApp.directive('drivetabset', function() {
  return {
    restrict: 'E',
    transclude: true,
    templateUrl: '/assets/templates/drivetabset.html',
    bindToController: true,
    controllerAs: 'drivetabset',
    controller: function($scope) {
        var self = this
        self.drivelist = $scope.DriveList;
        self.tabs = {};//[]
        self.init = function() {
            for (var key in self.drivelist) 
            {
                self.addDriveTab(self.drivelist[key]);
            }
        };
        self.addTab = function addTab(tab) {
            self.tabs[tab.ipaddress] = tab;
            if(self.tabs.length === 1) {
                tab.active = true
            }
        }
        self.addDriveTab = function addDriveTab(drive) {
            var newTab = {
                header: drive.Name,
                ipaddress: drive.IpAddress,
                url: "http://" + drive.IpAddress
            }
            self.tabs[newTab.ipaddress] = newTab;
            if(self.tabs.length === 1) {
                newTab.active = true
            }
        }
        self.select = function(selectedTab) {
            angular.forEach(self.tabs, function(tab) {
            if(tab.active && tab !== selectedTab) {
                tab.active = false;
            }
            })
            selectedTab.active = true;
        }
        self.init();
        $scope.$on('drivefound', function(event,drive) {
            self.addDriveTab(drive);
        });
    }
  }
});


