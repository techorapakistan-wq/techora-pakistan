import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const slides = [
  { image:"https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=2200&q=90", eyebrow:"CURATED TECHNOLOGY · PAKISTAN", title:<>Technology,<br/><em>well chosen.</em></>, copy:"Considered tech for the way you live, work and listen. Discover a quieter kind of upgrade." },
  { image:"https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=2200&q=90", eyebrow:"AUDIO, REFINED", title:<>Sound that<br/><em>stays with you.</em></>, copy:"Premium headphones and earbuds for your everyday rhythm." },
  { image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2200&q=90", eyebrow:"SMART ESSENTIALS", title:<>Made for the<br/><em>modern day.</em></>, copy:"Reliable tech that keeps pace with the way you move." },
];
export default function HeroCarousel({ go }) {
  const [index,setIndex]=useState(0);
  useEffect(()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const id=setInterval(()=>setIndex(i=>(i+1)%slides.length),5000);return()=>clearInterval(id)});
  const slide=slides[index];
  return <section className="hero hero-carousel" aria-roledescription="carousel" aria-label="Techora featured collections"><AnimatePresence mode="wait"><motion.div key={index} className="hero-slide-bg" style={{backgroundImage:'url("' + slide.image + '")'}} initial={{opacity:0,scale:1.04}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.65}}/></AnimatePresence><div className="hero-shade"/><motion.div key={'copy'+index} className="hero-copy" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.45}}><p className="eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p className="hero-text">{slide.copy}</p><div className="hero-actions"><button className="button button-ink" onClick={()=>go("/shop")}>Shop the edit</button><button className="text-link" onClick={()=>go("/story")}>Our story</button></div></motion.div></section>;
}