import { useEffect, useState } from "react"
import { Container } from "../../components/container"
import { collection, query, orderBy, getDocs, where } from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../../services/firebaseConnection"

interface CarsProps {
    id: string
    name: string
    year: string
    uid: string
    price: string | number
    city: string
    km: string | number
    images: CarImageProps[]
}

interface CarImageProps {
    name: string
    uid: string
    url: string
}

export function Home() {
    const [cars, setCars] = useState<CarsProps[]>([])
    const [loadImages, setLoadImages] = useState<string[]>([])
    const [input, setInput] = useState("")

    useEffect(() => {
        loadCars()
    }, [])

    function loadCars() {
        const carsRef = collection(db, "cars")
        const queryRef = query(carsRef, orderBy("created", "desc"))

        getDocs(queryRef)
            .then((snapshot) => {
                let listCars = [] as CarsProps[]
                snapshot.forEach(doc => {
                    listCars.push({
                        id: doc.id,
                        name: doc.data().name,
                        year: doc.data().year,
                        km: doc.data().km,
                        city: doc.data().city,
                        price: doc.data().price,
                        images: doc.data().images,
                        uid: doc.data().uid,
                    })
                })
                setCars(listCars)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    function handleImageLoad(id: string) {
        setLoadImages((prevImageLoad) => [...prevImageLoad, id])
    }

    async function handleSearchCar() {
        if (input === "") {
            loadCars()
            return
        }
        setCars([])        
        setLoadImages([])

        const q = query(collection(db, "cars"),
        where("name", ">=", input.toUpperCase()),
        where("name", "<=", input.toUpperCase() + "\uf8ff")
        )
        const querySnapshot = await getDocs(q)

        let listCars = [] as CarsProps[]

        querySnapshot.forEach((doc) => {
            listCars.push({
                id: doc.id,
                name: doc.data().name,
                year: doc.data().year,
                km: doc.data().km,
                city: doc.data().city,
                price: doc.data().price,
                images: doc.data().images,
                uid: doc.data().uid,
            })
        })
        setCars(listCars)
    }

    return (
        <Container>
            <section className="bg-white p-4 rounded-lg w-full max-w-3xl mx-auto flex justify-center items-center gap-2">
                <input
                    className="w-full border-2 rounded-lg h-9 px-3 outline-none"
                    placeholder="Buscar carro"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    className="bg-red-500 h-9 px-8 rounded-lg text-white font-medium text-lg"
                    onClick={handleSearchCar}
                >
                    Buscar
                </button>
            </section>

            <h1 className="font-bold text-center mt-6 text-2xl mb-4">
                Carros novos e usados em todo o Brasil
            </h1>

            <main className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                {cars.map(item => (
                    <Link 
                        key={item.id}
                        to={`/car/${item.id}`}
                    >
                        <section className="w-full bg-white rounded-lg">
                        <div 
                            className="w-full h-72 rounded-lg bg-slate-200"
                            style={{ display: loadImages.includes(item.id) ? "none" : "block"}}
                        >

                        </div>
                            <img
                                className="w-full rounded-lg mb-2 h-auto hover:scale-105 transition-all"
                                style={{ display: loadImages.includes(item.id) ? "block" : "none" }}
                                src={item.images[0].url}
                                alt="Modelo do veículo"
                                onLoad={ () => handleImageLoad(item.id)}
                            />
                            <p className="font-bold mt-1 mb-2 px-2">{item.name}</p>

                            <div className="flex flex-col px-2">
                                <span className="text-zinc-700 mb-6">Ano {item.year} | {item.km} km</span>
                                <strong className="text-black font-medium text-xl">R$ {item.price}</strong>
                            </div>

                            <div className="w-full h-px bg-slate-200 my-2"></div>

                            <div className="px-2 pb-2">
                                <span className="text-zinc-700">
                                    {item.city}
                                </span>
                            </div>
                        </section>
                    </Link>
                ))}

            </main>
        </Container>
    )
}