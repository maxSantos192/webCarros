import { useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'

import logoImg from '../../assets/logo.svg'
import { Container } from '../../components/container'
import { Input } from '../../components/input'
import { auth } from '../../services/firebaseConnection'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const schema = z.object({
    name: z.string().min(1, "Insira seu nome."),
    email: z.string().min(1, "Insira seu email.").email("Insira um email válido."),
    password: z.string().min(1, "Insira sua senha.").min(6, "A senha deve ter pelo menos 6 caracteres.")
})

type FormData = z.infer<typeof schema>

export function Register() {
    const { handleInfoUser } = useContext(AuthContext)
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    })

    async function onSubmit(data: FormData) {
        createUserWithEmailAndPassword(auth, data.email, data.password)
            .then(async (user) => {
                await updateProfile(user.user, {
                    displayName: data.name
                })
                handleInfoUser({
                    name: data.name,
                    email: data.email,
                    uid: user.user.uid,
                })
                console.log("Cadastrado com sucesso.")
                toast.success(`Bem-vindo ${user.user.displayName}`)
                navigate("/dashboard", { replace: true })
            })
            .catch((error) => {
                console.log("log do erro =>")
                console.log(error)
            })
    }

    //desloga o usuario caso estja logado e vá pra página de registro
    useEffect(() => {
        async function handleSignout() {
            await signOut(auth)
        }
        handleSignout()
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
                            type="text"
                            placeholder="Nome"
                            name="name"
                            error={errors.name?.message}
                            register={register}
                        />
                    </div>

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
                        Registrar
                    </button>
                </form>

                <Link to="/login">
                    Já possui uma conta? Faça login!
                </Link>
            </div>
        </Container>
    )
}