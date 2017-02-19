var ac30WebApp = angular.module('ac30WebApp', []);

ac30WebApp.factory('MyService', ['$q', '$rootScope', function($q, $rootScope) {
    // We return this object to anything injecting our service
    var Service = {};
    // Create our websocket object with the address to the websocket
    var wsUrl = 'ws://' + window.location.host 
    var ws = new WebSocket(wsUrl + '/data/websocket')
    
    ws.onopen = function(){  
        console.log("Socket has been opened!");  
    };
    
    ws.onmessage = function(message) {
        listener(message);
    };

    function sendRequest(request) {
      var defer = $q.defer();
      console.log('Sending request', request);
      ws.send(JSON.stringify(request));
      return defer.promise;
    }

    function listener(data) {
      var messageObj = data;
       var jsonObj = angular.fromJson(messageObj.data);
       $rootScope.$broadcast('drivefound',jsonObj);
    }
    
    // Define a "getter" for getting customer data
    Service.DctScan = function() {
      var request = {
        type: "DriveScan"
      }
      // Storing in a variable for clarity on what sendRequest returns
      var promise = sendRequest(request); 
      return promise;
    }

    return Service;
}])

ac30WebApp.controller('mainController', function($scope, $http,MyService) {
    $scope.formData = {};
    $scope.firstName = "John";
    $scope.lastName = "Doe";
    var foundDrives ={};        
    $scope.DriveList = foundDrives;
    
    $scope.ScanDrives = function() {
        //var tmp = MyService.DctScan();
        MyService.DctScan();
    }

    $scope.$on('drivefound', function(event,drive) {
        console.log('Drives Scan found ' + drive.Name);
        foundDrives[drive.IpAddress] = drive;
    });

    function scan(){
        // Workaround for IE11. Added a time to the url to prevent caching.
        $http.get("/DCTScan?" + (new Date()).getTime()).success(function(data)
        {
            console.log(data);
        });
    }
});