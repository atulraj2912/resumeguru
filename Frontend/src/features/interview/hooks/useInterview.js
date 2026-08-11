import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (!response || response.error) {
                console.log('generateReport failed', response && response.error ? response.error : 'no response')
                return null
            }
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            if (!response || response.error) {
                console.log('getReportById failed', response && response.error ? response.error : 'no response')
                return null
            }
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (!response || response.error) {
                console.log('getReports failed', response && response.error ? response.error : 'no response')
                return null
            }
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const responseData = await generateResumePdf({ interviewReportId })
            const blob = responseData instanceof Blob ? responseData : new Blob([responseData], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        }
        catch (error) {
            console.error('getResumePdf error:', error)
            alert(error.message || "Failed to generate PDF. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}