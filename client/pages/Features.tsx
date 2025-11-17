import SiteHeader from "@/components/SiteHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Brain, FileText, TrendingUp, Zap, Users, BarChart3, CheckCircle, ArrowRight, Star, Award, Target, Lock, Globe, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteHeader />

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 rounded-full px-4 py-2 mb-6">
              <Award className="h-4 w-4 text-ocean-blue" />
              <span className="text-sm font-medium text-ocean-blue">Elite Credit Strategy Toolkit</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-ocean-blue to-sea-green bg-clip-text text-transparent mb-6">
              Unlock Your Credit Mastery
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-8">
              Whether you're in professional funding, business funding, or building your personal score, 
              Score Machine delivers everything you need to dominate the funding landscape with AI-powered precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-ocean-blue to-sea-green hover:shadow-lg transition-all duration-300 transform hover:scale-105" asChild>
                <Link to="/register" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Start Free Today
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue/5" asChild>
                <Link to="/pricing" className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" /> View Pricing Plans
                </Link>
              </Button>
            </div>

            {/* Value Proposition */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="text-3xl font-bold text-gray-900 mb-2">$572+ Value</div>
                  <div className="text-gray-600">Complete toolkit included FREE</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-sea-green mb-2">Starting at $147</div>
                  <div className="text-gray-600">Monthly subscription</div>
                </div>
                <div className="flex items-center gap-2 text-ocean-blue">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">No Setup Fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Complete Credit Arsenal</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade tools and insights that typically cost hundreds of dollars, 
              now included with your subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: "Progress Report with Score Timeline",
                description: "Track positive and negative changes month-to-month to measure growth and catch issues early.",
                value: "$97",
                color: "from-blue-500 to-blue-600",
                features: ["Monthly score tracking", "Trend analysis", "Issue detection", "Growth metrics"]
              },
              {
                icon: FileText,
                title: "Client Summary Export & PDF Download",
                description: "Share or save a professional-grade credit analysis and action plan in one sleek, printable document.",
                value: "$127",
                color: "from-emerald-500 to-emerald-600",
                features: ["Professional reports", "PDF export", "Client sharing", "Action plans"]
              },
              {
                icon: Brain,
                title: "Full AI Credit File Analysis",
                description: "AI scans every section of your credit report to highlight errors, risks, and strengths—so you know what lenders see before you apply.",
                value: "$147",
                color: "from-purple-500 to-purple-600",
                features: ["AI-powered analysis", "Error detection", "Risk assessment", "Strength identification"]
              },
              {
                icon: Shield,
                title: "Underwriting Blueprint — Are You Fundable?",
                description: "Go beyond scores with an underwriting-style review to reveal approval readiness and exactly what must change if it's not.",
                value: "$207",
                color: "from-orange-500 to-orange-600",
                features: ["Underwriting analysis", "Approval readiness", "Funding potential", "Improvement roadmap"]
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-0 shadow-lg overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardHeader className="pb-6 relative">
                  {/* Value Badge */}
                  <div className="absolute -top-3 -right-3">
                    <Badge className={`bg-gradient-to-r ${feature.color} text-white shadow-lg`}>
                      {feature.value}
                    </Badge>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 mb-3">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-sea-green" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Plus These Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in credit enhancement and business growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Lightning Fast Processing", desc: "Get results in seconds, not hours" },
              { icon: Lock, title: "Bank-Level Security", desc: "Your data is protected with enterprise encryption" },
              { icon: Users, title: "Multi-Client Management", desc: "Handle unlimited clients with ease" },
              { icon: Globe, title: "White Label Ready", desc: "Brand the platform as your own" },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights and performance metrics" },
              { icon: Target, title: "Goal Tracking", desc: "Set and monitor credit improvement targets" }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-ocean-blue to-sea-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Value Summary */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-ocean-blue via-sea-green to-ocean-blue" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/5 to-black/20" />
              
              <CardContent className="relative p-12 text-center text-white">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                    <Star className="h-4 w-4" />
                    <span className="text-sm font-medium">Complete Package</span>
                  </div>
                  
                  <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                    Over $572 in Value — Yours FREE!
                  </h3>
                  <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-6">
                    All toolkit items are included when you become an active paying subscriber. 
                    Plans start at only $147/month and toolkit items are delivered in your welcome email.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button size="lg" variant="secondary" className="bg-white text-ocean-blue hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                    <Link to="/register" className="flex items-center gap-2">
                      Get Started Free <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                    <Link to="/pricing">View All Plans</Link>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Cancel Anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Instant Access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}