import express from 'express'
import { PreInterviewSchema } from './types.js'
import axios from 'axios'
import cors from "cors"
import prisma from './lib/prisma.js'

const app = express()
app.use(express.json())
app.use(cors())

app.get("/health",(req,res)=>{
    res.send({message:"hello from server"})
})

app.post("/api/v1/pre-interview",async (req,res)=>{
    try{
        const {success, data} = PreInterviewSchema.safeParse(req.body)
        if(!success){
            res.status(400).json({
                message: "Validation failed"
            })
            return;
        }
        const githubUsername = data.github.split("/")[3];
        //Todo: Add proxy because github will rate limit you request
        const userRepo = await axios.get(`https://api.github.com/users/${githubUsername}/repos`)

        const filteredRepoData = userRepo.data.map((item: any)=> ({
            description: item.description,
            name: item.name,
            fullName : item.fullName,
            startCount: item.startCount
        }))

        // await prisma.interview.create(
        //     data:{
        //         githubMetadata:filteredRepoData,

        //     }
        // )

        return res.status(200).json({
            Data: filteredRepoData,
            message: "Success"
        })


    }catch(err: any){
        console.log(err.message)
    }
})

app.listen(3000,()=>{
    console.log("server is up")
})