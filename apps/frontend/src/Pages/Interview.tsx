import { useCallback, useEffect, useRef } from "react"
import { useMicStream } from "../hooks/useMicStream";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useParams } from "react-router-dom";

export const Interview = () => {
    const audioRef = useRef<any>(null)
    const wsRef = useRef<WebSocket | null>(null);
    const { playChunk, reset: resetPlayer } = useAudioPlayer();
    const { interviewId } = useParams();

    const handleMicChunk = useCallback((base64: string) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            const audioMessage = {
                type: "audioMessage",
                payload: {
                    realtimeInput: {
                        audio: {
                            data: base64,
                            mimeType: 'audio/pcm;rate=16000'
                        }
                    }
                }
            };
            ws.send(JSON.stringify(audioMessage));
        }
    }, []);

    const mic = useMicStream(handleMicChunk);

    useEffect(() => {
        if (!interviewId) {
            console.error("Interview ID is missing in the URL parameters.");
            return;
        }
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;
        ws.onopen=()=>{
            ws.send(JSON.stringify({
                type: 'init',
                payload:{
                    interviewId: interviewId
                }
            }))
        }

        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data)
            console.log('Received message::', msg);
            const parsedData = msg

            switch (msg.type) {
                case 'audio':
                    console.log("inside audio")
                    playChunk(parsedData.payload.data)
                    break;
                
                case 'status':
                    console.log("data",parsedData.status)
                    if(parsedData.status === 'connected'){
                        mic.start()
                            .then(() => console.log('Microphone started'))
                            .catch((err) => console.error('Error starting microphone', err));
                    }
                    break;

                default:
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = (event) => {
            console.log('WebSocket Closed', event.code, event.reason);
            if (mic.active) {
                mic.stop();
                console.log('Microphone stopped because websocket closed');
            }
            wsRef.current = null;
        };

        return () => {
            mic.stop();
            resetPlayer();
            if (ws.readyState === WebSocket.OPEN) ws.close();
        };
    }, [])


    return (
        <div>interview
            <audio autoPlay ref={audioRef}></audio>
            <h1>{interviewId}</h1>
        </div>
    )
}