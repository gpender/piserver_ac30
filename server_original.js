// server.js

    var DCT_PORT = 64195;
    var EDAM_PORT = 5048;
    var HTTP_PORT = 8080;
    var HOST = GetLocalEth0IpAddress();

   // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var sockjs = require('sockjs');
    var http = require('http');
    var url = require('url');
    var path = require("path");
    var clients = {};
    var fs = require('fs');
    var multer = require('multer');
    var sys = require('sys');
    var exec = require('child_process').exec;


    var sockServer = sockjs.createServer();
    sockServer.on('connection', function (conn) {
        clients[conn.id] = conn;
        console.log('socket server started');

        conn.on('data', function (message) {
            var msgType = JSON.parse(message).type;
            var callback_id = JSON.parse(message).callback_id;
            console.log(msgType);
            switch (msgType) {
                case 'DriveScan':
                    DctDriveScan();
                    break;
                case 'GetFwFiles':
                    GetFwFiles();
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
    });

    // For gzipped files insert HTTP Header : 'Content-Encoding' , 'gzip' 
    app.use(function(request, response, next) {
            var uri = url.parse(request.url).pathname, filename = path.join(process.cwd(), uri);
            var contentTypesByExtension = {
                '.tar.gz': "application/gzip",
                '.js.gz': "application/gzip",
                ',js.gzip':	"application/gzip",
                '.js.zip':	"application/gzip"
            };
            var contentType = contentTypesByExtension[path.extname(filename)];
            if(contentType == "application/gzip")
            { 
                response.header('Content-Encoding' , 'gzip' );
            }
            // response.header("Access-Control-Allow-Origin", "http://localhost");
            // response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
    });
    var fwFilePath = '/home/pi/ac30web/drivefw/';
    app.use(bodyParser.json());
    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            //cb(null, './uploads/')
            cb(null, fwFilePath)
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            //cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
            cb(null, file.originalname)
        }
    });

    var upload = multer({ storage: storage });

    var devPath = '/studioexport';
    //devPath = '/public';
    app.use(express.static(__dirname + devPath));                 // set the static files location /public/img will be /img for users

    app.set('http_port', HTTP_PORT);
    
    app.post('/multer', upload.single('file'), function(req,res,next){
        res.send(200);
        console.log('Uploade Successful ', req.file, req.body);
    });

    app.get('/codesys/:id', function(req, res) {
        var action = req.params.id;
        console.log("Codesys Process " + action);
        res.send(200);
        exec('sudo /etc/init.d/codesyscontrol ' + action, puts);
    });
    
    app.get('/console/:id', function(req, res) {
        var action = req.params.id;
        console.log("Console Command " + action);
        res.send(200);
        exec('sudo ' + action, puts);
    });

    function puts(error, stdout, stderr) { 
        sys.puts(stdout); 
        SendWebSocketMessage("console",stdout);
    };

    app.get('/DCTScan', function(req, res) {
        DctDriveScan();
    });
    
    app.get('/GetFwFiles', function(req, res) {
        GetFwFiles();
    });

    app.get('/writeFileToDrive/:filename/:ipaddress', function(req, res) {
        var file = req.params.filename;
        var ipaddress = req.params.ipaddress;
        console.log("Upload " + file + " to drive " + ipaddress);
        writeBinaryPostData(ipaddress, fwFilePath, file)
    });

    app.get('/GetHostIpAddress', function(req, res) {
        console.log("Host IpAddress : " + HOST);
        res.send(HOST);
    });

    app.get('/delete/:id', function(req, res) {
        console.log("Going to delete an existing file");
        var file = fwFilePath + req.params.id;
        fs.unlink(file, function(err) {
            if (err) {
                return console.error(err);
            }
            console.log("File "+ file + " deleted successfully!");
            res.sendStatus(200);
        });
    });
    
    var httpServer = http.createServer(app).listen(app.get('http_port'), function(){
        console.log('Express server listening on port ' + app.get('http_port'));
    });

    sockServer.installHandlers(httpServer, {prefix: '/data'})

var dgram = require('dgram');
var dctServer = dgram.createSocket('udp4');

dctServer.on('listening', function () {
    var address = dctServer.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

dctServer.on('message', function (message, remote) {
    if(remote.address != HOST)
    {
        var driveInfo = GetDriveInfoObject(remote.address, message);
        SendWebSocketMessage("drive",driveInfo);
    }
});

dctServer.bind(DCT_PORT, HOST);

    function broadcast(message){
        for (var client in clients) {
            clients[client].write(JSON.stringify(message));
        }
    }

const dctBuf = new Buffer([0x44, 0x43, 0x54, 0x00, 0x03, 0x01, 0x00, 0x00, 0x52, 0x45, 0x51, 0x20, 0x44, 0x65, 0x74, 0x61, 0x69, 0x6c, 0x73, 0x00, 0x00, 0x00, 0x52, 0x01, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00]);
const edamBuf = new Buffer([0x49, 0x4e, 0x4c, 0x4f, 0x47, 0x45, 0x35, 0x4b, 0x30, 0x33, 0x37, 0x41]);
const dctClient = dgram.createSocket('udp4');
const edamClient = dgram.createSocket('udp4');


dctClient.bind(DCT_PORT,function() {
    dctClient.setBroadcast(true);
});

edamClient.bind(EDAM_PORT,function() {
    edamClient.setBroadcast(true);
});

function DctDriveScan() {
    dctClient.send(dctBuf,0,dctBuf.length, DCT_PORT, '255.255.255.255', function(err) 
    {
        //console.log(err);
    }); 
    edamClient.send(edamBuf,0,edamBuf.length, EDAM_PORT, '255.255.255.255', function(err) 
    {
        //console.log(err);
    });
}

function GetFwFiles() {
    //var data = {};
    var folder = '/home/pi/ac30web/drivefw/';
    readFiles(folder, function(file) {
        SendWebSocketMessage("file",file);
    }, function(err) {
    throw err;
    });
}

function writeBinaryPostData(ipaddress, folder, file) {
    
    console.log(folder + file);
    data = fs.readFileSync(folder + file);
    var options = {
        host: ipaddress,
        port: 8080,
        path: '/',
        method: 'POST'
    };

    var req = http.request(options, function(res)
    {
        res.setEncoding('utf8');
        res.on('response', function (chunk) {
            console.log("body: " + chunk);
        });
    });

    var crlf = "\r\n",
        boundaryKey = Math.random().toString(16),
        boundary = "--${boundaryKey}",
        delimeter = "${crlf}--${boundary}",
        headers = [
          'Content-Disposition: form-data; name="file"; filename="' + file + '"' + crlf
        ],
        closeDelimeter = '${delimeter}--';


    var multipartBody = Buffer.concat([
        new Buffer(delimeter + crlf + headers.join('') + crlf),
        data,
        new Buffer(closeDelimeter)]
    );
    req.setHeader('Unix-Date', Math.floor(Date.now() /1000));
    req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    req.setHeader('Content-Length', multipartBody.length);

// fs.readFile('/path/to/file', function (err, data) {
//     // err will be an error object if an error occured
//     // data will be the file that was read
//     console.log(data);
//     });
    req.write(multipartBody);
    req.end();
}

function SendWebSocketMessage(messageType, messageContent)
{
    var message = {};
    message.type = messageType;
    message.content = messageContent;
    broadcast(message);
}

function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function(err, filenames) {
    if (err) {
        onError(err);
        return;
    }
    filenames.forEach(function(filename) {
        var stats = fs.statSync(dirname + filename)
        var fileSizeInBytes = stats["size"]
        var fileSizeInMegabytes = Math.round(fileSizeInBytes / 1024);
        fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
            onError(err);
            return;
        }
        var file = {};
        file.Name = filename;
        file.Folder = dirname;
        file.FileSize = fileSizeInBytes;
        file.FileSizeMb = fileSizeInMegabytes;
        onFileContent(file);
        });
    });
    });
}

function GetDriveInfoObject(ipaddress, message)
{
    var length = message.length;
    var buffer = new ArrayBuffer(length);
    uint = new Uint8Array(buffer);
    for (var i=0; i<length; i++) {
        uint[i] = message[i];
    }
    var DriveInfo = {};
    var tmp = String.fromCharCode(buffer[72],buffer[73],buffer[74],buffer[75],buffer[76],buffer[77],buffer[78],buffer[79],buffer[80],buffer[81],buffer[82],buffer[83],buffer[84],buffer[85],buffer[86],buffer[87],buffer[88],buffer[89],buffer[90],buffer[91],buffer[92]);
    DriveInfo.Name = tmp.replace(/\0[\s\S]*$/g,'');
    DriveInfo.IpAddress = ipaddress;//buffer[56] + '.' + buffer[57] + '.' + buffer[58] + '.' + buffer[59];
    DriveInfo.FwVersion = buffer[104] + '.' + buffer[105] + '.' + buffer[107] + '.' + buffer[106];
    DriveInfo.DriveType = "AC30" + String.fromCharCode(buffer[6]);
    return DriveInfo;
}

function GetLocalEth0IpAddress()
{
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        //console.log(k);
        if(k=='eth0')
        //if(k=='wlan0')
        {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
    }
    return addresses[0];
}

