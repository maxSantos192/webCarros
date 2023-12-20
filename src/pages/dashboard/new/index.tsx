import { ChangeEvent, useContext, useState } from "react"
import { useForm } from "react-hook-form"
import { FiTrash, FiUpload } from "react-icons/fi"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { v4 as uuidV4 } from "uuid"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { addDoc, collection } from "firebase/firestore"

import { Input } from "../../../components/input"
import { Container } from "../../../components/container"
import { DashboardHeader } from "../../../components/panelheader"
import { AuthContext } from "../../../context/AuthContext"
import { storage, db } from "../../../services/firebaseConnection"
import toast from "react-hot-toast"

const schema = z.object({
    name: z.string().min(1, "Insira o nome do veículo."),
    model: z.string().min(1, "Insira o modelo do veículo."),
    year: z.string().min(1, "Insira o ano do veículo.").refine((value) => /^\d+$/.test(value), {
        message: "O campo deve conter apenas números"
    }),
    km: z.string().min(1, "Insira a quilometragem do veículo."),
    price: z.string().min(1, "Insira o valor para venda."),
    city: z.string().min(1, "Insira a cidade."),
    whatsapp: z.string().min(1, "Insira o número whatsapp para contato.").refine((value) => /^(\d{10,11})$/.test(value), {
        message: "Número de telefone inválido."
    }),
    description: z.string().min(1, "Insira a descrição do veículo."),
})

type FormData = z.infer<typeof schema>

interface ImageItemProps {
    uid: string
    name: string
    previewUrl: string
    url: string
}

export function New() {
    const { user } = useContext(AuthContext)

    const [carImages, setCarImages] = useState<ImageItemProps[]>([])

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    })

    function onsubmit(data: FormData) {
        if (carImages.length === 0) {
            toast("Envie ao menos uma imagem do veículo!", { icon: '⚠️' })
            return
        }
        carImages.map( car => {
            return {
                uid: car.uid,
                name: car.name,
                url: car.url,
            }
        })
        addDoc(collection(db, "cars"), {
            name: data.name.toUpperCase(),
            model: data.model,
            whatsapp: data.whatsapp,
            city: data.city,
            year: data.year,
            km: data.km,
            price: data.price,
            description: data.description,
            created: new Date(),
            owner: user?.name,
            uid: user?.uid,
            images: carImages
        })
        .then(() => {
            console.log("Veículo cadastrado.")
            toast.success("Veículo cadastrado!")
            reset()
            setCarImages([])
        })
        .catch((err) => {
            toast.error("Tivemos um problema ao cadastrar seu veículo.")
            console.log("Erro ao cadastrar no banco")
            console.log(err)
        })
    }

    async function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const image = e.target.files[0]

            if (image.type === 'image/jpeg' || image.type === 'image/png') {
                //envia imagem do veiculo pro bando de dados
                await handleUpload(image)
            } else {
                alert("Envie uma imagem Jpeg ou Png")
                return
            }
        }
    }
    
    async function handleUpload(image: File) {
        if (!user?.uid) {
            console.log("sem user")
            return
        }
        const currentUid = user?.uid
        const uidImage = uuidV4()

        const uploadRef = ref(storage, `images/${currentUid}/${uidImage}`)

        uploadBytes(uploadRef, image)
            .then((snapshot) => {
                getDownloadURL(snapshot.ref).then((downloadUrl) => {
                    const imageItem = {
                        name: uidImage,
                        uid: currentUid,
                        previewUrl: URL.createObjectURL(image),
                        url: downloadUrl,
                    }
                    setCarImages((image) => [...image, imageItem])
                })
            })
    }

    async function handleDeleteImage(item: ImageItemProps) {
        const imagePath = `images/${item.uid}/${item.name}`
        const imageRef = ref(storage, imagePath)

        try {
            await deleteObject(imageRef)
            setCarImages(carImages.filter((car) => car.url !== item.url))
        } catch (err) {
            alert("Não foi possivel excluir a imagem")
            console.log(err)
        }
    }

    return (
        <Container>
            <DashboardHeader />

            <div className="w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2">
                <button className="border-2 w-48 rounded-lg flex items-center justify-center cursor-pointer border-gray-600 h-32 md:w-48">
                    <div className="absolute cursor-pointer">
                        <FiUpload size={30} color="#000" />
                    </div>
                    <div className="cursor-pointer">
                        <input
                            className="opacity-0 w-full h-32 cursor-pointer"
                            type="file"
                            accept="image/*"
                            onChange={handleFile}
                        />
                    </div>
                </button>
                {carImages.map(item => (
                    <div
                        className="w-full h-32 flex justify-center items-center relative"
                        key={item.name}
                    >
                        <button
                            className="absolute"
                            onClick={() => handleDeleteImage(item)}
                        >
                            <FiTrash size={32} color="#FFF" />
                        </button>
                        <img
                            className="rounded-lg w-full h-32 object-cover"
                            src={item.previewUrl}
                            alt="Imagem Enviada pelo usuário"
                        />
                    </div>
                ))}
            </div>

            <div className="w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2 mt-2">
                <form
                    className="w-full"
                    onSubmit={handleSubmit(onsubmit)}
                >
                    <div className="mb-3">
                        <p className="mb-2 font-medium">Nome do veículo</p>
                        <Input
                            type="text"
                            register={register}
                            name="name"
                            error={errors.name?.message}
                            placeholder="Ex: Onix 1.0"
                        />
                    </div>
                    <div className="mb-3">
                        <p className="mb-2 font-medium">Modelo do veículo</p>
                        <Input
                            type="text"
                            register={register}
                            name="model"
                            error={errors.model?.message}
                            placeholder="Ex: 1.0 Flex, Plus, Manual"
                        />
                    </div>

                    <div className="flex w-full mb-3 flex-row items-center gap-4">
                        <div className="mb-3 w-full">
                            <p className="mb-2 font-medium">Ano do veículo</p>
                            <Input
                                type="text"
                                register={register}
                                name="year"
                                error={errors.year?.message}
                                placeholder="Ex: 2023"
                            />
                        </div>
                        <div className="mb-3 w-full">
                            <p className="mb-2 font-medium">Km rodados</p>
                            <Input
                                type="text"
                                register={register}
                                name="km"
                                error={errors.km?.message}
                                placeholder="Ex: 21.000"
                            />
                        </div>
                    </div>

                    <div className="flex w-full mb-3 flex-row items-center gap-4">
                        <div className="mb-3 w-full">
                            <p className="mb-2 font-medium">Telefone / Whatsapp</p>
                            <Input
                                type="text"
                                register={register}
                                name="whatsapp"
                                error={errors.whatsapp?.message}
                                placeholder="Ex: 00 12345678"
                            />
                        </div>
                        <div className="mb-3 w-full">
                            <p className="mb-2 font-medium">Cidade</p>
                            <Input
                                type="text"
                                register={register}
                                name="city"
                                error={errors.city?.message}
                                placeholder="Ex: São Paulo"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 font-medium">Preço</p>
                        <Input
                            type="text"
                            register={register}
                            name="price"
                            error={errors.price?.message}
                            placeholder="Ex: 40.000"
                        />
                    </div>

                    <div className="mb-3">
                        <p className="mb-2 font-medium">Descrição</p>
                        <textarea
                            className="border-2 w-full rounded-md h-24 px-2"
                            {...register("description")}
                            name="description"
                            id="description"
                            placeholder="Digite a descrição completa do veículo."
                        />
                        {errors.description && <p className="mb-1 text-red-500">{errors.description?.message}</p>}
                    </div>

                    <button className="w-full rounded-md bg-zinc-900 text-white font-medium h-10" type="submit">
                        Cadastrar
                    </button>
                </form>
            </div>
        </Container>
    )
}