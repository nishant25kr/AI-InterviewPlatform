import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Form = () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>()
    const [github, setGithub] = useState<string>()
    const [linkedin, setLinkedIn] = useState<string>()
    const navigate = useNavigate()

    async function submitForm() {
        try {
            console.log(github)
            if (!github?.trim) {
                toast.error("Please provide github and linkedin", {
                    theme: "dark",
                });
                setError("Please provide github and linkedin")
                return;
            }
            setLoading(true)
            const res = await axios.post(`http://localhost:3000/api/v1/pre-interview`, {
                github: github.trim(),
                linkedin: linkedin?.trim()
            })
            if (res.status === 200) {
                navigate(`interview/${res.data.interviewId}`);
            }

        } catch (error: any) {
            setError(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <div className="items-center justify-center">
                <div className="flex items-center justify-center">
                    <h1 className="text-xl">Ai interviewPlatform</h1>
                </div>
                <div>
                    <input
                        placeholder="LinkedIn URL"
                        className="m-2 border p-2 rounded-md"
                        onChange={(e) => setLinkedIn(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        placeholder="GitHub URL"
                        className="m-2 border p-2 rounded-md"
                        onChange={(e) => setGithub(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="m-2 p-2 bg-gray-900 text-white rounded-md"
                        onClick={submitForm}
                    >{loading ? "Submitting" : "Start Interview"}</button>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}