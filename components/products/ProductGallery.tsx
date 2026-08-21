"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { PlaceholderImage } from "./designSystem";

const MAX_VISIBLE_IMAGES = 5;

type ProductGalleryProps = {
  imageUrls: string[];
  title: string;
};

export function ProductGallery({ imageUrls, title }: ProductGalleryProps) {
  const images = imageUrls.length > 0 ? imageUrls : [title];
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenImageCount = Math.max(images.length - MAX_VISIBLE_IMAGES, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? null : (current - 1 + images.length) % images.length,
        );
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? null : (current + 1) % images.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  function showPreviousImage() {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length,
    );
  }

  function showNextImage() {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % images.length,
    );
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <PlaceholderImage
            seed={visibleImages[0]}
            className="h-56 w-full transition duration-300 group-hover:scale-[1.01] sm:h-72"
            rounded="rounded-3xl"
          />
          <span className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
            {images.length} รูป
          </span>
        </button>

        {visibleImages.length > 1 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {visibleImages.slice(1).map((image, visibleIndex) => {
              const imageIndex = visibleIndex + 1;
              const isLastVisibleImage = imageIndex === MAX_VISIBLE_IMAGES - 1;

              return (
                <button
                  key={`${image}-${imageIndex}`}
                  type="button"
                  onClick={() => setActiveIndex(imageIndex)}
                  className="group relative cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  <PlaceholderImage
                    seed={image}
                    className="h-20 w-full transition duration-300 group-hover:scale-105 sm:h-24"
                    rounded="rounded-xl"
                  />
                  {isLastVisibleImage && hiddenImageCount > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#000f22]/55 text-lg font-semibold text-white backdrop-blur-[1px]">
                      +{hiddenImageCount} รูป
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeIndex !== null && (
        <div
          role="dialog"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute inset-0 bg-[#000f22]/85 backdrop-blur-sm"
          />

          <div className="relative z-10 flex h-full max-h-[48rem] w-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between text-white">
              <p aria-live="polite" className="text-sm font-medium">
                รูปที่ {activeIndex + 1} จาก {images.length}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setActiveIndex(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
              <PlaceholderImage
                seed={images[activeIndex]}
                className="h-full min-h-72 w-full"
                rounded="rounded-2xl"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1b3554] shadow-lg transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5"
                  >
                    <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1b3554] shadow-lg transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5"
                  >
                    <ChevronRight aria-hidden="true" className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductGallery;
