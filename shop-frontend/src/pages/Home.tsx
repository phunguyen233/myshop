import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const images = [
    "/assets/slide1.jpg",
    "/assets/slide2.jpg",
    "/assets/slide3.jpg",
  ];

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1: next, -1: prev

  // Auto change slide every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  // Slide animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full">
      {/* SLIDER */}
      <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden rounded-b-3xl shadow-lg">
        <AnimatePresence custom={direction}>
          <motion.img
            key={index}
            src={images[index]}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
            className="absolute w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* DOTS */}
        <div className="absolute bottom-6 w-full flex justify-center gap-3">
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                index === i ? "bg-white scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* SECTION UNDER SLIDER */}
      <div className="p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-4">Sản phẩm nổi bật</h2>
        <p className="text-gray-600">Thêm phần sản phẩm tại đây...</p>
      </div>
    </div>
  );
}
