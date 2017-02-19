(function(){

    var app = angular.module('ac30WebApp');
    
    var parameterService = app.service("parameterSvc", function ($http, $q, $rootScope) {
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
        
        parameterSvc.DriveIpAddressDictionary =[];
        parameterSvc.DriveIpAddressDictionary["localhost"] = "localhost";
        parameterSvc.DriveIpAddressDictionary["drive1"] = "192.168.41.18";
        parameterSvc.DriveIpAddressDictionary["drive2"] = "192.168.41.14";
        // ParameterDictionary is the main property for this service providing access to Parameter attributes and live values 
        parameterSvc.ParameterDictionary = [];

        parameterSvc.Parent = [];
        
        this.AddLiveParameters = function(hostname, parameterTagString)
        {
            //parameterSvc.DriveIpAddressDictionary["drive1"] = ipaddress;
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
                    if(parameterTag == 1)
                    {
                        parameterSvc.Parent['drive1'] = [];
                        parameterSvc.Parent['drive1']['1'] = parameterObj;                     
                    }
                    parameterTags.push(parameterTag);
                }
            };
            parameterSvc.getParameterAttributes();
        };
this.isPaused=false;
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

        this.getParameterAttributes = function()
        {
            var ipaddress = parameterSvc.DriveIpAddressDictionary["drive1"];
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
        this.GetParameterValue = function(ipaddress, tag){
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
        this.GetParameterValues = function(){
            var ipaddress = parameterSvc.DriveIpAddressDictionary["drive1"];
            if(!parameterSvc.isPaused)
            {
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
                        if(parameter.pno == 1)
                        {
                            //$scope.Parent['drive1'] = [];
                            parameterSvc.Parent['drive1']['1'].Value = parameter.value;                    
                        }
                    }
                    if(!this.flag)
                    {
                        $rootScope.$broadcast('ParameterServiceInitialized');
                        //this.flag=true;
                    }
                    //console.log('parameterValue returned to controller.', parameterValues.parameters);
                })
                .error(function() {
                    if(parameterSvc.ParameterDictionary != undefined && parameterSvc.ParameterDictionary[1] != undefined)
                    {
                        parameterSvc.ParameterDictionary[1].Value = "Error";
                        parameterSvc.ParameterDictionary[1].ValueAndUnits = "Error";
                    }
                    console.log('parameterValues retrieval failed.');
                });
            }
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
        this.SetParameterValue = function(hostname, tag, value){
            var ipaddress = parameterSvc.DriveIpAddressDictionary[hostname];
            parameterSvc.isPaused = true;
            var defer = $q.defer();
            $http.get("http://" + ipaddress + "/restricted/parameters.act?V"+tag+"="+value, { responseType: "text" })
            .success(function (res) {
                console.log("write success");
                defer.resolve(res);
                parameterSvc.isPaused = false;
            })
            .error(function (err, status) {
                console.log("write failure");
                defer.reject(new Error(err));
                parameterSvc.isPaused = false;
            });
            return defer.promise;            
        }
        
        return this;
    });
})();
