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
import SiteHeader from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Users,
  FileText,
  Brain,
  Calendar,
  Shield,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Award,
  Play,
  Star,
  ChevronRight,
  Globe,
  Lock,
  Sparkles,
  DollarSign,
} from "lucide-react";

export default function Index() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50/30"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-ocean-blue/20 to-sea-green/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-gradient-to-l from-sea-green/15 to-ocean-blue/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-gradient-to-t from-ocean-blue/10 to-sea-green/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-ocean-blue rotate-45"></div>
          <div className="absolute bottom-40 right-32 w-24 h-24 border border-sea-green rotate-12"></div>
          <div className="absolute top-1/3 right-20 w-16 h-16 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              {loading ? (
                <>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-44" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-6">
                    <Skeleton className="h-14 w-3/4" />
                    <Skeleton className="h-14 w-2/3" />
                    <Skeleton className="h-10 w-1/2" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Skeleton className="h-14 w-56" />
                    <Skeleton className="h-14 w-56" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-ocean-blue/10">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 text-white border-ocean-blue/20 px-4 py-2 text-sm font-semibold"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-white" />
                      AI-Powered Intelligence
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-sea-green rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground font-medium">Live System</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tight">
                      <span className="block text-slate-900">Transform</span>
                      <span className="block bg-gradient-to-r from-ocean-blue via-sea-green to-ocean-blue bg-clip-text text-transparent animate-gradient bg-300% bg-pos-0">
                        Credit Intelligence
                      </span>
                      <span className="block text-slate-700 text-4xl lg:text-5xl font-bold mt-2">
                        with AI Precision
                      </span>
                    </h1>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed font-medium max-w-2xl">
                      Meet <span className="font-bold text-ocean-blue">Score Machine</span> — the revolutionary AI platform that 
                      <span className="bg-gradient-to-r from-sea-green to-ocean-blue bg-clip-text text-transparent font-semibold"> analyzes, optimizes, and accelerates</span> your credit journey.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                      From funding professionals to funding seekers, discover exactly where you stand 
                      and get a precise roadmap to financial success.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      size="lg"
                      className="text-lg px-10 py-7 bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 shadow-2xl hover:shadow-ocean-blue/25 transition-all duration-300 transform hover:scale-105 font-semibold"
                      asChild
                    >
                      <Link to="/login">
                        Start Free Analysis <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-10 py-7 border-2 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white transition-all duration-300 font-semibold"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      See It In Action
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                    <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-ocean-blue/10">
                      <div className="w-10 h-10 bg-gradient-to-r from-ocean-blue to-sea-green rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">FCRA Compliant</div>
                        <div className="text-xs text-muted-foreground">100% Ethical</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-sea-green/10">
                      <div className="w-10 h-10 bg-gradient-to-r from-sea-green to-ocean-blue rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">AI-Powered</div>
                        <div className="text-xs text-muted-foreground">Real-time Analysis</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-ocean-blue/10">
                      <div className="w-10 h-10 bg-gradient-to-r from-ocean-blue to-sea-green rounded-lg flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Proven Results</div>
                        <div className="text-xs text-muted-foreground">94.5% Success</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Enhanced Visual Section */}
            <div className="relative lg:pl-8">
              <div className="relative group">
                {loading ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <Skeleton className="w-full h-[650px] rounded-3xl" />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-ocean-blue to-sea-green rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                      <img
                        src="https://images.pexels.com/photos/5816286/pexels-photo-5816286.jpeg"
                        alt="Professional financial team collaborating on funding"
                        className="w-full h-[650px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Live Dashboard</div>
                              <div className="text-2xl font-bold text-slate-900">Credit Analysis Complete</div>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-r from-sea-green to-ocean-blue rounded-full flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Enhanced Floating Cards */}
              <div className="absolute -top-8 -left-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-ocean-blue/10 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Score Improvement</div>
                    <div className="text-3xl font-black text-sea-green flex items-center gap-1">
                      +127
                      <span className="text-sm font-medium text-muted-foreground">pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -right-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-sea-green/10 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-sea-green to-ocean-blue rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
                    <div className="text-3xl font-black text-ocean-blue flex items-center gap-1">
                      94.5
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 border border-ocean-blue/10 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ocean-blue to-sea-green rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Active Users</div>
                    <div className="text-xl font-bold text-slate-900">10K+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Section */}
      <section className="py-16 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-muted-foreground font-medium">
              Trusted by top performers in Credit & Funding
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-center">
              <div className="text-3xl font-bold text-ocean-blue">10K+</div>
              <div className="text-sm text-muted-foreground">Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-sea-green">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-ocean-blue">50M+</div>
              <div className="text-sm text-muted-foreground">
                Reports Processed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-sea-green">150+</div>
              <div className="text-sm text-muted-foreground">
                Avg. Score Boost
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sea-green/5 rounded-full blur-3xl"></div>
        
        {/* Geometric Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-32 left-1/4 w-4 h-4 bg-ocean-blue rotate-45"></div>
          <div className="absolute top-48 right-1/3 w-6 h-6 bg-sea-green rounded-full"></div>
          <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-ocean-blue rounded-full"></div>
          <div className="absolute bottom-48 right-1/4 w-5 h-5 bg-sea-green rotate-45"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 backdrop-blur-sm border border-ocean-blue/20 rounded-full px-6 py-3 mb-6">
              <Sparkles className="h-4 w-4 text-ocean-blue" />
              <span className="text-sm font-semibold text-ocean-blue">Credit Strategy Toolkit</span>
              <Sparkles className="h-4 w-4 text-sea-green" />
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              Unlock Elite Access to Your
              <span className="block bg-gradient-to-r from-ocean-blue via-blue-600 to-sea-green bg-clip-text text-transparent mt-2">
                Credit Strategy Toolkit
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Whether you're in professional funding, business funding, or building your own score, Score
              Machine gives you everything you need to dominate the credit game.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sea-green" />
                <span>AI-Powered Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sea-green" />
                <span>Professional Reports</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sea-green" />
                <span>Real-Time Tracking</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="group relative border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-6">
                    <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                    <Skeleton className="h-7 w-32 mt-4 rounded-full" />
                  </CardHeader>
                </Card>
              ))
            ) : (
              <>
                <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="pb-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-ocean-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-ocean-blue transition-colors">
                      Progress Report with Score Timeline
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      See how your credit profile evolves over time. Track positive and negative changes month-to-month so you can measure growth and catch issues early.
                    </CardDescription>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue/10 to-blue-100 rounded-full px-4 py-2">
                      <DollarSign className="h-4 w-4 text-ocean-blue" />
                      <span className="text-sm font-bold text-ocean-blue">Value: $97</span>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sea-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="pb-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-sea-green to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-sea-green transition-colors">
                      Client Summary Export & PDF Download
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      Easily share or save a professional-grade credit analysis. Download your entire file breakdown and action plan in one sleek, printable document.
                    </CardDescription>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-sea-green/10 to-emerald-100 rounded-full px-4 py-2">
                      <DollarSign className="h-4 w-4 text-sea-green" />
                      <span className="text-sm font-bold text-sea-green">Value: $127</span>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="pb-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-ocean-blue to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-ocean-blue transition-colors">
                      Full AI Credit File Analysis
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      Our AI scans every section of your credit report to highlight errors, risks, and strengths — helping you understand what lenders see before you apply.
                    </CardDescription>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue/10 to-blue-100 rounded-full px-4 py-2">
                      <DollarSign className="h-4 w-4 text-ocean-blue" />
                      <span className="text-sm font-bold text-ocean-blue">Value: $147</span>
                    </div>
                  </CardHeader>
                </Card>
                <Card className="group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sea-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="pb-6 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-sea-green to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-sea-green transition-colors">
                      Underwriting Blueprint — Are You Fundable?
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      Go beyond scores. Get a full underwriting-style review that reveals whether your file is ready for approval and exactly what needs to change if it's not.
                    </CardDescription>
                    <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-sea-green/10 to-emerald-100 rounded-full px-4 py-2">
                      <DollarSign className="h-4 w-4 text-sea-green" />
                      <span className="text-sm font-bold text-sea-green">Value: $207</span>
                    </div>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>

          {/* Enhanced Value Proposition */}
          <div className="text-center bg-gradient-to-r from-ocean-blue/5 via-blue-50/50 to-sea-green/5 rounded-3xl p-12 border border-ocean-blue/10 backdrop-blur-sm">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                  Total Value: Over $572
                </p>
                <p className="text-xl font-semibold text-slate-700">— Yours for FREE!</p>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Items are only free when you become an active paying software subscriber today. Starting at the lowest rate plan of only $147. After you subscribe, the items will be provided in your welcome email.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-sea-green" />
                  <span>Instant Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-sea-green" />
                  <span>No Setup Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-sea-green" />
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-sea-green" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-24 bg-gradient-to-br from-blue-50 to-emerald-50"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-4 border-sea-green/20 text-sea-green"
            >
              The Ultimate AI-Powered Enhancement Journey
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Transform Your Credit
              <span className="block bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                with Score Machine
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 1: Create a Free Account</h3>
                  <p className="text-muted-foreground">Get started in seconds.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 2: Choose Your Plan</h3>
                  <p className="text-muted-foreground">Only pay for what you use — starting at $24.99 per pull, or go unlimited.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 3: Enter Client Info & Connect MyFreeScoreNow</h3>
                  <p className="text-muted-foreground">The system pulls reports automatically and securely.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 4: Get Instant Results</h3>
                  <p className="text-muted-foreground">No guesswork. No waiting. See your report breakdown, score progress, and funding readiness right away.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/7821529/pexels-photo-7821529.jpeg"
                  alt="Professional analyzing credit reports"
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of successful funding professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white p-8">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "CreditRepairPro transformed our agency. We're processing 3x
                more clients with better results and complete automation."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold">
                  SR
                </div>
                <div>
                  <div className="font-semibold">Sarah Rodriguez</div>
                  <div className="text-sm text-muted-foreground">
                    CEO, Credit Solutions Inc.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white p-8">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "The AI dispute generator is incredible. Our success rate
                increased from 65% to 94% in just 3 months."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-sea-green to-ocean-blue rounded-full flex items-center justify-center text-white font-bold">
                  MC
                </div>
                <div>
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-muted-foreground">
                    Director, Elite Funding
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white p-8">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "White label solution allowed us to offer funding under
                our brand. Revenue increased 400% this year."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center text-white font-bold">
                  DJ
                </div>
                <div>
                  <div className="font-semibold">David Johnson</div>
                  <div className="text-sm text-muted-foreground">
                    Founder, Financial Freedom LLC
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-r from-ocean-blue to-sea-green text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5716037/pexels-photo-5716037.jpeg"
            alt="Team celebrating success"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-blue/80 via-blue-600/70 to-sea-green/80"></div>
        </div>
        
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        {/* Geometric Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 left-32 w-6 h-6 bg-white rotate-45"></div>
          <div className="absolute bottom-40 right-40 w-8 h-8 bg-white rounded-full"></div>
          <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-white rotate-45"></div>
          <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-white rounded-full"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-8 py-4 mb-8">
              <Lock className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-lg">Compliant. Accurate. Fundability-Ready.</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced Headline */}
            <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight">
              Ready to <span className="text-yellow-300">Understand</span>,
              <br />
              <span className="text-yellow-300">Fix</span>, and <span className="text-yellow-300">Fund</span> Your Credit?
            </h2>
            
            {/* Enhanced Description */}
            <p className="text-2xl opacity-95 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
              It's time to stop guessing and start executing with confidence. 
              <span className="block mt-2 text-yellow-200 font-semibold">Score Machine makes it easy, fast, and intelligent.</span>
            </p>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button
                size="lg"
                className="text-xl px-12 py-8 bg-white text-ocean-blue hover:bg-yellow-50 shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 font-bold border-0"
                asChild
              >
                <Link to="/login">
                  <Sparkles className="mr-3 h-6 w-6" />
                  Create Your Free Account 
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-8 border-2 border-white text-sea-green hover:bg-white hover:text-ocean-blue transition-all duration-300 transform hover:scale-105 font-bold backdrop-blur-sm"
              >
                <Play className="mr-3 h-6 w-6" />
                Watch Demo
              </Button>
            </div>
            
            {/* Enhanced Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/90 text-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate CTA Section */}
      <section className="bg-gradient-to-br from-sea-green via-emerald-600 to-ocean-blue py-32 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-white/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-24 left-24 w-8 h-8 bg-white rotate-45"></div>
          <div className="absolute bottom-32 right-32 w-6 h-6 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/5 w-4 h-4 bg-white rotate-45"></div>
          <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-white rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-8 py-4 mb-8">
              <DollarSign className="w-6 h-6 text-yellow-300" />
              <span className="text-white font-bold text-lg">Exclusive Affiliate Program</span>
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            </div>
            
            {/* Enhanced Headline */}
            <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 leading-tight">
              Earn Up to <span className="text-yellow-300 drop-shadow-lg">30% Commission</span>
              <span className="block text-4xl lg:text-5xl mt-4 font-bold text-white/90">
                Promoting CreditRepairPro
              </span>
            </h2>
            
            {/* Enhanced Description */}
            <p className="text-2xl text-white/95 mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
              Join our exclusive affiliate program and earn generous commissions by referring 
               funding professionals to our platform. 
              <span className="block mt-2 text-yellow-200 font-semibold">
                Get paid for every successful referral with our industry-leading commission rates.
              </span>
            </p>
            
            {/* Enhanced Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="group bg-white/15 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">High Commissions</h3>
                <p className="text-white/90 text-lg leading-relaxed">Earn up to 30% recurring commission on all referrals with transparent tracking</p>
              </div>
              
              <div className="group bg-white/15 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Target className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Easy Tracking</h3>
                <p className="text-white/90 text-lg leading-relaxed">Real-time dashboard with detailed analytics and comprehensive reporting tools</p>
              </div>
              
              <div className="group bg-white/15 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Premium Support</h3>
                <p className="text-white/90 text-lg leading-relaxed">Dedicated affiliate manager and professional marketing materials provided</p>
              </div>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button
                size="lg"
                className="text-xl px-12 py-8 bg-white text-ocean-blue hover:bg-yellow-50 shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 font-bold"
                asChild
              >
                <Link to="/join-affiliate">
                  <DollarSign className="mr-3 h-6 w-6" />
                  Join Affiliate Program
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-8 border-2 border-white text-sea-green hover:bg-white hover:text-ocean-blue transition-all duration-300 transform hover:scale-105 font-bold backdrop-blur-sm"
              >
                <BarChart3 className="mr-3 h-6 w-6" />
                Learn More About Commissions
              </Button>
            </div>
            
            {/* Enhanced Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/90 text-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>No signup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>Instant approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>Monthly payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-blue text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-ocean-blue to-sea-green rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">CreditRepairPro</span>
              </div>
              <p className="text-white/80 leading-relaxed">
                Professional funding CRM platform with AI-powered
                automation, compliance tools, and white label solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Product</h4>
              <ul className="space-y-3 text-white/80">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integration
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <Link to="/join-affiliate" className="hover:text-white transition-colors text-sea-green font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Affiliate Program
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    System Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              © 2024 CreditRepairPro. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
