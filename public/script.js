const socket = io();
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    const connect=document.getElementById("connect");
    const disconnect=document.getElementById("disconnect");
  
    let localStream;
    let peerConnection;
    const config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
  
    async function startLocalStream() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: {
            echoCancellation: true, // Enable echo cancellation
            noiseSuppression: true,  // Enable noise suppression
          } });
        localVideo.srcObject = localStream;
        console.log("Local stream started:", localStream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Could not access camera or microphone.");
      }
    }
  
    function createPeerConnection() {
      peerConnection = new RTCPeerConnection(config);
        console.log("Peer connection created:", peerConnection);
      // Add local stream tracks to the connection
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
      console.log("Local tracks added:", localStream.getTracks());
  
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Remote track received:", event.streams[0]);
        // if (!remoteVideo.srcObject) {
        //   remoteVideo.srcObject = event.streams[0];
        //   console.log("Remote stream set on video element");
        // }

        remoteVideo.srcObject = event.streams[0];
        console.log("Remote stream set on video element");
      };
  
      // ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          socket.emit("signal", { candidate: event.candidate });
        }
      };
  
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
      };
    }

    function destroyPeerConnection() {
      console.log("destroying...")
      if (peerConnection) {
        // Close the peer connection
        peerConnection.close();
        console.log("Peer connection closed.");
    
        // Stop all media tracks in the local stream
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          console.log("Local media tracks stopped.");
        }
    
        // Optional: Stop remote video stream (if needed)
        if (remoteVideo.srcObject) {
          remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
          remoteVideo.srcObject = null;
          //remoteVideo.style.backgroundColor = "white";
          console.log("Remote media tracks stopped.");
        }
    
        // Cleanup the peer connection reference
        peerConnection = null;
        console.log("Peer connection reference cleaned up.");




      }
    }

    // socket.on("peerDisconnected", () => {
    //   console.log("Peer has Disconnected....");
    //   // Destroy the peer connection for the disconnected peer
    //   if (peerConnection) {
    //     destroyPeerConnection();
    //   }
    // });
    
  
    socket.on("signal", async (data) => {
      console.log("Received signal:", data);
      if (!peerConnection) createPeerConnection();
  
      try {
        if (data.offer) {
          console.log("Processing offer");
          await peerConnection.setRemoteDescription(data.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("signal", { answer });
        }
  
        if (data.answer) {
          console.log("Processing answer");
          await peerConnection.setRemoteDescription(data.answer);
        }
  
        if (data.candidate) {
          console.log("Adding ICE candidate:", data.candidate);
          await peerConnection.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error("Error handling signaling data:", error);
      }
    });
  
    async function startCall() {
      try {
        createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Offer created and sent:", offer);
        socket.emit("signal", { offer });
      } catch (error) {
        console.error("Error starting call:", error);
      }
    }

    connect.addEventListener("click",()=>{
        startLocalStream().then(() => {
        console.log("user ready");
        socket.emit("ready");
      });
    })

    disconnect.addEventListener("click",destroyPeerConnection);
  
    
  
    socket.on("ready", () => {
        console.log("Peer ready");
      if (!peerConnection) 
        startCall();
    });