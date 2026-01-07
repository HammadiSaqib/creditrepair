import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Users, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';
// WebSocket removed to eliminate connection errors
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '@/components/SiteHeader';
import { pricingApi } from '@/lib/api';
import Footer from '@/components/Footer';

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  max_users?: number;
  max_clients?: number;
  max_disputes?: number;
  sort_order: number;
}

const formatPrice = (price: number | string, cycle: string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return '$0';
  }
  if (cycle === 'lifetime') {
    return `$${numPrice.toFixed(2)}`;
  }
  return `$${numPrice.toFixed(2)}/${cycle === 'monthly' ? 'mo' : 'yr'}`;
};

const getBillingCycleColor = (cycle: string) => {
  switch (cycle) {
    case 'monthly': return 'bg-blue-100 text-blue-800';
    case 'yearly': return 'bg-green-100 text-green-800';
    case 'lifetime': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPopularPlan = (plans: PricingPlan[]) => {
  // Find the middle-priced plan or the one with most features
  if (plans.length === 0) return null;
  if (plans.length === 1) return plans[0].id;
  if (plans.length === 2) return plans[1].id;
  
  // For 3+ plans, return the middle one
  const sortedByPrice = [...plans].sort((a, b) => a.price - b.price);
  const middleIndex = Math.floor(sortedByPrice.length / 2);
  return sortedByPrice[middleIndex].id;
};

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Real-time functionality removed
  const [popularPlanId, setPopularPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const maxRetries = 3;

  // WebSocket functionality removed to eliminate connection errors

  const fallbackPlans: PricingPlan[] = [
    {
      id: 1,
      name: 'Starter',
      description: 'Solo professionals getting started',
      price: 49,
      billing_cycle: 'monthly',
      features: ['Progress Report + Timeline', 'Client Summary PDF', 'AI Credit Analysis', 'Underwriting Overview'],
      max_users: 1,
      max_clients: 25,
      max_disputes: 50,
      sort_order: 1,
    },
    {
      id: 2,
      name: 'Professional',
      description: 'Growing teams needing more capacity',
      price: 147,
      billing_cycle: 'monthly',
      features: ['Progress Report + Timeline', 'Client Summary PDF', 'AI Credit Analysis', 'Underwriting Overview'],
      max_users: 5,
      max_clients: 250,
      max_disputes: 500,
      sort_order: 2,
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'Agencies requiring scale and support',
      price: 297,
      billing_cycle: 'monthly',
      features: ['Progress Report + Timeline', 'Client Summary PDF', 'AI Credit Analysis', 'Underwriting Overview'],
      max_users: null,
      max_clients: null,
      max_disputes: null,
      sort_order: 3,
    },
  ];

  // Load pricing plans from API with retry logic
  const loadPlans = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      const response = await fetch('/api/pricing/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid content type: ${contentType || 'unknown'}; received: ${text.slice(0, 60)}...`);
      }
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Filter only active plans for public display
        const activePlans = data.data.filter((plan: any) => plan.is_active !== false);
        const sortedPlans = activePlans.sort((a: PricingPlan, b: PricingPlan) => a.sort_order - b.sort_order);
        
        setPlans(sortedPlans);
        setPopularPlanId(getPopularPlan(sortedPlans));
        setError(null);
        setRetryCount(0);
        
        console.log(`✅ Loaded ${sortedPlans.length} pricing plans`);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      // Fallback: show predefined plans so page remains functional
      setPlans(fallbackPlans);
      setPopularPlanId(getPopularPlan(fallbackPlans));
      
      // Implement retry logic
      if (retryCount < maxRetries && !errorMessage.includes('timeout')) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadPlans(true);
        }, delay);
      } else {
        toast.error('Unable to load live pricing plans. Showing defaults.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Manual retry function
  const handleRetry = () => {
    setRetryCount(0);
    loadPlans();
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSelectPlan = (plan: PricingPlan) => {
    // Redirect to registration page with selected plan
    const planData = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      billing_cycle: plan.billing_cycle
    };
    
    // Store plan data in sessionStorage for the registration page
    sessionStorage.setItem('selectedPlan', JSON.stringify(planData));
    
    // Navigate to registration page
    navigate('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Retry attempt {retryCount}/{maxRetries}</p>
          )}
        </div>
      </div>
    );
  }
  
  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Pricing</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Pricing Plans - Score Machine | Professional Credit Analysis Tools</title>
        <meta name="description" content="Explore transparent pricing for Score Machine’s AI-powered credit analysis tools. Access automated workflows, progress tracking, client dashboards, report summaries, and secure credit data organization. No credit improvement or funding outcomes are implied or guaranteed." />
        <link rel="canonical" href="https://scoremachine.com/pricing" />
      </Helmet>
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-blue-600/10 to-emerald-600/10 text-blue-600 border-blue-600/20"
            >
              <Zap className="w-4 h-4 mr-2" />
              Plans that unlock your Toolkit
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Unlock Your
              <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Credit Strategy Toolkit
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Activate any subscription to unlock our full AI-powered Toolkit: Progress Report + Score Timeline, Client Summary PDF, Full AI Credit File Analysis, and the Underwriting Blueprint. Your tools are delivered in the welcome email after you subscribe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xl"
              >
                Subscribe & Unlock
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                View Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 pt-4 justify-center">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Toolkit included with active subscription</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Delivered via welcome email after you subscribe</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">Structured, informative analysis to help you review credit data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connection Status Banner */}
      {error && plans.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Connection Issue</h4>
                <p className="text-sm text-yellow-700">Real-time updates may be delayed. Showing cached plans.</p>
              </div>
              <Button onClick={handleRetry} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Yearly
                  <Badge className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs">
                    2 months free
                  </Badge>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.length === 0 && !error ? (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No plans available</h3>
                <p className="text-gray-600">Please check back later for available pricing plans.</p>
              </div>
            ) : (
              plans.filter(plan => 
                billingCycle === 'monthly' 
                  ? plan.billing_cycle === 'monthly' || plan.billing_cycle === 'lifetime'
                  : plan.billing_cycle === 'yearly' || plan.billing_cycle === 'lifetime'
              ).map((plan) => {
                const isPopular = plan.id === popularPlanId;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      isPopular 
                        ? 'ring-2 ring-blue-600 shadow-xl scale-105' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-center py-2 text-sm font-medium">
                        🌟 Most Popular
                      </div>
                    )}
                    
                    <CardHeader className={`text-center ${isPopular ? 'pt-12' : 'pt-6'}`}>
                      <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                          isPopular 
                            ? 'bg-gradient-to-r from-blue-600 to-emerald-600' 
                            : 'bg-gradient-to-r from-gray-100 to-gray-200'
                        }`}>
                          <Users className={`h-8 w-8 ${isPopular ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                      </div>
                      
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        {plan.description}
                      </CardDescription>
                      
                      <div className="mt-6">
                        <div className="text-5xl font-bold">
                          {formatPrice(plan.price, plan.billing_cycle)}
                        </div>
                        <Badge 
                          className={`mt-2 ${getBillingCycleColor(plan.billing_cycle)}`}
                          variant="secondary"
                        >
                          {plan.billing_cycle}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {Array.isArray(plan.features) ? plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        )) : null}
                      </div>
                      
                      {(plan.max_users || plan.max_clients || plan.max_disputes) && (
                        <div className="border-t pt-4 space-y-2">
                          {plan.max_users && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Max Users:</span>
                              <span className="font-medium">{plan.max_users}</span>
                            </div>
                          )}
                          {plan.max_clients && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Max Clients:</span>
                              <span className="font-medium">{plan.max_clients}</span>
                            </div>
                          )}
                          {plan.max_disputes && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Max Disputes:</span>
                              <span className="font-medium">{plan.max_disputes}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        disabled={purchasing === plan.id}
                        className={`w-full py-6 text-lg font-medium ${
                          isPopular
                            ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg'
                            : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                        }`}
                        variant={isPopular ? 'default' : 'outline'}
                      >
                        {purchasing === plan.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          'Get Started'
                        )}
                      </Button>
                      <p className="text-xs text-center text-gray-500 mt-2">Charges apply per report pull. Unlimited access is optional.</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
       <section className="py-16 bg-gray-50/50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-4xl font-bold mb-4">Compare Plans</h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               See what's included in each plan to find the perfect fit for your business needs.
             </p>
           </div>

           <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full">
                 <thead className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                   <tr>
                     <th className="px-6 py-4 text-left font-semibold">Features</th>
                     {plans.map((plan) => (
                       <th key={plan.id} className="px-6 py-4 text-center font-semibold">
                         {plan.name}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200">
                   <tr className="bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">Price</td>
                     {plans.map((plan) => (
                       <td key={plan.id} className="px-6 py-4 text-center font-bold text-2xl">
                         {formatPrice(plan.price, plan.billing_cycle)}
                       </td>
                     ))}
                   </tr>
                   <tr>
                     <td className="px-6 py-4 font-medium text-gray-900">Max Users</td>
                     {plans.map((plan) => (
                       <td key={plan.id} className="px-6 py-4 text-center">
                         {plan.max_users || 'Unlimited'}
                       </td>
                     ))}
                   </tr>
                   <tr className="bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">Max Clients</td>
                     {plans.map((plan) => (
                       <td key={plan.id} className="px-6 py-4 text-center">
                         {plan.max_clients || 'Unlimited'}
                       </td>
                     ))}
                   </tr>
                   {/* Feature rows */}
                  {['Credit Report Analysis', 'Client Portal', 'Progress Tracking', 'Priority Support'].map((feature, index) => (
                    <tr key={feature} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 font-medium text-gray-900">{feature}</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center">
                          <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        </td>
                      ))}
                    </tr>
                  ))}
                 </tbody>
               </table>
             </div>
           </div>
         </div>
       </section>

       {/* Testimonials */}
       <section className="py-16 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               Join thousands of funding professionals who trust Score Machine.
             </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
             <Card className="p-6">
               <div className="flex items-center mb-4">
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                       <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                     </svg>
                   ))}
                 </div>
               </div>
               <blockquote className="text-gray-700 mb-4">
                 "Score Machine helps streamline credit review workflows and client management, according to our users."
               </blockquote>
               <div className="flex items-center">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                   S
                 </div>
                 <div className="ml-3">
                   <p className="font-semibold text-gray-900">Sarah Johnson</p>
                   <p className="text-sm text-gray-600">CEO, Credit Solutions Inc.</p>
                 </div>
               </div>
             </Card>

             <Card className="p-6">
               <div className="flex items-center mb-4">
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                       <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                     </svg>
                   ))}
                 </div>
               </div>
               <blockquote className="text-gray-700 mb-4">
                 "The automation features help us stay organized. Our team can focus on what matters most - supporting our clients."
               </blockquote>
               <div className="flex items-center">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                   M
                 </div>
                 <div className="ml-3">
                   <p className="font-semibold text-gray-900">Michael Rodriguez</p>
                   <p className="text-sm text-gray-600">Founder, Funding Experts</p>
                 </div>
               </div>
             </Card>

             <Card className="p-6">
               <div className="flex items-center mb-4">
                 <div className="flex text-yellow-400">
                   {[...Array(5)].map((_, i) => (
                     <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                       <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                     </svg>
                   ))}
                 </div>
               </div>
               <blockquote className="text-gray-700 mb-4">
                 "Professional, reliable, and incredibly user-friendly. Score Machine has the tools we need to manage our business efficiently."
               </blockquote>
               <div className="flex items-center">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                   L
                 </div>
                 <div className="ml-3">
                   <p className="font-semibold text-gray-900">Lisa Chen</p>
                   <p className="text-sm text-gray-600">Director, Premier Credit Services</p>
                 </div>
               </div>
             </Card>
           </div>
           <p className="text-xs text-gray-400 mt-6 text-center italic">Results may vary. Testimonials reflect individual experiences and are not guarantees of similar outcomes.</p>
         </div>
       </section>

       {/* FAQ Section */}
       <section className="py-16 bg-gray-50/50">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
             <p className="text-xl text-gray-600">
               Get answers to common questions about our pricing and features.
             </p>
           </div>

           <div className="space-y-6">
             <Card className="p-6">
               <h3 className="text-lg font-semibold mb-2">Can I change my plan at any time?</h3>
               <p className="text-gray-600">
                 Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.
               </p>
             </Card>

             <Card className="p-6">
               <h3 className="text-lg font-semibold mb-2">Is there a free trial available?</h3>
               <p className="text-gray-600">
                 Create a free account to explore the platform for 14 days. Limited access included. Full report access requires a paid plan.
               </p>
             </Card>

             <Card className="p-6">
               <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
               <p className="text-gray-600">
                 We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and ACH bank transfers for annual plans.
               </p>
             </Card>

             <Card className="p-6">
               <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
               <p className="text-gray-600">
                 All purchases are non-refundable. You may cancel at any time to prevent future charges, and your access will remain available through the end of your current billing period.
               </p>
             </Card>

             <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">What kind of support do you provide?</h3>
              <p className="text-gray-600">
                We provide support between 11:00 AM and 8:00 PM. Email support is available for all plans, with priority support and phone access for higher-tier plans. Our team typically responds within 2–4 hours during support hours.
              </p>
             </Card>
           </div>
         </div>
       </section>

      {/* Compliance & Transparency */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-6">Transparent product information and responsible marketing</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-emerald-600" />
                <span className="font-semibold">No outcome guarantees</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="font-semibold">Clear plan details</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="font-semibold">Results may vary</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 italic">
              We provide software tools and informational insights. We do not promise credit improvement, funding approvals, or specific financial outcomes.
            </p>
          </div>
        </div>
      </section>
       
       <div className="py-8 bg-gray-50 text-center px-4">
         <p className="text-xs text-gray-500 max-w-4xl mx-auto leading-relaxed">
           Score Machine provides tools for organizing and reviewing credit report information. It does not guarantee credit improvement, funding approval, or specific financial outcomes. All insights are for informational purposes only. Comparable values represent internal estimates, not retail pricing.
         </p>
       </div>
       <Footer />
    </div>
  );
}
