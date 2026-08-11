import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("resume", resumeFile)

    try {
        const response = await api.post("/api/interview/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        return response.data
    } catch (err) {
        console.error('generateInterviewReport error', err)
        return { error: { message: err?.response?.data?.error?.message || err.message || 'Network error' } }
    }

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    try {
        const response = await api.get(`/api/interview/report/${interviewId}`)
        return response.data
    } catch (err) {
        console.error('getInterviewReportById error', err)
        return { error: { message: err?.message || 'Network error' } }
    }
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    try {
        const response = await api.get("/api/interview/")
        return response.data
    } catch (err) {
        console.error('getAllInterviewReports error', err)
        return { error: { message: err?.message || 'Network error' } }
    }
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    try {
        const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
            responseType: "blob"
        })

        return response.data
    } catch (err) {
        if (err.response && err.response.data instanceof Blob) {
            const text = await err.response.data.text()
            try {
                const json = JSON.parse(text)
                throw new Error(json.error?.message || json.message || "Failed to generate PDF")
            } catch (parseErr) {
                throw new Error(text || "Failed to generate PDF")
            }
        }
        throw err
    }
}