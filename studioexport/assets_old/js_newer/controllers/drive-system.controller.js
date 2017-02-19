(function(){
    var app = angular.module('ac30WebApp');

    var driveSystemController = app.controller('driveSystemController', function($scope, $interval, $http, parameterSvc) {
        $scope.ParameterDictionary = [];
        $scope.DriveIpAddressDictionary = [];
               
        updateRateMs = 250;      
        
        $scope.init = function () {
            $scope.message = "Tap Master";
            $scope.ParameterDictionary = parameterSvc.ParameterDictionary;
            $scope.DriveIpAddressDictionary = parameterSvc.DriveIpAddressDictionary;
            console.log('driveSystemController create');
        }
        $scope.init();

        $scope.AddLiveParameters = function(hostname,parameterTagString)
        {
            console.log(parameterTagString);
            parameterSvc.AddLiveParameters(hostname, parameterTagString);
        };

        // $scope.Tag= function(parameterTag)
        // {
        //     if($scope.ParameterDictionary[parameterTag] == undefined ) 
        //     {
        //         $scope.ParameterDictionary[parameterTag] = "";
        //     }       
        //     return $scope.ParameterDictionary[parameterTag];
        // }

        // $scope.GetParameterValue = function(ipaddress, parameterTag)
        // {
        //     parameterSvc.GetParameterValue(ipaddress, parameterTag)
        //     .success(function(parameter) {            
        //         $scope.ParameterDictionary[parameterTag] = parameter.parameters[0];//.split(',')[2];
        //         //console.log('parameterValue returned to controller.', parameter.parameters[0]);
        //     })
        //     .error(function() {
        //         $scope.ParameterDictionary[parameterTag] = "Error";
        //         //console.log('parameterValue retrieval failed.');
        //     });
        // };

        $scope.GetParameterValues = function()
        {        
            parameterSvc.GetParameterValues();
        }; 
        
        $scope.SaveDriveIpAddressLookup = function(){
            $http.get("/savedriveipaddresslookup")
                .success(function(data)
                {
                    console.log("Success: SaveDriveIpAddressLookup");
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
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
})();

