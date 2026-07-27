import { Router } from 'express';
import { PreInterviewSchema } from '../types.js';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import { generateInterviewSummary } from '../lib/gemini.js';

const router = Router();

router.post("/pre-interview", async (req, res) => {
    try {
        const { success, data } = PreInterviewSchema.safeParse(req.body)
        if (!success) {
            res.status(400).json({
                message: "Validation failed"
            })
            return;
        }
        const githubUsername = data.github.split("/")[3];
        //Todo: Add proxy because github will rate limit you request
        const userRepo = await axios.get(`https://api.github.com/users/${githubUsername}/repos`)

        const filteredRepoData = userRepo.data.map((item: any) => ({
            description: item.description,
            name: item.name,
            fullName: item.fullName,
            startCount: item.startCount
        }))

        const interview = await prisma.interview.create({
            data: {
                githubMetadata: filteredRepoData,
                status: "Pre",
                score: 0
            }
        })

        return res.status(200).json({
            id: interview.id,
            message: "Success"
        })

    } catch (err: any) {
        console.log(err.message)
        res.status(500).json({ message: "Internal server error" })
    }
});

router.post("/session", async (req, res) => {
    console.log("session init")
    const sessionConfig = JSON.stringify({
        type: "realtime",
        model: "gemini-3.5-realtime",
        audio: { output: { voice: "marin" } },
    });

    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", sessionConfig);

    try {


        // initSideband(callId, req.params.interviewId);
    } catch (error: any) {
        console.error("Gemini session error:", error);
        res.status(500).json({ error: "Failed to create Gemini realtime session" });
    }
});

router.get("/messages", async (req, res) => {
    try {
        const interviewId = req.body.interviewId as string;
        if (!interviewId) {
            return res.status(400).json({ message: "Missing interviewId query parameter" });
        }
        const messages = await prisma.message.findMany({
            where: { interviewId },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/result/:interviewId", async (req, res) => {
    try {
        const { interviewId } = req.params;

        console.log("interviewId", interviewId);
        const response = await prisma.message.findMany({
            where: {
                interviewId: interviewId
            }
        })

        if (!response) {
            res.status(404).json({ message: "candidate detail not found" })
        }

        const { summary, score } = await generateInterviewSummary({
            //   candidateName: response.candidateName,
            //   role: response,
            transcript: response,
        });

        console.log(summary, score)

        res.status(200).json({
            message: "message found",
            summary,
            score,
            transcript: response
        })

    } catch (error: any) {
        res.json({ "error": error.message })
    }
})

export default router;
