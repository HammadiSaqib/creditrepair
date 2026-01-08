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
  Zap,
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
  Wifi,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);

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
    return <img src={thumb} alt={alt || ""} className={`w-full h-full object-cover ${className || ""}`} />;
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

      // --- Hero Entrance (No Needle Animation yet) ---
      tl.fromTo(
        ".gauge-container",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: "power3.out" }
      );

      // Hero Text Entrance
      tl.fromTo(
        ".hero-text-item",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
        "-=0.5"
      );

      // --- Master Scroll Animation (Needle + Parallax + Morph + Position) ---
      // This timeline spans the entire page scroll (0% to 100%)
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // Smooth scrubbing tied to scroll
        }
      });

      // Responsive Movement Setup using MatchMedia
      const mm = gsap.matchMedia();

      // Desktop Animation
      mm.add("(min-width: 1024px)", () => {
        // 0. Initial Hero State -> Docked State (0% -> 20% scroll)
        // Starts closer to text (x: -20vw), moves to fixed right position (x: 0)
        mainTl.fromTo(".speedometer-wrapper", 
          { xPercent: -40, scale: 1.1, yPercent: 0 }, // Hero State
          { xPercent: 0, scale: 0.9, yPercent: 0, duration: 0.2, ease: "power2.out" }, // Docked State
          0
        );
      });

      // Mobile Animation
      mm.add("(max-width: 1023px)", () => {
        // 0. Initial Hero State -> Docked State (0% -> 20% scroll)
        // Starts closer to text/center, moves to bottom right corner (but stays visible)
        mainTl.fromTo(".speedometer-wrapper",
          { scale: 0.65, yPercent: -5, xPercent: 0, transformOrigin: "bottom center" }, // Hero State
          { scale: 0.45, yPercent: 5, xPercent: 25, duration: 0.2, ease: "power2.out" }, // Docked State
          0
        );
      });

      // 1. Needle & Score (0% -> 80% of scroll)
      mainTl.to(".gauge-needle", {
        rotation: 130, // Target 850 score (-106 to 130)
        ease: "power1.inOut", // Smooth easing
        duration: 0.8,
        force3D: true, // Ensure GPU optimization
        onUpdate: function () {
          // Map progress (0-1) of this specific tween to score range
          const progress = this.progress();
          const score = Math.floor(350 + progress * 500); // 350 -> 850
          const scoreEl = document.querySelector(".gauge-score-text");
          if (scoreEl) scoreEl.textContent = score.toString();
        }
      }, 0);

      // 2. Horizontal Parallax (0% -> 100% of scroll)
      // Scroll down = move left (xPercent)
      mainTl.to(".hero-3d-container", {
        xPercent: -30, // Move 30% of width left by the end (responsive)
        ease: "none",
        duration: 1,
        force3D: true // Ensure GPU optimization
      }, 0);

      // 3. Morph to Credit Card (80% -> 100% of scroll)
      // We group these animations to start at 0.8 (80% scroll depth)
      const morphStart = 0.8;
      const morphDuration = 0.2; // Remaining 20%

      mainTl
        .to(".gauge-circle", {
          borderRadius: "16px",
          width: "340px",
          height: "210px",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", // Light theme gradient
          ease: "power2.inOut",
          duration: morphDuration
        }, morphStart)
        .to(".gauge-svg", { opacity: 0, scale: 0.5, duration: morphDuration * 0.5 }, morphStart)
        .to(".gauge-score-text-container", { opacity: 0, duration: morphDuration * 0.5 }, morphStart)
        .fromTo(".card-details", 
          { opacity: 0, scale: 0.9 }, 
          { opacity: 1, scale: 1, duration: morphDuration * 0.8, ease: "power2.out" }, 
          morphStart + (morphDuration * 0.2)
        )
        .to(".gauge-circle", {
          boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.1), 0 0 15px rgba(16, 185, 129, 0.1)", // Light shadow
          border: "1px solid rgba(0, 0, 0, 0.1)", // Light border
          duration: morphDuration * 0.5,
        }, morphStart);

      // Mouse Parallax for Hero
      const heroSection = heroRef.current;
      if (heroSection) {
        heroSection.addEventListener("mousemove", (e) => {
          const { clientX, clientY } = e;
          const xPos = (clientX / window.innerWidth - 0.5) * 20;
          const yPos = (clientY / window.innerHeight - 0.5) * 20;

          gsap.to(".hero-3d-container", {
            rotationY: xPos,
            rotationX: -yPos,
            duration: 1,
            ease: "power2.out",
          });
        });
      }

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

  return (
    <div ref={containerRef} className="min-h-screen bg-white overflow-x-hidden font-sans selection:bg-teal-400/20 text-slate-600">
      <Helmet>
        <title>Score Machine – AI-Powered Credit Analysis Platform</title>
        <meta name="description" content="Score Machine is the AI-powered credit analysis platform for professionals. Automate workflows, get structured insights, and manage clients securely." />
        <meta name="keywords" content="AI credit analysis tools, credit reporting software, credit file organization, credit industry platform, professional credit analytics, credit workflow automation, secure credit software, free credit score, AI-driven credit intelligence for lenders, credit card recommendations, Professional funding CRM software, how to fix credit report, FCRA compliant credit dispute system, VantageScore vs FICO, Underwriting Blueprint analysis for business funding, personal loan comparison, Automated fundability score check" />
        <link rel="canonical" href="https://scoremachine.com/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://scoremachine.com/" />
        <meta property="og:title" content="Score Machine – AI-Powered Credit Analysis Platform" />
        <meta property="og:description" content="Score Machine is the AI-powered credit analysis platform for professionals. Automate workflows, get structured insights, and manage clients securely." />
        <meta property="og:image" content="https://scoremachine.com/site-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://scoremachine.com/" />
        <meta property="twitter:title" content="Score Machine – AI-Powered Credit Analysis Platform" />
        <meta property="twitter:description" content="Score Machine is the AI-powered credit analysis platform for professionals. Automate workflows, get structured insights, and manage clients securely." />
        <meta property="twitter:image" content="https://scoremachine.com/site-image.png" />

        <script type="application/ld+json">
          {JSON.stringify({
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
            "description": "Score Machine is the AI-powered credit analysis platform for professionals. Automate workflows, get structured insights, and manage clients securely.",
            "featureList": "AI-assisted credit file organization, Structured report summaries, Progress tracking and score timelines, Automated dispute letter generation, Professional client dashboard, Multi-client management tools, Secure data encryption (SOC 2 standards), White-label and branding options, Automated workflows for credit professionals, Real-time analytics and report insights, PDF export and summary tools, Compliance-focused credit data handling, Team and employee management, API access"
          })}
        </script>
      </Helmet>
      {/* --- GLOBAL BACKGROUND PATTERN --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Light Base */}
        <div className="absolute inset-0 bg-slate-50"></div>
        
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>

        {/* Ambient Gradient Orbs - Light Theme Colors */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-200/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-200/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] bg-indigo-200/20 rounded-full blur-[100px]"></div>
      </div>

      <SiteHeader />

      {/* --- FIXED FLOATING GAUGE COMPONENT --- */}
      <div className="fixed inset-0 z-20 pointer-events-none flex items-end justify-center pb-4 lg:items-center lg:justify-end lg:pb-0 lg:pr-16 overflow-hidden">
        <div className="speedometer-wrapper relative h-[300px] w-[300px] lg:h-[400px] lg:w-[400px] flex items-center justify-center perspective-1000 pointer-events-auto">
          <div className="hero-3d-container relative preserve-3d will-change-transform">
            <div className="gauge-container gauge-circle relative w-[300px] h-[300px] rounded-full bg-white border border-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
              
              <svg className="gauge-svg absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100">
                <path
                  d="M 20 80 A 40 40 0 1 1 80 80"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 80 A 40 40 0 1 1 80 80"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="188"
                  strokeDashoffset="0"
                  className="drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                />
              </svg>

              <div className="gauge-svg absolute inset-0 flex items-center justify-center">
                <div className="gauge-needle w-1 h-32 bg-gradient-to-t from-slate-600 to-transparent origin-bottom absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-full will-change-transform" style={{ transform: 'rotate(-106deg)' }}>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rounded-full shadow-md"></div>
                </div>
                <div className="w-4 h-4 bg-slate-600 rounded-full z-10 shadow-lg"></div>
              </div>

              <div className="gauge-score-text-container absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Credit Score</div>
                <div className="gauge-score-text text-5xl font-bold text-slate-800 font-mono tracking-tighter">350</div>
              </div>

              <div className="card-details absolute inset-0 p-6 flex flex-col justify-between opacity-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                     </div>
                     <span className="font-bold text-slate-800 tracking-wider">SCORE MACHINE</span>
                  </div>
                  <Wifi className="text-slate-400 w-6 h-6 rotate-90" />
                </div>

                <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md border border-yellow-500/30 relative overflow-hidden">
                   <div className="absolute top-1/2 w-full h-[1px] bg-yellow-600/40"></div>
                   <div className="absolute left-1/3 h-full w-[1px] bg-yellow-600/40"></div>
                   <div className="absolute right-1/3 h-full w-[1px] bg-yellow-600/40"></div>
                </div>

                <div className="space-y-1">
                   <div className="flex gap-4 text-xl font-mono text-slate-600 tracking-widest">
                      <span>••••</span>
                      <span>••••</span>
                      <span>••••</span>
                      <span>8842</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                         <span className="block text-[10px]">Card Holder</span>
                         <span className="text-sm text-slate-800 font-medium">ALEX MORGAN</span>
                      </div>
                      <div className="text-slate-800 font-bold italic text-lg opacity-80">VISA</div>
                   </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none"></div>
              </div>

            </div>
            
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-slate-200 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-teal-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center pt-20 lg:pt-0 overflow-hidden">
        
        {/* Animated Background Layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <FallingMoney />
          
          {/* Gradient Fade at bottom to blend with next section */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-30">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
            {/* Text Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="hero-text-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-medium text-slate-700">Score Machine</span>
              </div>

              <h1 className="hero-text-item text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900">
                <span className="block">Next-Generation</span>
                <span className="block bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Credit Intelligence
                </span>
                <span className="block text-4xl lg:text-5xl mt-2 text-slate-700">for Professionals</span>
              </h1>

              <p className="hero-text-item text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Built for credit experts, funding consultants, and financial service providers who demand accuracy, clarity, and modern tools. Score Machine delivers advanced credit insights through structured analytics and innovative AI technology.
              </p>

                <div className="flex flex-col gap-2">
                  <div className="hero-text-item flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                    <Button
                      asChild
                      size="lg"
                      className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20 transition-all duration-300 border-0"
                    >
                      <Link to="/signup">
                        Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 px-8 text-lg rounded-full border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      onClick={scrollToHowItWorks}
                    >
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Watch Demo
                    </Button>
                  </div>
                  <p className="hero-text-item text-xs text-slate-500 italic lg:ml-2 mt-2 max-w-md leading-relaxed">
                    Create a free account — no credit card required. Enjoy 14-day access with limited report visibility. Full report access and pulls are billed individually. Cancel anytime.
                  </p>
                </div>
            </div>

            {/* Visual Content - Placeholder for Layout */}
            <div className="hidden lg:block">
               {/* The gauge is now fixed/floating above */}
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUSTED BY / SOCIAL PROOF --- */}
      <section ref={trustedRef} className="trusted-section py-16 border-y border-slate-100 relative z-10 bg-slate-50/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Trusted by Credit & Funding Professionals Nationwide</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Used by thousands of industry practitioners seeking reliable, structured, and efficient credit analysis tools.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { val: "Nationwide", label: "Professional Use", color: "text-teal-600" },
              { val: "Extensive", label: "Report Processing Capability", color: "text-emerald-600" },
              { val: "Industry", label: "Grade Technology", color: "text-teal-600" },
              { val: "Advanced", label: "AI-Driven Insights", color: "text-emerald-600" },
            ].map((stat, i) => (
              <div key={i} className="trusted-item group relative p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-default">
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 text-center">
                  <div className={`text-2xl lg:text-3xl font-black ${stat.color} mb-2 transform group-hover:scale-105 transition-transform duration-300 drop-shadow-sm`}>
                    {stat.val}
                  </div>
                  <div className="text-xs lg:text-sm text-slate-500 font-bold uppercase tracking-wide">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-12 italic">
            (All metrics represent platform capacity and usage trends, not guaranteed performance or results.)
          </p>
        </div>
      </section>

      {/* --- CREDIT STRATEGY TOOLKIT (FEATURES) --- */}
      <section ref={featuresRef} id="features" className="py-32 relative z-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="features-header-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-sm font-bold mb-6 border border-teal-100">
              <Sparkles className="h-4 w-4" /> CREDIT STRATEGY TOOLKIT
            </div>
            <h2 className="features-header-item text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Professional <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                Credit Strategy Toolkit
              </span>
            </h2>
            <p className="features-header-item text-lg text-slate-500">
              Tools designed to help credit professionals and clients better understand, organize, and evaluate credit information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                title: "Progress Report & Score Timeline",
                desc: "Visualize how key credit data points evolve over time for clearer decision-making.",
                icon: TrendingUp,
                color: "from-blue-500 to-blue-600",
                val: "$97",
                accent: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                title: "Client Summary Export & PDF",
                desc: "Generate clean, organized, professional summaries with one click.",
                icon: FileText,
                color: "from-emerald-500 to-emerald-600",
                val: "$127",
                accent: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                title: "Comprehensive AI Credit Analysis",
                desc: "Advanced AI highlights patterns, trends, and areas that may require attention — all in a structured and readable format.",
                icon: Brain,
                color: "from-indigo-500 to-indigo-600",
                val: "$147",
                accent: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                title: "Underwriting Overview",
                desc: "Provides a general readiness overview based on commonly used lending and compliance factors.",
                note: "Not a guarantee of credit or funding approval.",
                icon: Shield,
                color: "from-purple-500 to-purple-600",
                val: "$207",
                accent: "text-purple-600",
                bg: "bg-purple-50"
              }
            ].map((feat, i) => (
              <Card key={i} className="feature-card border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white shadow-md mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <feat.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl font-bold mb-3 text-slate-800 group-hover:text-teal-600 transition-colors">{feat.title}</CardTitle>
                  <CardDescription className="text-slate-500 leading-relaxed">
                    {feat.desc}
                    {feat.note && <span className="block mt-2 text-xs italic opacity-80">{feat.note}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${feat.bg} ${feat.accent} text-sm font-bold border border-slate-100`}>
                    <DollarSign className="h-3 w-3" /> Comparable value: {feat.val}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mb-8 -mt-8 italic">
            Comparable values are internal estimates based on similar professional tools and do not indicate retail pricing or discounts.
          </p>

          <div className="text-center mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100">
             <h3 className="text-xl font-bold text-slate-800 mb-4">Included With Every Paid Subscription</h3>
             <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600">
                {["No setup fees", "Cancel anytime", "Full access immediately after subscribing"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> {item}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* --- THE JOURNEY (HOW IT WORKS) --- */}
      <section ref={howItWorksRef} id="how-it-works" className="py-24 relative z-10 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-600 bg-emerald-50">
              THE JOURNEY
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900">
              Transform the Way You <span className="text-teal-600">Understand Credit</span>
            </h2>
            <p className="text-slate-500 mt-4 text-lg">Score Machine streamlines the entire process of reviewing and organizing credit information.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 lg:block hidden"></div>

              {[
                { step: "1", title: "Create a Free Account", desc: "Start in seconds." },
                { step: "2", title: "Choose Your Plan", desc: "Pay only for what you need — per-pull or unlimited options." },
                { step: "3", title: "Connect Securely", desc: "Reports are pulled automatically from MyFreeScoreNow through secure integration." },
                { step: "4", title: "Access Clear, Structured Results", desc: "View organized insights, credit factors, and readiness indicators instantly." }
              ].map((item, i) => (
                <div key={i} className="step-item flex gap-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white border border-teal-500 text-teal-600 font-bold text-xl flex items-center justify-center shadow-md shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="how-it-works-laptop relative w-full max-w-[600px] mx-auto lg:mr-0 [perspective:2000px]">
              <div className="laptop-wrapper relative w-full aspect-[16/10] [transform-style:preserve-3d] group">
                
                {/* Base (Keyboard area) - Light Theme */}
                <div className="absolute bottom-0 w-full h-[1.5rem] bg-slate-200 rounded-b-2xl shadow-2xl z-10 origin-top [transform:rotateX(12deg)] border-t border-slate-300 flex items-center justify-center [transform-style:preserve-3d]">
                   <div className="w-1/3 h-[4px] bg-slate-300 rounded-full mt-2"></div>
                </div>

                {/* Lid (Screen) - Light Theme */}
                <div className="laptop-lid absolute inset-0 origin-bottom bg-slate-800 rounded-t-2xl border-[6px] border-slate-200 shadow-2xl [transform-style:preserve-3d] flex items-center justify-center overflow-hidden"
                     style={{ transform: 'rotateX(-100deg)' }}
                >
                  {/* Screen Content */}
                  <div className="relative w-full h-full bg-black overflow-hidden rounded-lg">
                    {!videoPlaying ? (
                       <div className="absolute inset-0 cursor-pointer group" onClick={() => setVideoPlaying(true)}>
                          <img 
                            src="https://img.youtube.com/vi/4KwPYMarpbo/maxresdefault.jpg" 
                            alt="Score Machine Pro Full Walkthrough (2025)" 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                             <div className="w-20 h-20 bg-teal-500/90 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.5)] transform group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                <Play className="w-8 h-8 text-white fill-current ml-1" />
                             </div>
                          </div>
                       </div>
                    ) : (
                       <iframe 
                         width="100%" 
                         height="100%" 
                         src="https://www.youtube.com/embed/4KwPYMarpbo?autoplay=1&rel=0" 
                         title="Score Machine Pro Full Walkthrough (2025)" 
                         frameBorder="0" 
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                         allowFullScreen
                         className="w-full h-full"
                       ></iframe>
                    )}
                  </div>
                  
                  {/* Webcam */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-600 rounded-full z-20 shadow-inner"></div>
                </div>
                
              </div>
              
              {/* Ambient Glow - Light Theme */}
              <div className="absolute -z-10 bottom-[-40px] left-1/2 -translate-x-1/2 w-[120%] h-[60px] bg-teal-500/10 blur-[50px] rounded-[100%] animate-pulse"></div>
              
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section ref={testimonialsRef} className="py-24 relative z-10 bg-slate-50 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-slate-900 tracking-tight">
              Trusted by Industry Leaders
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              See what top professionals are saying about their experience with Score Machine Pro.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {currentTestimonials.map((t) => {
              const src = `/${t.video.replace(/^public[\\/]/, "").replace(/\\/g, "/")}`;
              return (
                <div
                  key={t.id}
                  className="testimonial-card group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 cursor-pointer w-[280px] sm:w-[300px] lg:w-[320px]"
                  onClick={() => setActiveTestimonialVideo(src)}
                >
                  <div className="relative aspect-[9/16] bg-slate-900">
                    <VideoThumbnail
                      src={src}
                      alt={t.client_name}
                      className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                        <Play className="w-6 h-6 text-teal-600 fill-current ml-1" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
                    <h3 className="font-bold text-lg leading-tight mb-1">{t.client_name}</h3>
                    <p className="text-sm text-teal-200 font-medium opacity-90">{t.client_role || ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-12 italic opacity-70">
            Disclosure: Individual experiences vary. These testimonials reflect personal opinions and workflow benefits, not guaranteed results.
          </p>
        </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={prevTestimonialsPage}
                  disabled={!canPrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-slate-500">
                  Page {Math.min(testimonialPage + 1, totalPages)} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={nextTestimonialsPage}
                  disabled={!canNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

        {/* Video Modal */}
        {activeTestimonialVideo &&
          createPortal(
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setActiveTestimonialVideo(null)}>
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-3xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setActiveTestimonialVideo(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <video
                  src={activeTestimonialVideo}
                  className="w-full h-full max-h-[85vh] object-contain mx-auto"
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  playsInline
                  disablePictureInPicture
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>,
            document.body
          )}
      </section>

      {/* --- ABOUT THE PLATFORM --- */}
      <section ref={aboutRef} className="py-24 bg-slate-50 relative z-10">
        <div className="container mx-auto px-4 text-center max-w-4xl">
           <h2 className="about-item text-3xl lg:text-4xl font-bold mb-6 text-slate-900">Built for Professional Accuracy and Compliance</h2>
           <p className="about-item text-lg text-slate-600 mb-10">
             Score Machine is designed to meet the needs of modern financial professionals. Our system is built with:
           </p>
           
           <div className="about-item flex flex-wrap justify-center gap-4 mb-12">
              {["Secure data handling", "Clear, structured analysis", "AI-enhanced insight generation", "Professional-grade reporting", "Compliance-aware methodology"].map((item, i) => (
                 <div key={i} className="px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-slate-700 font-medium">
                    {item}
                 </div>
              ))}
           </div>
           
           <div className="about-item">
              <p className="text-2xl font-bold text-teal-600 mb-8">Get the clarity you need to make informed decisions — without guessing.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8">
                    <Link to="/signup">Create Free Account</Link>
                 </Button>
                 <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-teal-600 rounded-full px-8" onClick={scrollToHowItWorks}>
                    Watch Demo
                 </Button>
              </div>
              <div className="mt-6 text-sm text-slate-600 max-w-xl mx-auto bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-slate-100 shadow-sm">
                 <p className="font-medium mb-1">Create a free account — no credit card required.</p>
                 <p>Enjoy 14-day access with limited report visibility.</p>
                 <p className="text-xs text-slate-500 mt-1">Full report access and pulls are billed individually. Cancel anytime.</p>
              </div>
           </div>
        </div>
      </section>

      {/* --- AFFILIATE PROGRAM --- */}
      <section ref={affiliateRef} className="py-24 bg-gradient-to-br from-teal-900 to-slate-900 relative overflow-hidden text-white">
        {/* Dark theme specifically for this section to make it pop */}
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="affiliate-anim inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8">
            <span className="font-bold">AFFILIATE PROGRAM</span>
          </div>
          
          <h2 className="affiliate-anim text-4xl lg:text-6xl font-black mb-6">
            Exclusive <span className="text-teal-400">Affiliate Partner Program</span>
          </h2>
          
          <p className="affiliate-anim text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Earn recurring commissions by referring professionals to Score Machine.
          </p>
          
          <div className="affiliate-anim grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Up to 30% Commission", desc: "Up to 30% commission on active subscriber referrals.", icon: DollarSign },
              { title: "Real-Time Analytics", desc: "Track clicks, conversions, and payouts.", icon: BarChart3 },
              { title: "SmartLink Included", desc: "Easy, profitable traffic monetization. Turn clicks into commissions.", icon: MousePointer2 },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/5 p-8 rounded-2xl hover:bg-white/10 transition-colors text-left">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 affiliate-anim">
            <Button asChild variant="outline" className="border-teal-500/30 text-black hover:bg-teal-900/30 hover:text-teal-200">
              <Link to="/affiliate/login">Access Affiliate Portal & Materials</Link>
            </Button>
          </div>
          
          <p className="affiliate-anim text-xs text-slate-500 mt-12 italic max-w-2xl mx-auto">
             Disclosure: Affiliates must comply with company advertising guidelines and may not make credit improvement promises or financial guarantees.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
