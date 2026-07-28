import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface TranscriptEntry {
    id: string;
    message: string;
    type: "User" | "Assistance";
    interviewId: string;
}

interface ResultData {
    transcript: TranscriptEntry[];
    score: number;
    summary: string;
    candidateName?: string;
    role?: string;
    completedAt?: string;
}

const FONT_LINK_ID = "interview-report-fonts";
function useReportFonts() {
    useEffect(() => {
        if (document.getElementById(FONT_LINK_ID)) return;
        const link = document.createElement("link");
        link.id = FONT_LINK_ID;
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap";
        document.head.appendChild(link);
    }, []);
}

function verdict(score: number): { label: string; color: string } {
    if (score >= 80) return { label: "Strong hire", color: "#2E6F52" };
    if (score >= 60) return { label: "Leaning yes", color: "#8A6D1D" };
    if (score >= 40) return { label: "Mixed signal", color: "#8A5A1D" };
    return { label: "Not a fit", color: "#9C3B2E" };
}

export const Result = () => {
    useReportFonts();
    const { interviewId } = useParams();
    const [data, setData] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const res = await axios.get<ResultData>(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/result/${interviewId}`
                );
                console.log("res",res)
                setData(res.data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Couldn't load this report."
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [interviewId]);

    return (
        <div
            className="min-h-screen w-full"
            style={{ backgroundColor: "#F6F4EE", color: "#1E2128" }}
        >
            <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
                {loading && <LoadingState />}
                {!loading && error && <ErrorState message={error} />}
                {!loading && !error && data && <Report data={data} />}
            </div>
        </div>
    );
};

function LoadingState() {
    return (
        <div className="animate-pulse">
            <h1 className="mt-3 mb-4   ">Wait for result...</h1>
            <div className="h-3 w-24 rounded-full" style={{ backgroundColor: "#DAD5C7" }} />
            <div className="mt-6 h-10 w-2/3 rounded-md" style={{ backgroundColor: "#DAD5C7" }} />
            <div className="mt-3 h-4 w-1/3 rounded-md" style={{ backgroundColor: "#DAD5C7" }} />
            <div
                className="mt-10 h-40 rounded-lg"
                style={{ backgroundColor: "#EFEBDF", border: "1px solid #DAD5C7" }}
            />
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div
            className="rounded-lg px-6 py-8"
            style={{ backgroundColor: "#FBEEEA", border: "1px solid #E3C4B8" }}
        >
            <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "#9C3B2E", fontFamily: "'IBM Plex Mono', monospace" }}
            >
                Report unavailable
            </p>
            <p className="mt-2 text-sm" style={{ color: "#63666F" }}>
                {message}
            </p>
        </div>
    );
}

function Report({ data }: { data: ResultData }) {
    const { transcript, score, summary, candidateName, role, completedAt } = data;
    const v = verdict(score);

    return (
        <div>
            {/* Masthead */}
            <div className="flex items-start justify-between gap-8">
                <div>
                    <p
                        className="text-xs font-medium uppercase tracking-[0.2em]"
                        style={{ color: "#63666F", fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                        Interview report {completedAt ? `· ${formatDate(completedAt)}` : ""}
                    </p>
                    <h1
                        className="mt-3 text-4xl sm:text-5xl leading-[1.05]"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                    >
                        {candidateName || "Candidate"}
                    </h1>
                    {role && (
                        <p className="mt-2 text-base" style={{ color: "#63666F" }}>
                            {role}
                        </p>
                    )}
                </div>

                <ScoreStamp score={score} label={v.label} color={v.color} />
            </div>

            <div className="mt-10 h-px w-full" style={{ backgroundColor: "#DAD5C7" }} />

            {/* Summary */}
            <div className="mt-10">
                <p
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{ color: "#63666F", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                    Summary
                </p>
                <p
                    className="mt-4 text-xl leading-relaxed"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                    {summary}
                </p>
            </div>

            {/* Transcript */}
            <div className="mt-16">
                <p
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{ color: "#63666F", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                    Full transcript
                </p>

                {transcript.length === 0 ? (
                    <p className="mt-4 text-sm" style={{ color: "#63666F" }}>
                        No transcript was recorded for this interview.
                    </p>
                ) : (
                    <div className="mt-6 space-y-5">
                        {transcript.map((entry) => (
                            <TranscriptRow key={String(entry.id)} entry={entry} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreStamp({
    score,
    label,
    color,
}: {
    score: number;
    label: string;
    color: string;
}) {
    return (
        <div
            className="flex shrink-0 flex-col items-center justify-center rounded-full"
            style={{
                width: 108,
                height: 108,
                border: `1.5px dashed ${color}`,
                transform: "rotate(-6deg)",
                color,
            }}
        >
            <span
                className="text-3xl leading-none"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}
            >
                {score}
            </span>
            <span
                className="mt-1 text-[9px] uppercase tracking-widest text-center px-2 leading-tight"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
                {label}
            </span>
        </div>
    );
}

function TranscriptRow({ entry }: { entry: TranscriptEntry }) {
    const isCandidate = entry.type === "User";
    const speakerColor = isCandidate ? "#24427A" : "#5B4A82";
    const speakerLabel = isCandidate ? "Candidate" : "Interviewer";

    return (
        <div className="flex gap-4">
            <div className="w-28 shrink-0 pt-0.5 text-right">
                <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: speakerColor }}
                >
                    {speakerLabel}
                </span>
            </div>
            <div
                className="flex-1 pb-5"
                style={{ borderBottom: "1px solid #E7E2D3" }}
            >
                <p
                    className="text-[15px] leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#1E2128" }}
                >
                    {entry.message}
                </p>
            </div>
        </div>
    );
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}