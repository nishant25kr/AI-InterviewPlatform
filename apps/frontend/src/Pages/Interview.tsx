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
        // Silently drop chunks while the socket isn't open instead of
        // logging on every single mic frame — avoids log spam if the
        // mic is still emitting during shutdown.
    }, []);

    const mic = useMicStream(handleMicChunk);

    // Keep a ref to the latest `mic` so the WS effect (which only runs
    // once) never closes over a stale mic object/stale `active` flag.
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    return (
        <div>
            interview
            <audio autoPlay ref={audioRef}></audio>
            <h1>{interviewId}</h1>
        </div>
    );
};