
const localVideo  = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const joinBtn     = document.getElementById("join");
const acceptBtn   = document.getElementById("accept");

// const ICE_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const ICE_CONFIG = {
  iceServers: [
    // Public STUN server (Google)
    { urls: ["stun:stun.l.google.com:19302"] },
    
    // Your TURN server (IPv6 or IPv4)
  {
    url: 'turn:192.158.29.39:3478?transport=udp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808'
},
  ],
  
  // Optional settings
  iceTransportPolicy: "all",      // accept stun, turn, host, relay… :contentReference[oaicite:0]{index=0}  
  bundlePolicy: "max-bundle",     // negotiate a single m= section for all tracks
  rtcpMuxPolicy: "require"        // multiplex RTP and RTCP on the same port
};


// const ws = new BroadcastChannel('test')
const ws = new WebSocket("ws://127.0.0.1:8000/ws/video/room_2_2/")

let offerSdp

function postMessage(val){
  ws.send(val)
}


ws.onmessage = ({data}) => {
    console.log(data)
    const msg = JSON.parse(data)
    switch(msg.type){
        case 'offer':
            console.log('got offer')
            handleOffer(msg)
            // offerSdp = msg
            break
        case 'answer':
            console.log('got answer')
            handleAnswer(msg)
            break
        case 'ice-caller':
            console.log('got ice-caller')
            callee.addIceCandidate(msg.candidate)
            break
        case 'ice-callee':
            console.log('got ice-callee')
            caller.addIceCandidate(msg.candidate)
            break
    }
}

const caller = new RTCPeerConnection(ICE_CONFIG);
const callee = new RTCPeerConnection(ICE_CONFIG);

caller.ontrack = (t) => {remoteVideo.srcObject = t.streams[0]}
callee.ontrack = (t) => {remoteVideo.srcObject = t.streams[0]}
caller.onconnectionstatechange = () => {
    console.log("Caller connection state:", caller.connectionState);
    if (caller.connectionState === "connected") {
      console.log("🎉 Caller P2P connection established");
    }
  };
  
  callee.onconnectionstatechange = () => {
    console.log("Callee connection state:", callee.connectionState);
    if (callee.connectionState === "connected") {
      console.log("🎉 Callee P2P connection established");
    }
  };


  caller.oniceconnectionstatechange = () => {
    console.log("Caller iceee - connection state:", caller.iceConnectionState);
    if (caller.iceConnectionState=== "connected") {
      console.log("🎉 Caller P2P connection established");
    }
  }


  callee.oniceconnectionstatechange = () => {
    console.log("Callee iceee - connection state:", callee.iceConnectionState);
    if (callee.iceConnectionState=== "connected") {
      console.log("🎉 Callee P2P connection established");
    }
  }

  // Caller ICE handler
caller.onicecandidate = ({ candidate }) => {
    if (candidate) {
      const msg = {'type': "ice-caller", candidate}
      postMessage(JSON.stringify(msg))
      console.log("Callee candidate found",msg )
    }else{
        console.log("no ice for caller")
    }
  };
  
  // Callee ICE handler
  callee.onicecandidate = (e) => {
    console.log(e)
    if (e.candidate) {
     const msg = {'type': "ice-callee", 'candidate':e.candidate}
      postMessage(JSON.stringify(msg))
      console.log("Callee candidate found", )
    }else{
        console.log("no ice for calleee")
    }
  };

 

  joinBtn.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({audio:true, video:true})
	localVideo.srcObject = localStream
    localStream.getTracks().forEach(t => caller.addTrack(t, localStream));
    
    console.log('creating offer')

    const offer = await caller.createOffer()
    await caller.setLocalDescription(offer)
    console.log("offer created and set")
    postMessage(JSON.stringify(offer))
    // await callee.setRemoteDescription(new RTCSessionDescription(offerSdp))
}

acceptBtn.onclick = async ()=> {
 
        console.log("offer remote set up and creating answer.......")

        const stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true})
		localVideo.srcObject = stream
        stream.getTracks().forEach(t => callee.addTrack(t, stream))

        const answer = await callee.createAnswer()
        
        await callee.setLocalDescription(answer)
        postMessage(JSON.stringify(answer))

    

}

async function handleOffer(offer) {
  if(!offer){
    console.warn("offer not found")
    return
  }else{
    await callee.setRemoteDescription(offer)
    console.log("callee offer remote set")
  }
  
}

async function handleAnswer(answer) {
    if(!answer){
        console.warn("answer not found")
        return
    }
    else{
        await caller.setRemoteDescription(answer)
        console.log("Caller remote asnwer set ")
    }
    console.log(callee.connectionState)
    console.log(caller.connectionState)

}
