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
            console.log("hi1")
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log("hi2",offer.sdp?.split("\n").slice(1).join("\n"))
            
            const sdpResponse = await fetch(`http://localhost:3000/api/v1/session`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    "Content-Type": "application/sdp",
                },
            });

            console.log("hi3")
            const answer = {
                type: "answer" as "answer",
                sdp: await sdpResponse.text(),
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