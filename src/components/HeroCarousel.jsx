import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import creator from "../assets/hero-creator.jpg";
import studio from "../assets/hero-studio.jpg";
import gaming from "../assets/hero-gaming.jpg";

const slides = [
  { image: creator, eyebrow: "PREMIUM TECH · PAKISTAN", title: <>The tech you<br/><em>actually want.</em></>, copy: "Creator essentials, audio and everyday gadgets chosen to perform beautifully.", label: "Shop creator gear" },
  { image: studio, eyebrow: "CAPTURE · CREATE · CONNECT", title: <>Built for your<br/><em>next big idea.</em></>, copy: "Camera, drone and studio essentials for every kind of creator.", label: "Explore the collection" },
  { image: gaming, eyebrow: "GAME WITHOUT LIMITS", title: <>Play with more<br/><em>power.</em></>, copy: "Gaming gear and immersive audio designed for your best sessions.", label: "Shop gaming" },
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