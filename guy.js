
    var HTTP_PORT = 8080;
    var HOST = GetLocalEth0IpAddress();

   // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var http = require('http');
    var url = require('url');
    var path = require("path");
    var fs = require('fs');
    var multer = require('multer');
    var sys = require('sys');
    var exec = require('child_process').exec;
    var sockSvc = require('./socket-server.js');
    var dctSvc = require('./dct-server.js');//(HOST);
    //dctSvc.init(HOST);
    // For gzipped files insert HTTP Header : 'Content-Encoding' , 'gzip' 


    var devPath = '/studioexport';
    //devPath = '/public';
    //app.use(express.static(__dirname + devPath));                 // set the static files location /public/img will be /img for users

    //app.set('http_port', HTTP_PORT);
       



function GetLocalEth0IpAddress()
{
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        console.log(k);
        if(k=='eth0')
        //if(k=='wlan0')
        {
            for (var k2 in interfaces[k]) {
		console.log(k2);
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
    }
    return addresses[0];
}

