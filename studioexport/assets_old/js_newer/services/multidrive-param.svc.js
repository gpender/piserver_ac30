(function(){

    var app = angular.module('ac30WebApp');
    
    var parameterService = app.service("parameterSvc", function ($http, $q, $rootScope) {
        parameterSvc = this;
        var isPaused = false;
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
        //parameterSvc.DriveIpAddressDictionary["localhost"] = "localhost";
        parameterSvc.DriveIpAddressDictionary["drive1"] = "192.168.41.18";
        parameterSvc.DriveIpAddressDictionary["drive2"] = "192.168.41.14";
        // ParameterDictionary is the main property for this service providing access to Parameter attributes and live values 
        parameterSvc.ParameterDictionary = [];
        
        this.AddLiveParameters = function(hostname, parameterTagString)
        {
            var parameterArray = parameterTagString.split(',');
            if(parameterSvc.ParameterDictionary[hostname] == undefined )
            {
                parameterSvc.ParameterDictionary[hostname] = [];
                parameterSvc.ParameterDictionary[hostname].Tags = [];                
                parameterSvc.ParameterDictionary[hostname].IpAddress = parameterSvc.DriveIpAddressDictionary[hostname];                
            }
            for (var i = 0; i < parameterArray.length; i++) {
                var parameterObj = [];
                var parameterTag = parameterArray[i];
                if(parameterSvc.ParameterDictionary[hostname][parameterTag] == undefined ) 
                {
                    parameterObj.Tag = parameterTag;
                    parameterObj.Value = "value";
                    parameterObj.ValueAndUnits = "valueandunits";
                    parameterObj.Name = parameterTag + " name";
                    parameterObj.Type = parameterTag + " type";
                    parameterObj.WriteQualifier = 0;                
                    parameterObj.Enums = parameterTag + " enums";
                    parameterObj.Units = "";                
                    parameterObj.TimeStamp = parameterTag + " timestamp";                
                    parameterObj.Tooltip = parameterTag + " tooltip";                
                    parameterSvc.ParameterDictionary[hostname][parameterTag] = parameterObj;
                    parameterSvc.ParameterDictionary[hostname].Tags.push(parameterTag);
                }
            };
            parameterSvc.getParameterAttributes(hostname);                        
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

        this.getParameterAttributes = function(hostname)
        {
            //var ipaddress = parameterSvc.DriveIpAddressDictionary["drive1"];
            //parameterSvc.Parent[hostname]
            var ipaddress = parameterSvc.ParameterDictionary[hostname].IpAddress;
            var parameterTags = parameterSvc.ParameterDictionary[hostname].Tags;

            parameterSvc.getParameterAttributesJson(ipaddress, parameterTags)
            .success(function(parameterAttributes) {            
                for (var i = 0; i < parameterAttributes.parameters.length; i++) 
                {
                    var parameter = parameterAttributes.parameters[i];
                    parameterSvc.ParameterDictionary[hostname][parameter.pno].Tag = parameter.pno;
                    parameterSvc.ParameterDictionary[hostname][parameter.pno].Name = parameter.name;
                    parameterSvc.ParameterDictionary[hostname][parameter.pno].Type = typeDictionary[parameter.type];
                    if(parameter.wq != undefined)
                    {
                        parameterSvc.ParameterDictionary[hostname][parameter.pno].WriteQualifier = parameter.wq;
                    }
                    if(parameter.units != undefined)
                    {
                        parameterSvc.ParameterDictionary[hostname][parameter.pno].Units = parameter.units;
                        parameterSvc.ParameterDictionary[hostname][parameter.pno].Tooltip = parameter.pno + ':  ' + parameter.name + " (" + parameter.units + ") Type: " + typeDictionary[parameter.type];
                    }
                    else
                    {
                        parameterSvc.ParameterDictionary[hostname][parameter.pno].Tooltip = parameter.pno + ':  ' + parameter.name + " Type: " + typeDictionary[parameter.type];
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
                        parameterSvc.ParameterDictionary[hostname][parameter.pno].Enums = validEnums;
                    }
                }

                //$rootScope.$broadcast('ParameterServiceInitialized');
                console.log('parameterAttributes returned to controller.', parameterAttributes.parameters);
            })
            .error(function() {
                parameterSvc.ParameterDictionary[hostname][1].Value = "Error";
                console.log('parameterAttributes retrieval failed.');
            });

        }; 

        // Get Value with Timestamp
        // http://{{DRIVEIPADDRESS}}:8080/z:/restricted/get_params.json?n0={{TAGNO+10000}}
        this.GetParameterValue = function(hostname, ipaddress, tag){
            return $http.get("http://" + ipaddress + "/z:/restricted/get_params.json?n0=" + (parseInt(tag)+parseInt(10000)), { responseType: "json" })
            .success(function(res) {
                res.hostname = hostname;
                return res;
            });      
        } 

        // Get Values with Timestamp
        // http://{{DRIVEIPADDRESS}}:8080/z:/restricted/get_params.json?n0={{TAGNO+10000}}&n1={{TAGNO+10000}}
        this.getParameterValuesJson = function(hostname, ipaddress, tags){
            var tagQueryString = '';
            tagQty = tags.length;
            for (i = 0; i < tagQty; i++) {
                tagQueryString += "n" + i + "=" + (parseInt(tags[i])+parseInt(0000));
                if(i < tagQty-1) { tagQueryString += "&";}
            }
            return $http.get("http://" + ipaddress + "/z:/restricted/get_params.json?" + tagQueryString, { responseType: "json" })
            .success(function(res) {
                res.hostname = hostname;
                return res;//.data;
            });
        }  
        this.flag=false;
        this.GetParameterValues = function(){

            //var ipaddress = parameterSvc.DriveIpAddressDictionary["drive1"];
            if(!parameterSvc.isPaused)
            {
                for (var hostname in parameterSvc.ParameterDictionary) {
                    var ipaddress = parameterSvc.ParameterDictionary[hostname].IpAddress;
                    var parameterTags = parameterSvc.ParameterDictionary[hostname].Tags;
                    parameterSvc.getParameterValuesJson(hostname, ipaddress, parameterTags)
                    .success(function(response) {
                        var hostname = response.hostname;
                        for (var i = 0; i < response.parameters.length; i++) 
                        {
                            var parameter = response.parameters[i];
                            if(parameter.units != undefined)
                            {
                                parameterSvc.ParameterDictionary[hostname][parameter.pno].ValueAndUnits = parameter.value + " "  + parameter.units;
                                parameterSvc.ParameterDictionary[hostname][parameter.pno].Units = parameter.units;
                            }
                            else
                            {
                                parameterSvc.ParameterDictionary[hostname][parameter.pno].ValueAndUnits = parameter.value;
                            }
                            parameterSvc.ParameterDictionary[hostname][parameter.pno].Value = parameter.value;
                            parameterSvc.ParameterDictionary[hostname][parameter.pno].TimeStamp = parameter.timestamp;
                                                                
                        }
                        if(!this.flag)
                        {
                            $rootScope.$broadcast('ParameterServiceInitialized');
                            //this.flag=true;
                        }
                        //console.log('parameterValue returned to controller.', parameterValues.parameters);
                    })
                    .error(function() {
                        if(parameterSvc.ParameterDictionary != undefined && parameterSvc.ParameterDictionary[hostname][1] != undefined)
                        {
                            parameterSvc.ParameterDictionary[hostname][1].Value = "Error";
                            parameterSvc.ParameterDictionary[hostname][1].ValueAndUnits = "Error";
                        }
                        console.log('parameterValues retrieval failed.');
                    });
                }
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
