function trim(s){ 
  return ( s || '' ).replace( /^\s+|\s+$/g, '' ); 
}

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
})(); else {
    document.getElementById('list').innerHTML = "<code>ifconfig | grep inet | grep -v inet6 | cut -d\" \" -f2 | tail -n1</code>";
    document.getElementById('list').nextSibling.textContent = "In Chrome and Firefox your IP should display automatically, by the power of WebRTCskull.";
}

var ips = document.getElementById('list').textContent.split(' sau ');
if (ips.length === 1) {
    var ipComponents = ips[0].split('.');
    if (ipComponents.length === 4) {
        document.getElementById('c1').value = ipComponents[0];
        document.getElementById('c2').value = ipComponents[1];
        document.getElementById('c3').value = ipComponents[2];
    }
}

function pingBitmi(ip) {
    const xhr = new XMLHttpRequest();
    const address = 'http://' + ip + '/api/version';
    xhr.timeout = 500;
    xhr.open('GET', address);
    xhr.send();
    xhr.onreadystatechange=(e)=> {
        if (xhr.readyState === 4 && xhr.status === 403 && xhr.responseText === 'No API key provided') {
            addBitmi(ip);
        }
    }
}

function addBitmi(ip) {
    let results = document.getElementById('results');
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.setAttribute('href', 'http://' + ip);
    a.innerHTML = 'http://' + ip;
    li.appendChild(a);
    results.appendChild(li);
}

function pingBitmis() {
    let ips = document.getElementById('list').textContent.split(' sau ');
    if (ips.length === 1) {
        let ipComponents = ips[0].split('.');
        let addressPrefix = ipComponents[0] + '.' + ipComponents[1] + '.' + ipComponents[2];
        let rangeBegin = parseInt(document.getElementById('c4').value);
        let rangeEnd = parseInt(document.getElementById('c5').value);
        for (let i=rangeBegin; i<= rangeEnd; ++i) {
            let addressSuffix = i.toString();
            letAddressToPing = addressPrefix + '.' + i;
            setTimeout(function() {
                document.getElementById('msg').innerHTML = 'Se caută ' + addressToPing;
            }, 100);
            setTimeout(addBitmi(addressToPing), 500);
        }
    }
}

pingBitmis();
