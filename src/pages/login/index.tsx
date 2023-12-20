import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import toast from 'react-hot-toast'

import logoImg from '../../assets/logo.svg'
import { Container } from '../../components/container'
import { Input } from '../../components/input'
import { auth } from '../../services/firebaseConnection'

const schema = z.object({
    email: z.string().min(1, "Insira seu email.").email("Insira um email válido."),
    password: z.string().min(1, "Insira sua senha.")
})

type FormData = z.infer<typeof schema>

export function Login() {
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    })

    function onSubmit(data: FormData) {
        signInWithEmailAndPassword(auth, data.email, data.password)
            .then((user) => {
                console.log("Logado com sucesso")
                console.log(user)
                toast.success(`Bem-vindo ${user.user.displayName}`)
                navigate("/dashboard", { replace: true })
            })
            .catch((error) => {
                console.log("Erro ao fazer login")
                console.log(error)
                toast.error("Email ou senha incorretos.")
            })
    }

    useEffect(() => {
        async function handleLogout(){
            await signOut(auth)
        }
        handleLogout()
    }, [])

    return (
        <Container>
            <div className="w-full min-h-screen flex justify-center items-center flex-col gap-4">
                <Link
                    to="/"
                    className="mb-6 max-w-sm w-full"
                >
                    <img
                        className="w-full"
                        src={logoImg}
                        alt="Página inicial do WebCarros"
                    />
                </Link>

                <form
                    className="bg-white max-w-xl w-full rounded-lg p-4"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className="mb-3">
                        <Input
                            type="email"
                            placeholder="Email"
                            name="email"
                            error={errors.email?.message}
                            register={register}
                        />
                    </div>

                    <div className="mb-3">
                        <Input
                            type="password"
                            placeholder="Senha"
                            name="password"
                            error={errors.password?.message}
                            register={register}
                        />
                    </div>

                    <button type="submit" className="bg-zinc-900 w-full rounded-md text-white h-10 font-medium">
                        Entrar
                    </button>
                </form>

                <Link to="/register">
                    Ainda não possui uma conta? Cadastre-se
                </Link>
            </div>
        </Container>
    )
}