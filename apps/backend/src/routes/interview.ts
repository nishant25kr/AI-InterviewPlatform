import { Router } from 'express';
import { PreInterviewSchema } from '../types.js';
import axios from 'axios';
import prisma from '../lib/prisma.js';

const sessionConfig = JSON.stringify({
  type: "realtime",
  model: "gpt-realtime-2",
  audio: { output: { voice: "marin" } },
});


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

router.post("/session", async(req,res)=>{
    try {
        const fd = new FormData();
        fd.set("sdp", req.body);
        fd.set("session", sessionConfig);

        try {
            const r = await fetch("https://api.openai.com/v1/realtime/calls", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Safety-Identifier": "hashed-user-id",
            },
            body: fd,
            });

            const sdp = await r.text();
            res.send(sdp);
        } catch (error) {
            console.error("Token generation error:", error);
            res.status(500).json({ error: "Failed to generate token" });
        }     
    } catch (error) {
        
    }
});
export default router;
