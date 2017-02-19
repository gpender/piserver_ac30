(function(){

    var app = angular.module('ac30WebApp');

    var dctService = app.service('dctService', ['$q', '$rootScope', function($q, $rootScope) {
        // We return this object to anything injecting our service
        var service = {};
        // Create our websocket object with the address to the websocket
        var wsUrl = 'ws://' + window.location.host 
        var ws;// = new WebSocket(wsUrl + '/data/websocket')
        new_conn = function() {    
            ws = new WebSocket(wsUrl + '/data/websocket')
            ws.onmessage = function(message) {
                listener(message);
            };
            ws.onopen = function(){  
                console.log("Web Socket has been opened!");
                $rootScope.$broadcast('socket:opened');
            }; 
            ws.onclose = function(){  
                console.log("Web Socket has been closed!");
                new_conn();
            };
        }
        new_conn();
        // ws.onmessage = function(message) {
        //     listener(message);
        // };

        function sendRequest(request) {
            if(ws.readyState == 1)
            {
                console.log('Sending request', request);
                // Send a message to the WebSocket server running on the pi
                ws.send(JSON.stringify(request));
            }
        };

        function listener(webSocketServerdata) {            
            var messageObj = webSocketServerdata;
            var jsonObj = angular.fromJson(messageObj.data);
            if(jsonObj.type == "drive")
            {
                $rootScope.$broadcast('drivefound',jsonObj.content);
            }
            if(jsonObj.type == "file")
            {
                $rootScope.$broadcast('filefound',jsonObj.content);
            }
            if(jsonObj.type == "console")
            {
                $rootScope.$broadcast('consolemessage',jsonObj.content);
            }
            
            // var jsonObj = angular.fromJson(messageObj.data);
            // $rootScope.$broadcast('drivefound',jsonObj);
            // $rootScope.$broadcast('filefound',jsonObj);
        };

        service.DctScan = function() {
            var request = {
                type: "DriveScan"
            }
            sendRequest(request);
        };
        
        service.GetFwFiles = function() {
            var request = {
                type: "GetFwFiles"
            }
            sendRequest(request);
        };
        return service;
    }]);
})();
