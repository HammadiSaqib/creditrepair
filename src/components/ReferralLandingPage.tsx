import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Star, Users, Award, ArrowRight, Shield, Clock, TrendingUp, CreditCard, FileText, BarChart3, Phone, Mail, Globe, Zap, Target, DollarSign, Sparkles, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// (Keep local header; only add logo image to it)

interface AffiliateData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  totalReferrals: number;
  commissionRate: number;
  status: string;
}

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_users?: number;
  max_clients?: number;
  max_disputes?: number;
  sort_order?: number;
}

const ReferralLandingPage: React.FC = () => {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingFilter, setBillingFilter] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchAffiliateData = async () => {
      if (!affiliateId) {
        setError('Invalid referral link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/landing/affiliate/${encodeURIComponent(affiliateId)}/info`);
        const result = await response.json();

        if (result.success) {
          setAffiliate(result.data);
        } else {
          setError(result.error || 'Affiliate not found');
        }
      } catch (err) {
        console.error('Error fetching affiliate data:', err);
        setError('Failed to load referral information');
      } finally {
        setLoading(false);
      }
    };

    const fetchPricingPlans = async () => {
      try {
        const response = await fetch('/api/pricing/plans');
        const result = await response.json();

        if (result.success) {
          setPlans(result.data);
        } else {
          console.error('Failed to load pricing plans:', result.error);
        }
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchAffiliateData();
    fetchPricingPlans();
  }, [affiliateId]);

  const handleGetStarted = (planId?: number) => {
    // Store affiliate ID in localStorage for commission tracking
    if (affiliate) {
      localStorage.setItem('referralAffiliateId', affiliate.id);
      localStorage.setItem('referralAffiliateName', affiliate.name);
      localStorage.setItem('referralCommissionRate', affiliate.commissionRate.toString());
    }
    
    // Navigate to pricing page or register with affiliate reference and selected plan
    if (planId) {
      navigate(`/register?ref=${affiliate?.id}&plan=${planId}`);
    } else {
      navigate(`/pricing?ref=${affiliate?.id}`);
    }
  };

  const handleLearnMore = () => {
    // Store affiliate reference and navigate to main page
    if (affiliate) {
      localStorage.setItem('referralAffiliateId', affiliate.id);
      localStorage.setItem('referralAffiliateName', affiliate.name);
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral information...</p>
        </div>
      </div>
    );
  }

  if (error || !affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Referral Link</CardTitle>
            <CardDescription>{error || 'This referral link is not valid or has expired.'}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 border-b bg-white/95 backdrop-blur-sm sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <img
              src="/image.png"
              alt="Score Machine"
              className="w-10 h-10 rounded-xl shadow-lg object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
              ScoreMachine
            </span>
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Referred by {affiliate.firstName}
            </Badge>
            <Button variant="ghost" className="hover:text-ocean-blue" onClick={handleLearnMore}>
              Learn More
            </Button>
            <Button
              className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 shadow-lg"
              onClick={() => handleGetStarted()}
            >
              Get Started Free
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Referral Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 w-fit">
                    Referred by {affiliate.firstName}
                  </Badge>
                  <div className="grid gap-3">
                    <Button variant="ghost" onClick={handleLearnMore}>Learn More</Button>
                    <Button className="bg-gradient-to-r from-ocean-blue to-sea-green" onClick={() => handleGetStarted()}>Get Started Free</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-blue/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sea-green/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 text-ocean-blue border-ocean-blue/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Professional Dashboard Platform
              </Badge>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Powerful
                <span className="block bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                  Admin Dashboard
                </span>
                for Professionals
              </h1>

              {affiliate && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-ocean-blue/20 shadow-lg">
                  <p className="text-lg font-semibold text-ocean-blue mb-2">
                    Recommended by {affiliate.firstName} {affiliate.lastName}
                  </p>
                  {affiliate.companyName && (
                    <p className="text-sea-green font-medium">
                      {affiliate.companyName}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {affiliate.totalReferrals} referrals
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {affiliate.commissionRate}% commission
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Complete administrative platform with advanced client management, 
                automated reporting, and intelligent workflow optimization. 
                Built for professionals who manage funding operations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 shadow-xl"
                  onClick={() => handleGetStarted()}
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
                  onClick={handleLearnMore}
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Dashboard Demo
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-sea-green" />
                  <span className="text-sm font-medium">Multi-Client Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-sea-green" />
                  <span className="text-sm font-medium">Advanced Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-sea-green" />
                  <span className="text-sm font-medium">Automated Workflows</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg"
                  alt="Professional dashboard interface for funding management"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-xl p-4 border border-ocean-blue/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-ocean-blue to-sea-green rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Active Clients</div>
                    <div className="text-2xl font-bold text-sea-green">
                      247
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-sea-green/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-sea-green to-ocean-blue rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Success Rate</div>
                    <div className="text-2xl font-bold text-ocean-blue">
                      94.5%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-4 border-ocean-blue/20 text-ocean-blue"
            >
              Dashboard Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything You Need for
              <span className="block bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                Professional Management
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive administrative platform designed for funding professionals
              with cutting-edge management and automation tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-ocean-blue to-sea-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">
                  Multi-Client Management
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Advanced CRM with bulk operations, client segmentation, and 
                  automated progress tracking across unlimited client accounts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-sea-green to-ocean-blue rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Advanced Analytics</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Real-time dashboards with performance metrics, success rates,
                  revenue tracking, and comprehensive business intelligence
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-ocean-blue to-sea-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Workflow Automation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Smart automation for client onboarding, follow-ups, reminders,
                  and task management with predictive scheduling
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-sea-green to-ocean-blue rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Compliance Management</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Automated CROA/FCRA compliance monitoring with audit trails,
                  document management, and regulatory reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-ocean-blue to-sea-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Performance Tracking</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Comprehensive performance monitoring with KPI dashboards,
                  goal setting, and automated progress reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-sea-green to-ocean-blue rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">White Label Platform</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Complete white label solution with custom branding,
                  multi-tenant architecture, and integrated billing systems
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Capabilities Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-4 border-sea-green/20 text-sea-green"
            >
              Admin Capabilities
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Complete Administrative
              <span className="block bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                Control Center
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage your funding business operations
              from a single, powerful dashboard interface
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-ocean-blue to-sea-green rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Document Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Centralized document storage with automated organization,
                version control, and secure client file management
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-sea-green to-ocean-blue rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Revenue Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Real-time revenue tracking, commission calculations,
                and comprehensive financial reporting dashboards
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-ocean-blue to-sea-green rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Team Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                User role management, permission controls,
                and team performance monitoring tools
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-sea-green to-ocean-blue rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Communication Hub</h3>
              <p className="text-muted-foreground leading-relaxed">
                Integrated messaging system with automated notifications,
                client communication tracking, and email templates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-4 border-ocean-blue/20 text-ocean-blue bg-ocean-blue/5"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Professional Admin Plans
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Scale Your
              <span className="block bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                Funding Business
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional-grade administrative platform with advanced management tools
              designed for funding professionals and agencies
            </p>
          </div>

          {/* Billing Cycle Tabs */}
          <div className="flex justify-center mb-8">
            <Tabs value={billingFilter} onValueChange={(val) => setBillingFilter(val as 'monthly' | 'yearly')}>
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {plansLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pricing plans...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.filter(p => p.billing_cycle === billingFilter).map((plan, index) => (
                <Card key={plan.id} className={`group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                  index === 1 
                    ? 'bg-gradient-to-br from-ocean-blue to-sea-green text-white scale-105' 
                    : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-emerald-50'
                }`}>
                  {index === 1 && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-white text-ocean-blue px-4 py-2 shadow-lg font-semibold">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-6 pt-8">
                    <CardTitle className={`text-2xl font-bold mb-2 ${
                      index === 1 ? 'text-white' : 'text-gray-900'
                    }`}>
                      {plan.name}
                    </CardTitle>
                    <CardDescription className={`text-base leading-relaxed ${
                      index === 1 ? 'text-blue-100' : 'text-muted-foreground'
                    }`}>
                      {plan.description}
                    </CardDescription>
                    <div className="mt-6">
                      <span className={`text-5xl font-bold ${
                        index === 1 ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${plan.price}
                      </span>
                      <span className={`text-lg ml-1 ${
                        index === 1 ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        /{plan.billing_cycle}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                            index === 1 ? 'text-blue-200' : 'text-sea-green'
                          }`} />
                          <span className={`text-sm leading-relaxed ${
                            index === 1 ? 'text-blue-50' : 'text-gray-700'
                          }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleGetStarted(plan.id)}
                      className={`w-full py-3 font-semibold transition-all duration-300 ${
                        index === 1 
                          ? 'bg-white text-ocean-blue hover:bg-blue-50 hover:scale-105 shadow-lg' 
                          : 'bg-gradient-to-r from-ocean-blue to-sea-green text-white hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      Start Managing Clients
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {plans.filter(p => p.billing_cycle === billingFilter).length === 0 && (
                <div className="md:col-span-3 text-center text-gray-600">
                  No {billingFilter} plans available.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              See how our clients have transformed their credit scores
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "My credit score went from 520 to 720 in just 8 months! The team was professional and kept me updated throughout the process."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah M.</p>
                    <p className="text-sm text-gray-600">Verified Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Finally got approved for my dream home! ScoreMachine removed 15 negative items from my report."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold">MJ</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Michael J.</p>
                    <p className="text-sm text-gray-600">Verified Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The automated dispute process saved me so much time. Great platform and even better results!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">LR</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Lisa R.</p>
                    <p className="text-sm text-gray-600">Verified Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Improve Your Credit Score?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Thanks to {affiliate.firstName}'s referral, you're one step closer to better credit!
              </p>
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Your Funding Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold"> ScoreMachine</span>
          </div>
          <p className="text-gray-400 mb-4">
            Professional funding services you can trust
          </p>
          <p className="text-sm text-gray-500">
            Referred by: {affiliate.name} {affiliate.companyName && `• ${affiliate.companyName}`}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ReferralLandingPage;