import axios from "axios"
import { useEffect, useRef } from "react"

export const Interview = ()=>{
    const audioRef = useRef<any>(null)    

    useEffect(()=>{
        ( async()=>{
            const pc = new RTCPeerConnection();

            audioRef.current = document.createElement("audio");
            audioRef.current.autoplay = true;
            pc.ontrack = (e) => (audioRef.current.srcObject = e.streams[0]);

            const ms = await navigator.mediaDevices.getUserMedia({
            audio: true,
            });
            pc.addTrack(ms.getTracks()[0]);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            

            const sdpResponse = await axios.post(`http://localhost:3000/api/v1/session`,{
                sdp : offer.sdp
            });

            const answer = {
                type: "answer" as "answer",
                sdp: sdpResponse.data,
            };
            await pc.setRemoteDescription(answer);
        })()
    },[])

    return (
        <div>interview
            <audio autoPlay ref={audioRef}></audio>
        </div>
    )
}