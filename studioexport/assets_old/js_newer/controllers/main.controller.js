(function(){
    var app = angular.module('ac30WebApp');
    
    var mainController = app.controller('mainController', function($scope, $http, $route, $window, dctService, parameterSvc) {
        var foundDrives ={};        
        var HOST;
        $scope.DriveList = foundDrives; 
        $scope.FileList = {};
        $scope.ConsoleText = "";
        $scope.Command = {};
        $scope.SelectedDrive;
        $scope.nodeRedUrl;// = "http://raspberrypigp:1880";
        $scope.init = function() {
            $http.get("/GetHostIpAddress").success(function(hostIpAddress)
            {
                HOST = hostIpAddress;
                $scope.nodeRedUrl = "http://" + HOST + ":1880";
            })
            $scope.ScanDrives();
            $scope.GetFwFiles();
            console.log('mainController create');
            //dctService.DctScan();
            //dctService.GetFwFiles();
        };
        
        $scope.uploadFile = function(file){
            if(file != null)
            {
                //var file = "images.jpg";//$scope.myFile;
                //console.log("hello");
                console.log(file);
                var uploadUrl = "/multer";
                var fd = new FormData();
                fd.append('file', file);

                return $http.post(uploadUrl,fd, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                })
                .success(function(){
                    console.log("File Upload success!!");
                    $scope.GetFwFiles();
               })
                .error(function(){
                    console.log("File Upload Error!!");
                });
            }
        };
        
        $scope.writeFileToDrive = function(){
            console.log("/writeFileToDrive/" + $scope.SelectedFwFile.Name)
            $http.get("/writeFileToDrive/" + $scope.SelectedFwFile.Name)
                .success(function(data)
                {
                    console.log("File Write to Drive success!!");
                    //$scope.GetFwFiles();
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );     
        };
        
        $scope.DeleteFile = function(){
            console.log($scope.SelectedFwFile);
            $http.get("/delete/" + $scope.SelectedFwFile.Name)
                .success(function(data)
                {
                    console.log("File Delete success!!");
                    $scope.GetFwFiles();
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        };
        
        $scope.Identify = function()
        {
            $http.get("/identify/" + $scope.SelectedDrive.MacId)
                .success(function(data)
                {
                    console.log("Success: Identify " + $scope.SelectedDrive.MacId);
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        }
  
        $scope.Codesys = function(action){
            $http.get("/codesys/" + action)
                .success(function(data)
                {
                    console.log("Success: Codesys " + action);
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        }; 
        
        $scope.RestartWebserver = function(){
            $http.get("/console/pm2 restart all")
                .success(function(data)
                {
                    console.log("Success: Restart Webserver");
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        };
        
        $scope.ConsoleCmd = function(){
            $http.get("/console/" + $scope.Command.Text)
                .success(function(data)
                {
                    console.log("Success: Codesys " + action);
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        };
                
        $scope.ClearCommandText = function(){
            $scope.ConsoleText = "";
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
        };
        
        $scope.selectFwFile = function(file){
            if(file != $scope.SelectedFwFile)
            {
                file.active = true;
                if($scope.SelectedFwFile != null)
                {
                    $scope.SelectedFwFile.active = false;
                }
                $scope.SelectedFwFile = file;
            }
        };

        $scope.GetFwFiles = function()
        {
            $scope.FileList = {};
            $http.get("/GetFwFiles")
                .success(function(data)
                {
                    console.log("Success: GetFwFiles");
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        };

        $scope.ScanDrives = function() {
            $http.get("/DCTScan")
                .success(function(data)
                {
                    console.log("Success: DCT Scan");
                })
                .error(function(err)
                {
                    console.log(err);
                }
            );
        };

        $scope.$on('drivefound', function(event, drive) {
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
                
        $scope.$on('filefound', function(event,file) {
            console.log('File found ' + file);
            $scope.FileList[file.Name] = file;
            $scope.$apply();
        }); 
        
        $scope.$on('consolemessage', function(event,stdoutmessage) {
            console.log('Console Message ' + stdoutmessage);
            if($scope.ConsoleText == "")
            {
                $scope.ConsoleText = stdoutmessage.replace(/\n/g, "</br>");
            }
            else
            {
                $scope.ConsoleText = stdoutmessage.replace(/\n/g, "</br>") + $scope.ConsoleText;
            }
            $scope.$apply();
        });

        $scope.scan = function(){
            console.log("Scan test");
            $http.get("/GetHostIpAddress").
            success(function(data)
            {
                console.log(data);
            }).
            error(function(err)
            {
                console.log(err);
            }
            );
        };  
        
        $scope.$on('socket:opened', function(event) {
            //$scope.ScanDrives();
            //$scope.GetFwFiles();
            //dctService.DctScan();
        });

        $scope.$on('$destroy', function iVeBeenDismissed() {
            console.log('maincontroller destroy');
        });
        
        $scope.init();
    });
})();

(function(){
    var app = angular.module('ac30WebApp');
    var objectFilter = app.filter('orderObjectBy', function() {
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
})();
