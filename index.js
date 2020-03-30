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
    _.each(process.env, function (kvp) {
        call.write(kvp)
    })

    call.end()
}

var rpcServer = getServer()
rpcServer.bind('0.0.0.0:9876', grpc.ServerCredentials.createInsecure())
console.log("Starting on port 9876")
rpcServer.start()
