import { useCallback, useEffect, useRef } from "react";
import { useMicStream } from "../hooks/useMicStream";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useParams } from "react-router-dom";

export const Interview = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
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
                            mimeType: "audio/pcm;rate=16000",
                        },
                    },
                },
            };
            ws.send(JSON.stringify(audioMessage));
        }
    }, []);

    const mic = useMicStream(handleMicChunk);

    const micRef = useRef(mic);
    useEffect(() => {
        micRef.current = mic;
    }, [mic]);

    useEffect(() => {
        if (!interviewId) {
            console.error("Interview ID is missing in the URL parameters.");
            return;
        }

        const ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => {
            micRef.current
                .start()
                .then(() => console.log("Microphone started"))
                .catch((err) => console.error("Error starting microphone", err));

            ws.send(
                JSON.stringify({
                    type: "init",
                    payload: { interviewId },
                })
            );
        };

        ws.onmessage = (event) => {
            let msg: any;
            try {
                msg = JSON.parse(event.data);
            } catch (err) {
                console.error("Received non-JSON WebSocket message:", event.data);
                return;
            }

            switch (msg.type) {
                case "audio":
                    playChunk(msg.payload.data);
                    break;

                case "status":
                    if (msg.status === "connected") {
                        console.log("status is connected");
                    } else {
                        console.log("status is not connected");
                    }
                    break;

                default:
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        ws.onclose = (event) => {
            console.log("WebSocket Closed", event.code, event.reason);
            // Always stop — don't gate on a possibly-stale `active` flag.
            micRef.current.stop();
            wsRef.current = null;
        };

        return () => {
            micRef.current.stop();
            resetPlayer();
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [interviewId]);

    return (
        <div className="p-5 border flex flex-col items-center justify-center h-screen">
            <div className="flex items-center justify-center gap-4 m-10 h-full w-full border p-5">

                <div className="flex-1 border rounded-lg p-4 w-full max-w-3xl h-full overflow-y-auto">
                    <h1 className="text-xl font-bold">{interviewId}</h1>
                </div>

                <div className="border rounded-lg p-4 w-full h-full max-w-3xl flex items-center justify-center gap-4">
                    <audio autoPlay ref={audioRef} >
                    
                    </audio>

                    <h1 className="text-xxl font-bold">AI</h1>

                </div>

            </div>

            <div className="border  h-1/6 flex flex-col items-center justify-center gap-4 w-full">
                <button 
                className="border rounded-lg p-4 w-full max-w-3xl bg-red-500 text-white hover:bg-red-600 transition-colors duration-300"
                onClick={() => {
                    micRef.current.stop();
                    resetPlayer();
                    if (wsRef.current) {
                        wsRef.current.close();
                    }
                }}>
                    Stop Interview
                </button>
            </div>


        </div>
    );
};