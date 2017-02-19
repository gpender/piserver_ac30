// server.js

    var sockjs = require('sockjs');
    var clients = {};


    var sockServer = sockjs.createServer();
    exports.sockServer = sockServer;

    sockServer.on('connection', function (conn) {
        try
        {
            clients[conn.id] = conn;
            console.log('socket server started');
            conn.on('data', function (message) {
                var msgType = JSON.parse(message).type;
                var callback_id = JSON.parse(message).callback_id;
                console.log(msgType);
                switch (msgType) {
                    case 'DriveScan':
                        //DctDriveScan();
                        break;
                    case 'GetFwFiles':
                        //GetFwFiles();
                        break;
                    default:
                }
            });
                
            conn.on('close', function () {
                delete clients[conn.id];
            });
            conn.on('error', function (err) {
                console.log(err);
            });
        }
        catch(err)
        {}
    });

    function broadcast(message){
        for (var client in clients) {
            clients[client].write(JSON.stringify(message));
        }
    }

    exports.SendWebSocketMessage = function(messageType, messageContent)
    {
        try
        {
            var message = {};
            message.type = messageType;
            message.content = messageContent;
            broadcast(message);
        }
        catch(err)
        {}
    }

