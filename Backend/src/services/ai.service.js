const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")

/**
 * Convert a Zod v4 schema to a Gemini-compatible JSON Schema.
 * Strips unsupported fields like $schema and additionalProperties recursively.
 */
function toGeminiSchema(zodSchema) {
    const jsonSchema = z.toJSONSchema(zodSchema)
    function clean(obj) {
        if (typeof obj !== 'object' || obj === null) return obj
        if (Array.isArray(obj)) return obj.map(clean)
        const cleaned = {}
        for (const [key, value] of Object.entries(obj)) {
            if (key === '$schema' || key === 'additionalProperties') continue
            cleaned[key] = clean(value)
        }
        return cleaned
    }
    return clean(jsonSchema)
}

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    // Retry wrapper for transient errors from the AI provider
    const maxAttempts = 3
    let lastErr = null
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: toGeminiSchema(interviewReportSchema),
                }
            })

            try {
                return JSON.parse(response.text)
            } catch (parseErr) {
                const e = new Error('Failed to parse AI response')
                e.statusCode = 502
                throw e
            }
        } catch (err) {
            lastErr = err
            // If last attempt, throw a controlled error
            if (attempt === maxAttempts) {
                const e = new Error(err?.message || 'AI service error')
                e.statusCode = err?.statusCode || 503
                throw e
            }
            // exponential backoff with jitter
            const delay = Math.round(500 * Math.pow(2, attempt - 1) * (0.7 + Math.random() * 0.6))
            await new Promise(r => setTimeout(r, delay))
        }
    }
    // fallback if loop exits unexpectedly
    const e = new Error(lastErr?.message || 'AI service error')
    e.statusCode = lastErr?.statusCode || 503
    throw e


}



const chromium = require("@sparticuz/chromium")
const puppeteerCore = require("puppeteer-core")

async function generatePdfFromHtml(htmlContent) {
    let browser
    try {
        const executablePath = await chromium.executablePath()
        if (executablePath) {
            browser = await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: executablePath,
                headless: chromium.headless,
            })
        } else {
            throw new Error("No chromium executablePath found")
        }
    } catch (err) {
        console.warn("Using standard puppeteer fallback:", err.message)
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        })
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription, skillGaps, matchScore }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const skillGapsList = skillGaps && skillGaps.length > 0
        ? skillGaps.map(g => `- ${g.skill} (${g.severity} priority)`).join('\n')
        : 'None identified'

    const prompt = `You are an expert resume writer and ATS optimization specialist. Your goal is to generate a resume that will achieve the HIGHEST possible match score (90%+) when evaluated against the given job description.

CANDIDATE'S ORIGINAL RESUME:
${resume}

CANDIDATE'S SELF DESCRIPTION:
${selfDescription}

TARGET JOB DESCRIPTION:
${jobDescription}

IDENTIFIED SKILL GAPS FROM ANALYSIS (current match score: ${matchScore || 'N/A'}%):
${skillGapsList}

CRITICAL INSTRUCTIONS FOR MAXIMUM JD ALIGNMENT:
1. **Mirror exact keywords and phrases** from the job description throughout the resume. Use the SAME terminology, technologies, tools, and buzzwords mentioned in the JD — do NOT paraphrase them.
2. **Address every skill gap** listed above by incorporating those skills naturally into the experience and skills sections. Frame the candidate's existing experience to demonstrate competence in these gap areas where truthfully possible.
3. **Professional Summary** must directly reference the job title and 3-5 key requirements from the JD within the first 2-3 sentences.
4. **Skills Section** must list ALL technologies, tools, frameworks, and methodologies mentioned in the JD that the candidate has any exposure to, using the exact same terms.
5. **Experience bullets** should use action verbs and quantified achievements. Each bullet should map to a specific JD requirement wherever possible.
6. **Order sections strategically** — put the most JD-relevant content first (skills, relevant experience).
7. The resume MUST be ATS-parsable: use standard section headings (Professional Summary, Skills, Experience, Education), avoid tables/columns/graphics, use standard fonts.
8. Keep it 1-2 pages. Focus on QUALITY and RELEVANCE over quantity.
9. The content must sound natural and human-written, not AI-generated.
10. Do NOT fabricate experience or skills the candidate doesn't have. Instead, reframe existing experience to highlight transferable skills that align with the JD.

HTML FORMATTING:
- Use clean, simple HTML with inline CSS styles
- Professional design with readable fonts (Arial/Helvetica), proper spacing
- Use bold for section headings and company names
- Keep it printer-friendly with good margins
- No images, no complex layouts — pure text-based HTML

Return a JSON object with a single field "html" containing the complete HTML content.`


    // Retry wrapper similar to generateInterviewReport
    const maxAttemptsPdf = 3
    let lastErrPdf = null
    for (let attempt = 1; attempt <= maxAttemptsPdf; attempt++) {
        try {
            const resp = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: toGeminiSchema(resumePdfSchema),
                }
            })

            let jsonContent
            try {
                jsonContent = JSON.parse(resp.text)
            } catch (parseErr) {
                const e = new Error('Failed to parse AI response for resume PDF')
                e.statusCode = 502
                throw e
            }

            const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
            return pdfBuffer
        } catch (err) {
            lastErrPdf = err
            if (attempt === maxAttemptsPdf) {
                const e = new Error(err?.message || 'AI service error')
                e.statusCode = err?.statusCode || 503
                throw e
            }
            const delay = Math.round(500 * Math.pow(2, attempt - 1) * (0.7 + Math.random() * 0.6))
            await new Promise(r => setTimeout(r, delay))
        }
    }
    const e2 = new Error(lastErrPdf?.message || 'AI service error')
    e2.statusCode = lastErrPdf?.statusCode || 503
    throw e2

}

module.exports = { generateInterviewReport, generateResumePdf }