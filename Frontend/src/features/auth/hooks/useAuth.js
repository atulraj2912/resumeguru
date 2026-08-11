import { useContext, useEffect} from "react"
import { AuthContext } from "../auth.context.jsx"
import { login, register, logout, getMe } from "../services/auth.api.js"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async({email, password}) => {
        setLoading(true)
        try{
            const data = await login({email, password})
            if (!data || !data.user) return false
            setUser(data.user)
            return true
        } catch (error) {
            console.error(error)
            return false
        }
        finally{
            setLoading(false)
        }
    }

    const handleRegister = async({username, email, password}) => {
        setLoading(true)
        try{
            const data = await register({username, email, password})
            if (!data || !data.user) return false
            setUser(data.user)
            return true
        }catch (error) {
            console.error(error)
            return false
        }finally{
            setLoading(false)
        }
    }

    const handleLogout = async() => {
        setLoading(true)
        try{
            const data = await logout()
            setUser(null)
        }catch (error) {
            console.error(error)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            setLoading(true)
            try {
                const data = await getMe()
                if (data?.user) {
                    setUser(data.user)
                }
            } catch (error) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [setLoading, setUser])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}