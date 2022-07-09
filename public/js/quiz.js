timer();

function timer() {
    if (!!window.EventSource) {
        var source = new EventSource('/countdown')

        source.addEventListener('message', function (e) {
            document.getElementById('data').innerHTML = e.data
        }, false)

        source.addEventListener('open', function (e) {
            document.getElementById('state').innerHTML = "Connected"
        }, false)

        source.addEventListener('error', function (e) {
            const id_state = document.getElementById('state')
            if (e.eventPhase == EventSource.CLOSED)
                source.close()
            if (e.target.readyState == EventSource.CLOSED) {
                id_state.innerHTML = "Disconnected"
            }
            else if (e.target.readyState == EventSource.CONNECTING) {
                id_state.innerHTML = "Connecting..."
            }
        }, false)
    } else {
        console.log("Your browser doesn't support SSE")
    }
}