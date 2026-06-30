import z, { string } from 'zod'

export const PreInterviewSchema = z.object({
    github: z.string(),
    linkedin: z.string() 
})