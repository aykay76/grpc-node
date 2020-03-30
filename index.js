var grpc = require('grpc')
var protoLoader = require('@grpc/proto-loader')

// *** proto buf import
var packageDefinition = protoLoader.loadSync(
    "environment.proto",
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })
var environment = grpc.loadPackageDefinition(packageDefinition).environment
// console.log(environment)
// console.table(process.env)

function getServer() {
    var server = new grpc.Server()

    server.addService(environment.EnvironmentService.service, {
        GetEnvironmentVariable: getEnvironmentVariable,
        SetEnvironmentVariable: setEnvironmentVariable,
        GetEnvironmentVariables: getEnvironmentVariables
    })

    return server
}

// *** internal functions
function getVar(kvp) {
    var result
    result.Key = kvp.Key
    result.Value = process.env[kvp.Key]
    return result
}

// *** service functions
function getEnvironmentVariable(call, callback) {
    callback(null, getVar(call.request))
}

function setEnvironmentVariable(kvp) {
    process.env[kvp.Key] = kvp.Value
}

function getEnvironmentVariables(call) {
    var kvp

    for (var index in process.env) {
        kvp = { key: index, value: process.env[index] }
        console.log(index)
        call.write(kvp)
    }

    call.end()
}

if (process.argv.length > 2) {
    switch (process.argv[2]) {
        case "-server":
            var rpcServer = getServer()
            rpcServer.bind('0.0.0.0:9876', grpc.ServerCredentials.createInsecure())
            console.log("Starting on port 9876")
            rpcServer.start()
            break;
        case "-client":
            var rpcClient = new environment.EnvironmentService('localhost:9876', grpc.credentials.createInsecure())
            var call = rpcClient.GetEnvironmentVariables()
            call.on('data', function(kvp) {
                console.log(kvp)
            })
            call.on('end', function() {
                console.log("Finished")
            });
            call.on('error', function(e) {
                console.log("Error " + e)
            });
            call.on('status', function(status) {
                console.log("Status: ")
                console.table(status)
            });
            break;
    }
}
