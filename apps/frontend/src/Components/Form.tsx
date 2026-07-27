import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Injects the report's two type families once per app load.
// Move this into index.html if you'd rather not do it at runtime.
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

export const Form = () => {
    useReportFonts();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedIn] = useState("");
    const navigate = useNavigate();

    async function submitForm() {
        const trimmedGithub = github.trim();
        if (!trimmedGithub) {
            toast.error("Add your GitHub profile to continue", { theme: "dark" });
            setError("GitHub URL is required");
            return;
        }

        setError("");
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/pre-interview`, {
                github: trimmedGithub,
                linkedin: linkedin.trim() || undefined,
            });
            navigate(`/interview/${res.data.id}`);
        } catch (err: any) {
            const message =
                err?.response?.data?.message || err?.message || "Something went wrong. Try again.";
            setError(message);
            toast.error(message, { theme: "dark" });
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center px-6"
            style={{ backgroundColor: "#F6F4EE", color: "#1E2128" }}
        >
            <div className="w-full max-w-md">
                <p
                    className="text-xs font-medium uppercase tracking-[0.2em] text-center"
                    style={{ color: "#63666F", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                    Interview pass
                </p>
                <h1
                    className="mt-3 text-4xl text-center leading-[1.05]"
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600 }}
                >
                    Let's get you ready
                </h1>
                <p className="mt-3 text-sm text-center" style={{ color: "#63666F" }}>
                    A couple of links so your interviewer can prep questions around your real work.
                </p>

                {/* Ticket card */}
                <div className="relative mt-10">
                    <div
                        className="rounded-lg px-7 py-8"
                        style={{ backgroundColor: "#FFFFFF", border: "1px solid #DAD5C7" }}
                    >
                        <Field
                            label="GitHub URL"
                            required
                            placeholder="github.com/yourname"
                            value={github}
                            onChange={setGithub}
                        />
                        <div className="h-6" />
                        <Field
                            label="LinkedIn URL"
                            placeholder="linkedin.com/in/yourname"
                            value={linkedin}
                            onChange={setLinkedIn}
                        />

                        {error && (
                            <p
                                className="mt-5 text-xs"
                                style={{ color: "#9C3B2E", fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                                {error}
                            </p>
                        )}

                        <button
                            onClick={submitForm}
                            disabled={loading}
                            className="mt-8 w-full rounded-full py-3.5 text-sm uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                backgroundColor: "#24427A",
                                color: "#F6F4EE",
                                fontFamily: "'IBM Plex Mono', monospace",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = "#1B3260";
                            }}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#24427A")}
                        >
                            {loading ? "Starting session…" : "Start interview"}
                        </button>
                    </div>

                    {/* Ticket stub notches */}
                    <div
                        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full"
                        style={{ backgroundColor: "#F6F4EE", border: "1px solid #DAD5C7" }}
                    />
                    <div
                        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full"
                        style={{ backgroundColor: "#F6F4EE", border: "1px solid #DAD5C7" }}
                    />
                </div>

                <p
                    className="mt-6 text-xs text-center"
                    style={{ color: "#9A9789", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                    Uses your public activity only — nothing is posted on your behalf.
                </p>
            </div>

            <ToastContainer />
        </div>
    );
};

function Field({
    label,
    value,
    onChange,
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span
                className="text-[11px] uppercase tracking-widest"
                style={{ color: "#63666F", fontFamily: "'IBM Plex Mono', monospace" }}
            >
                {label} {required && <span style={{ color: "#9C3B2E" }}>*</span>}
            </span>
            <input
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 w-full bg-transparent outline-none text-[15px] pb-2"
                style={{
                    borderBottom: "1.5px solid #DAD5C7",
                    color: "#1E2128",
                    fontFamily: "'IBM Plex Mono', monospace",
                }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#24427A")}
                onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#DAD5C7")}
            />
        </label>
    );
}