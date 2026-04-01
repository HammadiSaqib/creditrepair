import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import SiteHeader from "@/components/SiteHeader";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Users,
  FileText,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  Award,
  Play,
  Star,
  Lock,
  Sparkles,
  DollarSign,
  MousePointer2,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

import FallingMoney from "@/components/ui/FallingMoney";
import Footer from "@/components/Footer";

const VideoThumbnail = ({ src, alt, className }: { src: string; alt?: string; className?: string }) => {
  const [thumb, setThumb] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (typeof window === "undefined") return;
    const video = document.createElement("video");
    const onSeeked = () => {
      const canvas = document.createElement("canvas");
      const w = video.videoWidth || 720;
      const h = video.videoHeight || 1280;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setFailed(true);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const url = canvas.toDataURL("image/jpeg");
      if (mounted) setThumb(url);
      video.pause();
    };
    const onMeta = () => {
      try {
        video.currentTime = 0.1;
      } catch {
        setFailed(true);
      }
    };
    const onError = () => setFailed(true);
    video.src = src;
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.load();
    return () => {
      mounted = false;
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.src = "";
    };
  }, [src]);
  if (thumb) {
    return <img src={thumb} alt={alt || ""} loading="lazy" decoding="async" className={`w-full h-full object-cover ${className || ""}`} />;
  }
  if (failed) {
    return <div className={`w-full h-full ${className || ""} bg-gradient-to-b from-slate-900 to-slate-800`} />;
  }
  return <div className={`w-full h-full ${className || ""} bg-slate-900`} />;
};

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeTestimonialVideo, setActiveTestimonialVideo] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Array<{ id: number; video: string; client_name: string; client_role?: string | null }>>([]);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const affiliateRef = useRef<HTMLDivElement>(null);
  const trustedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get("/api/testimonials");
        const rows = (resp?.data?.data ?? resp?.data ?? []) as Array<{ id: number; video: string; client_name: string; client_role?: string | null }>;
        if (mounted) setTestimonials(rows);
      } catch {
        if (mounted) setTestimonials([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [pageSize, setPageSize] = useState<number>(4);
  const totalPages = Math.max(1, Math.ceil(testimonials.length / pageSize));
  const currentTestimonials = testimonials.slice(testimonialPage * pageSize, testimonialPage * pageSize + pageSize);
  const canPrev = testimonialPage > 0;
  const canNext = testimonialPage < totalPages - 1;
  const prevTestimonialsPage = () => setTestimonialPage((p) => Math.max(0, p - 1));
  const nextTestimonialsPage = () => setTestimonialPage((p) => Math.min(totalPages - 1, p + 1));

  useEffect(() => {
    const computePageSize = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 640) {
        setPageSize(1);
      } else if (w < 1024) {
        setPageSize(2);
      } else {
        setPageSize(4);
      }
    };
    computePageSize();
    window.addEventListener("resize", computePageSize);
    return () => window.removeEventListener("resize", computePageSize);
  }, []);

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(testimonials.length / pageSize));
    setTestimonialPage((p) => Math.min(p, newTotalPages - 1));
  }, [pageSize, testimonials.length]);
  const toEmbedUrl = (raw: string | null | undefined) => {
    try {
      const u = (raw || '').trim();
      if (!u) return null;
      if (/youtu\.be\//i.test(u)) {
        const id = u.split('youtu.be/')[1]?.split(/[?&]/)[0];
        if (id) return `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&color=white`;
      }
      const ytWatch = u.match(/youtube\.com\/watch\?v=([^&]+)/i);
      if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&color=white`;
      const ytEmbed = u.match(/youtube\.com\/embed\/([^?&]+)/i);
      if (ytEmbed) return `https://www.youtube.com/embed/${ytEmbed[1]}?modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&color=white`;
      const ytShorts = u.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i);
      if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}?modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&color=white`;
      const vimeo = u.match(/vimeo\.com\/(\d+)/i);
      if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?title=0&byline=0&portrait=0&dnt=1`;
      const driveFile = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
      if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
      const driveOpen = u.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
      if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
      const driveUc = u.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/i);
      if (driveUc) return `https://drive.google.com/file/d/${driveUc[1]}/preview`;
      return null;
    } catch {
      return null;
    }
  };

  const isDriveUrl = (raw: string | null | undefined) => {
    try {
      const u = new URL((raw || '').trim());
      return /(^|\.)drive\.google\.com$/i.test(u.hostname);
    } catch {
      return /drive\.google\.com/i.test((raw || '').trim());
    }
  };

  const getDriveFileId = (raw: string | null | undefined) => {
    const u = (raw || '').trim();
    if (!u) return null;
    const fileMatch = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (fileMatch) return fileMatch[1];
    const openMatch = u.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
    if (openMatch) return openMatch[1];
    const ucMatch = u.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/i);
    if (ucMatch) return ucMatch[1];
    return null;
  };

  const toDriveDirectUrl = (raw: string | null | undefined) => {
    const id = getDriveFileId(raw);
    return id ? `/api/proxy/drive/file/${id}` : null;
  };

  const DrivePreview = ({ url, title }: { url: string; title?: string }) => {
    const [fallback, setFallback] = useState(false);
    const direct = toDriveDirectUrl(url);
    if (!direct) {
      return <div className="w-full h-full bg-slate-900" />;
    }
    return fallback ? (
      <div className="w-full h-full bg-slate-900" />
    ) : (
      <video
        src={direct}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 ease-out"
        muted
        loop
        playsInline
        onError={() => setFallback(true)}
      />
    );
  };

  const DrivePlayer = ({ url }: { url: string }) => {
    const [fallback, setFallback] = useState(false);
    const direct = toDriveDirectUrl(url);
    if (!direct || fallback) {
      return (
        <div className="w-[80vw] h-[80vh] max-w-full max-h-full rounded-2xl shadow-2xl bg-black flex items-center justify-center text-white/70">
          <span>Unable to load video from Drive</span>
        </div>
      );
    }
    return (
      <video
        src={direct}
        className="w-full h-full max-h-[85vh] object-contain mx-auto rounded-2xl shadow-2xl bg-black"
        controls
        autoPlay
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        disablePictureInPicture
        onError={() => setFallback(true)}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  const scrollToHowItWorks = () => {
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ScoreMachine",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Score Machine is an AI-powered credit analysis and reporting platform designed for professionals and businesses. Access structured insights, automated workflows, client management tools, and secure credit file organization—all built with compliance, accuracy, and clarity in mind.",
    "featureList": "AI-assisted credit file organization, Structured report summaries, Progress tracking and score timelines, Automated dispute letter generation, Professional client dashboard, Multi-client management tools, Secure data encryption (SOC 2 standards), White-label and branding options, Automated workflows for credit professionals, Real-time analytics and report insights, PDF export and summary tools, Compliance-focused credit data handling, Team and employee management, API access"
  };

  useGSAP(
    () => {
      if (loading) return;

      const tl = gsap.timeline();

      // Hero Text Entrance
      tl.fromTo(
        ".hero-text-item",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
        "-=0.5"
      );

      // Responsive Movement Setup using MatchMedia
      const mm = gsap.matchMedia();

      // --- Trusted By Stagger (Updated) ---
      // Desktop
      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: trustedRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        });
        
        tl.fromTo(trustedRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
        
        tl.fromTo(".trusted-item",
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: "back.out(1.2)" },
          "-=0.4"
        );
      });

      // Mobile
      mm.add("(max-width: 767px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: trustedRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        });
        
        tl.fromTo(trustedRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
        
        tl.fromTo(".trusted-item",
          { opacity: 0, y: 10, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        );
      });

      // --- Features Section ---
      const featuresTl = gsap.timeline({
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 75%",
        },
      });

      featuresTl
        .fromTo(
          ".features-header-item",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
        )
        .fromTo(
          ".feature-card",
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
          "-=0.4"
        );

      // --- How It Works ---
      const steps = gsap.utils.toArray(".step-item");
      steps.forEach((step: any, i) => {
        gsap.fromTo(
          step,
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 80%",
            },
            delay: i * 0.1,
          }
        );
      });

      // Laptop Opening Animation
      gsap.fromTo(
        ".laptop-lid",
        { rotationX: -100 }, // Start Closed
        {
          rotationX: 0, // Open
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".how-it-works-laptop",
            start: "top 65%",
          },
        }
      );

      // Laptop Container Entrance
      gsap.fromTo(
        ".how-it-works-laptop",
        { x: 50, opacity: 0, scale: 0.9 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#how-it-works",
            start: "top 70%",
          },
        }
      );

      // --- Testimonials ---
      gsap.fromTo(
        ".testimonial-card",
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: "top 75%",
          },
        }
      );

      // --- About Section ---
      gsap.fromTo(
        ".about-item",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: aboutRef.current,
            start: "top 75%",
          },
        }
      );

      // --- CTA Section ---
      gsap.fromTo(
        ".cta-element",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 70%",
          },
        }
      );

      // --- Affiliate Section ---
      gsap.fromTo(
        ".affiliate-anim",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: affiliateRef.current,
            start: "top 70%",
          },
        }
      );
    },
    { scope: containerRef, dependencies: [loading] }
  );
