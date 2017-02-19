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
    parameterSvc = this;
    var parameterTags = [];
    var typeDictionary = [];
    typeDictionary[0] = 'REAL';
    typeDictionary[1] = 'BOOL';
    typeDictionary[2] = 'SINT';
    typeDictionary[3] = 'INT';
    typeDictionary[4] = 'DINT';
    typeDictionary[5] = 'USINT';
    typeDictionary[6] = 'UINT';
    typeDictionary[7] = 'UDINT';
    typeDictionary[8] = 'BYTE';
    typeDictionary[10] = 'DWORD';
    typeDictionary[12] = 'STRING';
    typeDictionary[13] = 'ENUM';
    typeDictionary[14] = 'WORD';
    typeDictionary[16] = 'TIME';
    typeDictionary[17] = 'TIME_OF_DAY';
    typeDictionary[18] = 'DATE';
    typeDictionary[19] = 'DATE_AND_TIME';
    // ParameterDictionary is the main property for this service providing access to Parameter attributes and live values 
    parameterSvc.ParameterDictionary = [];

    this.addLiveParameters = function(parameterTagString)
    {
        var parameterArray = parameterTagString.split(',');
        for (var i = 0; i < parameterArray.length; i++) {
            var parameterObj = [];
            var parameterTag = parameterArray[i];
            if(parameterSvc.ParameterDictionary[parameterTag] == undefined ) 
            {
                parameterObj.Tag = parameterTag;
                parameterObj.Value = "undefined";
                parameterObj.ValueAndUnits = "undefined";
                parameterObj.Name = parameterTag + " name";
                parameterObj.Type = parameterTag + " type";
                parameterObj.WriteQualifier = 0;                
                parameterObj.Enums = parameterTag + " enums";
                parameterObj.Units = "";                
                parameterObj.TimeStamp = parameterTag + " timestamp";                
                parameterObj.Tooltip = parameterTag + " tooltip";                
                parameterSvc.ParameterDictionary[parameterTag] = parameterObj;
                parameterTags.push(parameterTag);
            }
        };
        parameterSvc.getParameterAttributes('192.168.2.43');
    };

    // http://{{DRIVEIPADDRESS}}:8080/z:/restricted/get_params.json?n0={{TAGNO+20000}}&n1={{TAGNO+20000}}
    this.getParameterAttributesJson = function(ipaddress, tags){
        var tagQueryString = '';
        tagQty = tags.length;
        for (i = 0; i < tagQty; i++) {
            tagQueryString += "n" + i + "=" + (parseInt(tags[i])+parseInt(20000));
            if(i < tagQty-1) { tagQueryString += "&";}
        }
        return $http.get("http://" + ipaddress + "/z:/restricted/get_params.json?" + tagQueryString, { responseType: "json" })
        .success(function (res) {
            parameterSvc.parameterName = res.data;
        });
    }

    this.getParameterAttributes = function(ipaddress)
    {
        parameterSvc.getParameterAttributesJson(ipaddress, parameterTags)
        .success(function(parameterAttributes) {            
            for (var i = 0; i < parameterAttributes.parameters.length; i++) 
            {
                var parameter = parameterAttributes.parameters[i];
                parameterSvc.ParameterDictionary[parameter.pno].Tag = parameter.pno;
                parameterSvc.ParameterDictionary[parameter.pno].Name = parameter.name;
                parameterSvc.ParameterDictionary[parameter.pno].Type = typeDictionary[parameter.type];
                if(parameter.wq != undefined)
                {
                    parameterSvc.ParameterDictionary[parameter.pno].WriteQualifier = parameter.wq;
                }
                if(parameter.units != undefined)
                {
                    parameterSvc.ParameterDictionary[parameter.pno].Units = parameter.units;
                    parameterSvc.ParameterDictionary[parameter.pno].Tooltip = parameter.pno + ':  ' + parameter.name + " (" + parameter.units + ") Type: " + typeDictionary[parameter.type];
                }
                else
                {
                    parameterSvc.ParameterDictionary[parameter.pno].Tooltip = parameter.pno + ':  ' + parameter.name + " Type: " + typeDictionary[parameter.type];
                }
                if(parameter.type == 13)
                {
                    var validEnums = [];
                    var index = 0;
                    for (var key in parameter.enums) {
                        if (parameter.enums.hasOwnProperty(key)) {
                            var element = parameter.enums[key];
                            if(!element.enum.startsWith('{'))
                            {
                                element.index = index;
                                validEnums.push(element);
                            }
                            index++;
                        }
                    }
                    parameterSvc.ParameterDictionary[parameter.pno].Enums = validEnums;// parameter.enums;
                }
            }
            //$rootScope.$broadcast('ParameterServiceInitialized');
            console.log('parameterAttributes returned to controller.', parameterAttributes.parameters);
        })
        .error(function() {
            parameterSvc.ParameterDictionary[1].Value = "Error";
            console.log('parameterAttributes retrieval failed.');
        });
    }; 

    // Get Value with Timestamp
    // http://{{DRIVEIPADDRESS}}:8080/z:/restricted/get_params.json?n0={{TAGNO+10000}}
    this.getParameterValue = function(ipaddress, tag){
        return $http.get("http://" + ipaddress + "/z:/restricted/get_params.json?n0=" + (parseInt(tag)+parseInt(10000)), { responseType: "json" })
        .success(function(res) {
            parameterSvc.parameterValue = res.data;
        });      
    } 
    
    // Get Values with Timestamp
    // http://{{DRIVEIPADDRESS}}:8080/z:/restricted/get_params.json?n0={{TAGNO+10000}}&n1={{TAGNO+10000}}
    this.getParameterValuesJson = function(ipaddress, tags){
        var tagQueryString = '';
        tagQty = tags.length;
        for (i = 0; i < tagQty; i++) {
            tagQueryString += "n" + i + "=" + (parseInt(tags[i])+parseInt(0000));
            if(i < tagQty-1) { tagQueryString += "&";}
        }
        return $http.get("http://" + ipaddress + "/z:/restricted/get_params.json?" + tagQueryString, { responseType: "json" })
        .success(function(res) {
            parameterSvc.parameterValue = res.data;
        });      
    }  
    this.flag=false;
    this.getParameterValues = function(ipaddress){
        parameterSvc.getParameterValuesJson(ipaddress, parameterTags)
        .success(function(parameterValues) {
            for (var i = 0; i < parameterValues.parameters.length; i++) 
            {
                var parameter = parameterValues.parameters[i];
                if(parameter.units != undefined)
                {
                    parameterSvc.ParameterDictionary[parameter.pno].ValueAndUnits = parameter.value + " "  + parameter.units;
                    parameterSvc.ParameterDictionary[parameter.pno].Units = parameter.units;
                }
                else
                {
                    parameterSvc.ParameterDictionary[parameter.pno].ValueAndUnits = parameter.value;
                }
                parameterSvc.ParameterDictionary[parameter.pno].Value = parameter.value;
                parameterSvc.ParameterDictionary[parameter.pno].TimeStamp = parameter.timestamp;
            }
            if(!this.flag)
            {
                $rootScope.$broadcast('ParameterServiceInitialized');
                //this.flag=true;
            }
            console.log('parameterValue returned to controller.', parameterValues.parameters);
        })
        .error(function() {
            parameterSvc.ParameterDictionary[1].Value = "Error";
            parameterSvc.ParameterDictionary[1].ValueAndUnits = "Error";
            console.log('parameterValues retrieval failed.');
        });
    }

    this.getTraceBinBytes = function(ipaddress){
        // request names as follows->http://172.18.177.148:8080/_buf/trace.bin
        this.getTraceBinBytes = function(){
            return $http.get("http://" + ipaddress + "/_buf/trace.bin", { responseType: "arraybuffer" })
            .success(function(res) {
            });        
        }
    };

    // request names as follows->http://172.18.177.148/restricted/get_params.html?n0=1139
    this.setParameterValue = function(ipaddress, tag, value){
        var defer = $q.defer();
        return $http.get("http://" + ipaddress + "/restricted/parameters.act?V"+tag+"="+value, { responseType: "text" })
        .success(function (res) {
        })
        .error(function (err, status) {
        });
    }
    return this;
});


ac30WebApp.controller('mainController', function($scope, $http,dctService) {
    var foundDrives ={};        
    var HOST;
    $scope.DriveList = foundDrives; 
    $scope.SelectedDrive;
    $scope.nodeRedUrl;// = "http://raspberrypigp:1880";
    $scope.init = function() {
        $http.get("/GetHostIpAddress").success(function(hostIpAddress)
        {
            HOST = hostIpAddress;
            $scope.nodeRedUrl = "http://" + HOST + ":1880";
        })
        dctService.DctScan();
    };
    $scope.selectDrive = function(drive){
        if(drive != $scope.SelectedDrive)
        {
            drive.active = true;
            if($scope.SelectedDrive != null)
            {
                $scope.SelectedDrive.active = false;
            }
            $scope.SelectedDrive = drive;
        }
    }
    $scope.ScanDrives = function() {
        dctService.DctScan();
    }
    
    $scope.$on('drivefound', function(event,drive) {
        console.log('Drives Scan found ' + drive.DriveType);
        $scope.DriveList[drive.IpAddress] = drive;
        drive.url = "http://" + drive.IpAddress;
        if($scope.SelectedDrive != null)
        {
            if(drive.IpAddress == $scope.SelectedDrive.IpAddress)
            {
                $scope.selectDrive(drive);
            }
        }
        // scope apply is not recommended but I haven't worked out how better to do it yet
        $scope.$apply();
    });

    $scope.scan = function(){
        console.log("Scan test");
        $http.get("/GetHostIpAddress").success(function(data)
        {
            console.log(data);
        }).error(function(err)
        {
            console.log(err);
        }
        );
                // Workaround for IE11. Added a time to the url to prevent caching.
        // $http.get("/DCTScan?" + (new Date()).getTime()).success(function(data)
        // {
        //     console.log(data);
        // });
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
    $scope.ParameterDictionary = [];
    updateRateMs = 250;

    $scope.init = function () {
        $scope.message = "Tap Master";
        $scope.ParameterDictionary = parameterSvc.ParameterDictionary;
    }
    $scope.init();

    $scope.AddLiveParameters = function(parameterTagString)
    {
        console.log(parameterTagString);
        parameterSvc.addLiveParameters(parameterTagString);
    };

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
        .success(function(parameter) {            
            $scope.ParameterDictionary[parameterTag] = parameter.parameters[0];//.split(',')[2];
            console.log('parameterValue returned to controller.', parameter.parameters[0]);
        })
        .error(function() {
            $scope.ParameterDictionary[parameterTag] = "Error";
            //console.log('parameterValue retrieval failed.');
        });
    };
    
    $scope.GetParameterValues = function()
    {        
        parameterSvc.getParameterValues('192.168.2.43');
    }; 

    $scope.$on('$destroy', function iVeBeenDismissed() {
        console.log('driveSystemController destroy');
        $scope.stop();;//$interval.cancel(parameterReadInterval);
    });

    //$interval(function(){
    //    $scope.GetParameterValues();
    //},updateRateMs);

    var parameterReadInterval = $interval(function(){
        $scope.GetParameterValues();
    },updateRateMs);

    // stops the interval
    $scope.stop = function() {
      $interval.cancel(parameterReadInterval);
    };
});

ac30WebApp.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
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




