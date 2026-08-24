"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Maximize2,
  X,
} from "lucide-react";

type ProductGalleryProps = {
  imageUrls: string[];
  title: string;
};

type GalleryImageProps = {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

function GalleryImage({ src, alt, priority = false, className }: GalleryImageProps) {
  const [hasError, setHasError] = useState(false);
  const isMockImage = src?.includes("example.supabase.co");

  if (!src || isMockImage || hasError) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-[#2980B9] to-[#6DD5FA] ${className ?? ""}`}
      >
        <ImageIcon
          aria-hidden="true"
          className="h-[24%] w-[24%] text-white/70"
          strokeWidth={1.7}
        />
      </span>
    );
  }

  return (
    // Product images can come from user-configured storage domains at runtime.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setHasError(true)}
      className={`object-contain ${className ?? ""}`}
    />
  );
}

export function ProductGallery({ imageUrls, title }: ProductGalleryProps) {
  const images: Array<string | undefined> =
    imageUrls.length > 0 ? imageUrls : [undefined];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [hasThumbnailOverflow, setHasThumbnailOverflow] = useState(false);
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const touchStartXRef = useRef<number | null>(null);
  const wasSwipedRef = useRef(false);

  const showPreviousImage = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  function handleTouchStart(event: React.TouchEvent<HTMLButtonElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    wasSwipedRef.current = false;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLButtonElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX === null || endX === undefined) {
      return;
    }

    const distance = endX - startX;
    if (Math.abs(distance) < 45) {
      return;
    }

    wasSwipedRef.current = true;
    if (distance > 0) {
      showPreviousImage();
    } else {
      showNextImage();
    }
  }

  function scrollThumbnails(direction: -1 | 1) {
    const rail = thumbnailRailRef.current;
    rail?.scrollBy({
      left: direction * (rail.clientWidth * 0.8),
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const rail = thumbnailRailRef.current;
    if (!rail) {
      return;
    }
    const thumbnailRail = rail;

    function updateOverflowState() {
      setHasThumbnailOverflow(
        thumbnailRail.scrollWidth > thumbnailRail.clientWidth + 1,
      );
    }

    updateOverflowState();
    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(thumbnailRail);

    return () => resizeObserver.disconnect();
  }, [images.length]);

  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeIndex]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          (current - 1 + images.length) % images.length,
        );
      } else if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, isLightboxOpen]);

  return (
    <>
      <section
        aria-label={`แกลเลอรีรูปภาพ ${title}`}
        className="rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3"
      >
        <div className="group relative h-[22rem] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-[#f4f4f4] sm:h-[30rem] lg:h-[34rem]">
          <button
            type="button"
            onClick={() => {
              if (wasSwipedRef.current) {
                wasSwipedRef.current = false;
                return;
              }
              setIsLightboxOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                showPreviousImage();
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                showNextImage();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-label={`เปิดรูป ${title} แบบเต็มหน้าจอ`}
            className="absolute inset-0 z-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-sky-500"
          >
            <span className="block h-full w-full">
              <GalleryImage
                key={images[activeIndex] ?? title}
                src={images[activeIndex]}
                alt={`${title} รูปที่ ${activeIndex + 1}`}
                priority
                className="h-full w-full p-5 sm:p-8"
              />
            </span>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                aria-label="ดูรูปก่อนหน้า"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:scale-105 hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:left-4"
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNextImage}
                aria-label="ดูรูปถัดไป"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:scale-105 hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:right-4"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </>
          )}

          <span
            aria-live="polite"
            className="absolute bottom-3 right-3 z-10 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur"
          >
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        {images.length > 1 && (
          <div className="relative mt-3">
            {hasThumbnailOverflow && (
              <button
                type="button"
                onClick={() => scrollThumbnails(-1)}
                aria-label="เลื่อนรูปตัวอย่างไปทางซ้าย"
                className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>
            )}

            <div
              ref={thumbnailRailRef}
              role="list"
              aria-label="เลือกรูปสินค้า"
              className="grid auto-cols-[calc(25%_-_0.375rem)] grid-flow-col justify-start gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:auto-cols-[calc(16.666667%_-_0.625rem)] sm:gap-3 [&::-webkit-scrollbar]:hidden"
            >
              {images.map((image, index) => {
                const isActive = activeIndex === index;

                return (
                  <button
                    ref={(element) => {
                      thumbnailRefs.current[index] = element;
                    }}
                    key={`${image ?? title}-${index}`}
                    type="button"
                    role="listitem"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`แสดงรูปที่ ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative aspect-square w-full overflow-hidden rounded-2xl border-2 bg-[#f4f4f4] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                      isActive
                        ? "border-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                        : "border-slate-200 opacity-70 hover:border-slate-300 hover:opacity-100"
                    }`}
                  >
                    <GalleryImage
                      src={image}
                      alt={`${title} รูปตัวอย่างที่ ${index + 1}`}
                      className="h-full w-full p-2"
                    />
                  </button>
                );
              })}
            </div>

            {hasThumbnailOverflow && (
              <button
                type="button"
                onClick={() => scrollThumbnails(1)}
                aria-label="เลื่อนรูปตัวอย่างไปทางขวา"
                className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:text-[#1b3554] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </section>

      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`รูปภาพ ${title} แบบเต็มหน้าจอ`}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="ปิดรูปภาพแบบเต็มหน้าจอ"
            className="absolute inset-0 bg-[#000f22]/85 backdrop-blur-sm"
          />

          <div className="relative z-10 flex h-full max-h-[48rem] w-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between text-white">
              <p aria-live="polite" className="text-sm font-medium">
                รูปที่ {activeIndex + 1} จาก {images.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="ปิด"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#f4f4f4]">
              <GalleryImage
                key={`lightbox-${images[activeIndex] ?? title}`}
                src={images[activeIndex]}
                alt={`${title} รูปที่ ${activeIndex + 1}`}
                className="h-full min-h-72 w-full p-5 sm:p-10"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="ดูรูปก่อนหน้า"
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1b3554] shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5"
                  >
                    <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="ดูรูปถัดไป"
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1b3554] shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5"
                  >
                    <ChevronRight aria-hidden="true" className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div
                role="list"
                aria-label="เลือกรูปในโหมดเต็มหน้าจอ"
                className="mx-auto mt-3 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((image, index) => (
                  <button
                    key={`lightbox-thumb-${image ?? title}-${index}`}
                    type="button"
                    role="listitem"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`แสดงรูปที่ ${index + 1} ในโหมดเต็มหน้าจอ`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f4f4f4] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      activeIndex === index
                        ? "border-sky-400"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <GalleryImage
                      src={image}
                      alt={`${title} รูปตัวอย่างที่ ${index + 1}`}
                      className="h-full w-full p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ProductGallery;
