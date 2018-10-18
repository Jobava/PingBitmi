var wasInitialized = false;

// NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

if (RTCPeerConnection) (function () {
    var rtc = new RTCPeerConnection({iceServers:[]});
    if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
        rtc.createDataChannel('', {reliable:false});
    };
    
    rtc.onicecandidate = function (evt) {
        // convert the candidate to SDP so we can run it through our general parser
        // see https://twitter.com/lancestout/status/525796175425720320 for details
        if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
    };
    rtc.createOffer(function (offerDesc) {
        grepSDP(offerDesc.sdp);
        rtc.setLocalDescription(offerDesc);
    }, function (e) { console.warn("offer failed", e); });
    
    
    var addrs = Object.create(null);
    addrs["0.0.0.0"] = false;
    function updateDisplay(newAddr) {
        if (newAddr in addrs) return;
        else addrs[newAddr] = true;
        var displayAddrs = Object.keys(addrs).filter(function (k) { return addrs[k]; });
        document.getElementById('list').textContent = displayAddrs.join(" sau ") || "n/a";
        if (!wasInitialized) {
            initIPs();
            wasInitialized = false;
        }
    }
    
    function grepSDP(sdp) {
        var hosts = [];
        sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
            if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
                    addr = parts[4],
                    type = parts[7];
                if (type === 'host') updateDisplay(addr);
            } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
                var parts = line.split(' '),
                    addr = parts[2];
                updateDisplay(addr);
            }
        });
    }
})();

function initIPs() {
    let ips = document.getElementById('list').textContent.split(' sau ');
    if (ips.length === 1) {
        let ipComponents = ips[0].split('.');
        if (ipComponents.length === 4) {
            document.getElementById('c1').value = ipComponents[0];
            document.getElementById('c2').value = ipComponents[1];
            document.getElementById('c3').value = ipComponents[2];
        }
    }
}


function pingBitmi(ipToPing) {
    document.getElementById('msg').innerHTML = 'Se caută ' + ipToPing;
    const xhr = new XMLHttpRequest();
    xhr.ontimeout = function() {
        console.log("Ping to " + ipToPing + " timed out");
    };
    xhr.onload = function() {
        if (xhr.readyState === 4 && xhr.status === 403) {
            console.log("Found expected status 403 on " + ipToPing);
            if (xhr.responseText === 'No API key provided') {
                console.log("Found a Bitmi at " + ipToPing);
                addBitmi(ipToPing);
            } else {
                console.log("...however no answer of 'No API key provided' so this is not a Bitmi");
            }
        }
    };
    const address = 'http://' + ipToPing + '/api/version';
    xhr.open('GET', address);
    xhr.timeout = 4000;
    xhr.send();
}

function addBitmi(ipToAdd) {
    let results = document.getElementById('results');
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.setAttribute('href', 'http://' + ipToAdd);
    a.innerHTML = 'http://' + ipToAdd;
    li.appendChild(a);
    results.appendChild(li);
    document.getElementById('msg').innerHTML = '';
}

function pingBitmis() {
    let ips = document.getElementById('list').textContent.split(' sau ');
    if (ips.length === 1) {
        let ipComponents = ips[0].split('.');
        let addressPrefix = ipComponents[0] + '.' + ipComponents[1] + '.' + ipComponents[2];
        let rangeBegin = parseInt(document.getElementById('c4').value);
        let rangeEnd = parseInt(document.getElementById('c5').value);
        let addresses = [];
        for (let i=rangeBegin, j=0; i<=rangeEnd; ++i, ++j) {
            addresses[j] = addressPrefix + '.' + i.toString();
        }
        for (const addressToPing of addresses) {
            setTimeout(pingBitmi(addressToPing), Math.floor(Math.random() * 3000));
        }
    }
    document.getElementById('msg').innerHTML = 'Se caută...';
}
