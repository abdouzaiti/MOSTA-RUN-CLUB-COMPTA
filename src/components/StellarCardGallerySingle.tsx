/// <reference types="vite/client" />
"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Environment,
  Html,
  Plane,
  Sphere,
} from "@react-three/drei"
import { Download, Heart, X, Trophy, Mountain, Globe, Zap, Footprints, Activity, Star, Dumbbell, Award, Flame } from "lucide-react"

// Import all album images so Vite bundles and resolves them automatically
import pic1 from "../assets/album/pic1.png"
import pic2 from "../assets/album/pic2.png"
import pic3 from "../assets/album/pic3.png"
import pic4 from "../assets/album/pic4.png"
import pic5 from "../assets/album/pic5.png"
import pic6 from "../assets/album/pic6.png"
import pic7 from "../assets/album/pic7.png"
import pic8 from "../assets/album/pic8.png"
import pic9 from "../assets/album/pic9.png"
import pic10 from "../assets/album/pic10.png"
import pic11 from "../assets/album/pic11.png"
import pic12 from "../assets/album/pic12.png"
import pic13 from "../assets/album/pic13.png"
import pic14 from "../assets/album/pic14.png"
import pic15 from "../assets/album/pic15.png"
import pic16 from "../assets/album/pic16.png"
/* =========================
   Helper Design Mapper for Fallback Cards
   ========================= */

function getCardDesign(title: string) {
  const t = title.toLowerCase()
  if (t.includes("rose")) {
    return {
      gradient: "from-pink-500 via-rose-600 to-red-700",
      accent: "#f472b6",
      icon: "heart",
      label: "OCTOBRE ROSE",
      badge: "Charity Run"
    }
  }
  if (t.includes("chiffa") || t.includes("trail")) {
    return {
      gradient: "from-emerald-600 via-teal-700 to-slate-900",
      accent: "#2dd4bf",
      icon: "mountain",
      label: "TRAIL CHIFFA",
      badge: "Nature Trail"
    }
  }
  if (t.includes("bejaia") || t.includes("semi")) {
    return {
      gradient: "from-cyan-500 via-blue-600 to-indigo-900",
      accent: "#22d3ee",
      icon: "trophy",
      label: t.includes("bejaia") ? "SEMI BEJAIA" : "SEMI MARATHON",
      badge: t.includes("alger") ? "ALGER 21K" : "BEJAIA 21K"
    }
  }
  if (t.includes("madrid")) {
    return {
      gradient: "from-amber-500 via-orange-600 to-red-800",
      accent: "#fbbf24",
      icon: "globe",
      label: "SEMI MADRID",
      badge: "International"
    }
  }
  if (t.includes("bola")) {
    return {
      gradient: "from-yellow-400 via-amber-500 to-orange-700",
      accent: "#facc15",
      icon: "zap",
      label: "BOLA 24",
      badge: "Special Edition"
    }
  }
  if (t.includes("montagne") || t.includes("everest")) {
    return {
      gradient: "from-violet-600 via-purple-700 to-slate-900",
      accent: "#c084fc",
      icon: "mountain",
      label: title.toUpperCase(),
      badge: "Altitude"
    }
  }
  if (t.includes("aut")) {
    return {
      gradient: "from-lime-500 via-green-600 to-neutral-900",
      accent: "#a3e635",
      icon: "footprints",
      label: "AUT ULTRA",
      badge: "Ultra Trail"
    }
  }
  // Default MRC
  return {
    gradient: "from-blue-600 via-indigo-700 to-slate-900",
    accent: "#60a5fa",
    icon: "activity",
    label: "MRC ATHLETE",
    badge: "Official Club"
  }
}

function DesignIcon({ name, className }: { name: string; className?: string }) {
  const props = { className: className || "w-10 h-10 text-white/90", strokeWidth: 1.5 }
  switch (name) {
    case "heart": return <Heart {...props} fill="currentColor" />
    case "mountain": return <Mountain {...props} />
    case "trophy": return <Trophy {...props} />
    case "globe": return <Globe {...props} />
    case "zap": return <Zap {...props} fill="currentColor" />
    case "footprints": return <Footprints {...props} />
    case "star": return <Star {...props} fill="currentColor" />
    case "dumbbell": return <Dumbbell {...props} />
    case "award": return <Award {...props} />
    case "activity":
    default:
      return <Activity {...props} />
  }
}

/**
 * Single-file Stellar Card Gallery
 * - Context, Starfield, Galaxy, FloatingCard, Modal, and Page in one.
 */

/* =========================
   Card Context (inlined)
   ========================= */

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
}

type CardContextType = {
  selectedCard: Card | null
  setSelectedCard: (card: Card | null) => void
  cards: Card[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

function CardProvider({ children }: { children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  const cards: Card[] = [
    { id: "1", imageUrl: pic1, alt: "MRC", title: "MRC" },
    { id: "2", imageUrl: pic2, alt: "octobre rose", title: "octobre rose" },
    { id: "3", imageUrl: pic3, alt: "semi bejaia", title: "semi bejaia" },
    { id: "4", imageUrl: pic4, alt: "semi bejaia", title: "semi bejaia" },
    { id: "5", imageUrl: pic5, alt: "AUT", title: "AUT" },
    { id: "6", imageUrl: pic6, alt: "MRC", title: "MRC" },
    { id: "7", imageUrl: pic7, alt: "trail chiffa", title: "trail chiffa" },
    { id: "8", imageUrl: pic8, alt: "everest X MRC", title: "everest X MRC" },
    { id: "9", imageUrl: pic9, alt: "semi madrid", title: "semi madrid" },
    { id: "10", imageUrl: pic10, alt: "MRC", title: "MRC" },
    { id: "11", imageUrl: pic11, alt: "MRC", title: "MRC" },
    { id: "12", imageUrl: pic12, alt: "semi d'alger", title: "semi d'alger" },
    { id: "13", imageUrl: pic13, alt: "MRC", title: "MRC" },
    { id: "14", imageUrl: pic14, alt: "Bola 24", title: "Bola 24" },
    { id: "15", imageUrl: pic15, alt: "montagne 10", title: "montagne 10" },
    { id: "16", imageUrl: pic16, alt: "MRC", title: "MRC" },
  ]

  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  )
}

/* =========================
   Starfield Background (inlined)
   ========================= */

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)
    container.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 10000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    camera.position.z = 10

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      stars.rotation.y += 0.0001
      stars.rotation.x += 0.00005
      renderer.render(scene, camera)
    }
    animate()

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId)
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 z-0 bg-black" />
}

/* =========================
   Floating Card (inlined)
   ========================= */

function FloatingCard({
  card,
  position,
}: {
  card: Card
  position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { setSelectedCard } = useCard()

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedCard(card)
  }
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
  }
  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "auto"
  }

  const design = getCardDesign(card.title)

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        ref={meshRef}
        args={[4.5, 6]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          pointerEvents: "none",
        }}
      >
        <div
          className="w-40 h-52 rounded-lg overflow-hidden shadow-2xl bg-[#1D1E1E] p-2.5 select-none flex flex-col justify-between"
          style={{
            boxShadow: hovered
              ? "0 25px 50px rgba(49, 184, 198, 0.5), 0 0 30px rgba(49, 184, 198, 0.3)"
              : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid rgba(49, 184, 198, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {!imageError ? (
            <div className="relative w-full h-[145px] rounded-md overflow-hidden bg-black/40">
              <img
                src={card.imageUrl || "/placeholder.svg"}
                alt={card.alt}
                className="w-full h-full object-cover rounded-md"
                loading="lazy"
                draggable={false}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className={`relative w-full h-[145px] rounded-md overflow-hidden bg-gradient-to-br ${design.gradient} flex flex-col items-center justify-center p-2 text-center`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-10 pointer-events-none" />
              
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-black/40 text-white/90">
                {design.badge}
              </span>
              
              <div className="my-auto transform transition-transform duration-300 hover:scale-110">
                <DesignIcon name={design.icon} className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              </div>
              
              <div className="absolute bottom-1.5 left-1 right-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] truncate">
                  {design.label}
                </p>
              </div>
            </div>
          )}
          <div className="text-center py-1 bg-black/10 rounded-sm mt-1">
            <p className="text-white text-[11px] font-bold tracking-wide truncate">{card.title}</p>
          </div>
        </div>
      </Html>
    </group>
  )
}

/* =========================
   Card Modal (inlined)
   ========================= */

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImageError(false)
  }, [selectedCard])

  if (!selectedCard) return null

  const design = getCardDesign(selectedCard.title)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseEnter = () => {}
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out"
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }
  }

  const toggleFavorite = () => setIsFavorited((v) => !v)
  const handleClose = () => setSelectedCard(null)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative max-w-md w-full mx-4">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[16px] bg-[#1F2121] p-4 transition-all duration-500 ease-out w-full"
            style={{
              transformStyle: "preserve-3d",
              boxShadow:
                "rgba(0, 0, 0, 0.01) 0px 520px 146px 0px, rgba(0, 0, 0, 0.04) 0px 333px 133px 0px, rgba(0, 0, 0, 0.26) 0px 83px 83px 0px, rgba(0, 0, 0, 0.29) 0px 21px 46px 0px",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4" style={{ aspectRatio: "3 / 4" }}>
              {!imageError ? (
                <img
                  loading="lazy"
                  className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover"
                  alt={selectedCard.alt}
                  src={selectedCard.imageUrl || "/placeholder.svg"}
                  onError={() => setImageError(true)}
                  style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px", opacity: 1 }}
                />
              ) : (
                <div className="absolute inset-0 h-full w-full rounded-[16px] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${design.accent}20, #1F2121), bg-gradient-to-br ${design.gradient}`,
                    boxShadow: "rgba(0, 0, 0, 0.2) 0px 10px 30px"
                  }}
                >
                  {/* Premium backgrounds and visual shapes */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient} opacity-85 z-0`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent)] pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-[linear-gradient(30deg,rgba(0,0,0,0.25)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.25)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-15 pointer-events-none z-10" />
                  <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none z-10" />
                  
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-black/50 text-white/95 border border-white/10 mb-6 z-20 shadow-lg animate-pulse">
                    {design.badge}
                  </span>
                  
                  <div className="p-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner my-auto z-20 transform hover:scale-110 transition-transform duration-300">
                    <DesignIcon name={design.icon} className="w-16 h-16 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
                  </div>
                  
                  <div className="mt-auto mb-4 z-20">
                    <h2 className="text-xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] tracking-wider">
                      {design.label}
                    </h2>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mt-1">
                      MARMOTTE RUNNING CLUB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-white text-lg font-semibold mb-4 text-center">{selectedCard.title}</h3>

            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg text-base font-medium text-black outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#31b8c6" }}
              >
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" strokeWidth={1.8} />
                  <span>Download</span>
                </div>
              </button>
              <button
                type="button"
                onClick={toggleFavorite}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-black outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#31b8c6" }}
              >
                <Heart className="h-4 w-4" strokeWidth={1.8} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Card Galaxy (inlined)
   ========================= */

function CardGalaxy() {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: {
      x: number
      y: number
      z: number
      rotationX: number
      rotationY: number
      rotationZ: number
    }[] = []
    const numCards = cards.length
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < numCards; i++) {
      const y = 1 - (i / (numCards - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = (2 * Math.PI * i) / goldenRatio
      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY
      const layerRadius = 12 + (i % 3) * 4

      positions.push({
        x: x * layerRadius,
        y: y * layerRadius,
        z: z * layerRadius,
        rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
        rotationY: Math.atan2(x, z),
        rotationZ: (Math.random() - 0.5) * 0.2,
      })
    }
    return positions
  }, [cards.length])

  return (
    <>
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.15} wireframe />
      </Sphere>
      <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.05} wireframe />
      </Sphere>
      <Sphere args={[16, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.03} wireframe />
      </Sphere>
      <Sphere args={[20, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#31b8c6" transparent opacity={0.02} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  )
}

/* =========================
   Page/Component Export
   ========================= */

export default function StellarCardGallerySingle() {
  return (
    <CardProvider>
      <div className="w-full h-full relative overflow-hidden bg-black flex-1">
        <StarfieldBackground />

        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto"
          }}
        >
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <CardGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={40}
              autoRotate={false}
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              panSpeed={0.8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        <div className="absolute top-4 left-4 z-20 text-white pointer-events-none">
          <p className="text-sm opacity-70">Drag to look around • Scroll to zoom • Click cards to view details</p>
        </div>
      </div>
    </CardProvider>
  )
}
