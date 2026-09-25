import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
const slides = [
  {
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "ACOUSTIC PRECISION · PAKISTAN",
    title: <>Wireless sound,<br/><em>unfiltered clarity.</em></>,
    copy: "Monster low-latency audio engineered for seamless music, gaming, and calls all day.",
    label: "Explore Airbuds"
  },
  {
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "HOROLOGY & ELEGANCE",
    title: <>Timeless style for<br/><em>modern ambition.</em></>,
    copy: "Geneva luxury statement watches with classic metal bracelets and polished precision.",
    label: "Shop Luxury Watches"
  },
  {
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "SMART DESK & LIFESTYLE",
    title: <>Keep your drinks warm,<br/><em>every single sip.</em></>,
    copy: "CHOICE Electric Coffee Mug & Desk Warmer set with automatic 55°C temperature control and ceramic mug.",
    label: "Shop Mug Warmers"
  },
  {
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2000&q=85",
    eyebrow: "PRECISION ACCESSORIES",
    title: <>Crafted for durability,<br/><em>built for comfort.</em></>,
    copy: "Premium silicone QuickFit straps engineered for Garmin sports, outdoor fitness, and daily wear.",
    label: "Explore Accessories"
  },
];

export default function HeroCarousel({ go }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setIndex(current => (current + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, []);
  const slide = slides[index];
  return <section className="hero hero-carousel" aria-roledescription="carousel" aria-label="Techora featured collections">
    <AnimatePresence mode="wait"><motion.div key={index} className="hero-slide-bg" style={{ backgroundImage: `url(${slide.image})` }} initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .55 }}/></AnimatePresence>
    <div className="hero-shade"/>
    <motion.div key={`copy-${index}`} className="hero-copy hero-premium-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42 }}>
      <p className="eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p className="hero-text">{slide.copy}</p>
      <div className="hero-actions"><button className="button button-ink" onClick={() => go("/shop")}>{slide.label}</button><button className="text-link" onClick={() => go("/story")}>Why Techora</button></div>
    </motion.div>
    <div className="hero-slide-dots" aria-label="Hero slides">{slides.map((_, i) => <button key={i} onClick={() => setIndex(i)} className={i === index ? "active" : ""} aria-label={`Show slide ${i + 1}`}/>)}</div>
  </section>;
}
