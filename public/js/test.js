const socket = io()

socket.on('test', function(string) {
    console.log(string)
})