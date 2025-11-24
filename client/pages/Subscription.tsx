import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { billingApi, getAuthToken, pricingApi, superAdminApi } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import PaymentForm from '../components/PaymentForm';
import BillingHistory from '../components/BillingHistory';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  FileText,
  Settings,
  Crown,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'pending' | 'expired' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  billing_cycle: 'monthly' | 'yearly';
  plan: SubscriptionPlan;
}

// Initialize Stripe with dynamic configuration
let stripePromise: Promise<any> | null = null;

const getStripePromise = async () => {
  if (!stripePromise) {
    try {
      // Try to get Stripe config from backend first
      const response = await billingApi.getStripeConfig();
      const publishableKey = response.data?.publishableKey;
      
      if (publishableKey) {
        console.log('✅ Using Stripe publishable key from backend');
        stripePromise = loadStripe(publishableKey);
      } else {
        // Fallback to environment variable
        console.log('⚠️ Using fallback Stripe publishable key from environment');
        stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
      }
    } catch (error) {
      console.error('❌ Error fetching Stripe config, using fallback:', error);
      // Fallback to environment variable
      stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
    }
  }
  return stripePromise;
};

const SubscriptionContent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
    planName: string;
  } | null>(null);
  const [billingFilter, setBillingFilter] = useState<'monthly' | 'yearly'>('monthly');

  // Enhanced plan data with better descriptions and icons
  const enhancedPlans: SubscriptionPlan[] = [
    {
      id: '1',
      name: 'Starter',
      price: 49,
      billing_cycle: 'monthly',
      description: 'Perfect for individuals getting started',
      icon: <Users className="h-6 w-6" />,
      features: [
        'Up to 10 clients',
        'Basic dispute letters',
        'Credit report analysis',
        'Email support',
        'Mobile app access'
      ]
    },
    {
      id: '2',
      name: 'Professional',
      price: 99,
      billing_cycle: 'monthly',
      popular: true,
      description: 'Ideal for growing businesses',
      icon: <TrendingUp className="h-6 w-6" />,
      features: [
        'Up to 50 clients',
        'Advanced dispute letters',
        'Automated workflows',
        'Priority support',
        'Analytics dashboard',
        'Custom branding',
        'API access'
      ]
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 199,
      billing_cycle: 'monthly',
      description: 'For large organizations',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited clients',
        'All dispute templates',
        'White-label solution',
        '24/7 phone support',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated account manager',
        'Priority feature requests'
      ]
    }
  ];

  // Check authentication on component mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access subscription features.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans: prefer authenticated admin endpoint to include restricted plans if allowed
      console.log('🔄 Fetching subscription plans for dashboard...');
      let databasePlans: SubscriptionPlan[] = [];
      try {
        const adminResp = await superAdminApi.getPlans({ page: 1, limit: 100 });
        console.log('📡 Admin Plans API Response:', adminResp);
        const plansData = adminResp.data?.data || [];
        if (Array.isArray(plansData) && plansData.length > 0) {
          databasePlans = plansData.map((dbPlan: any) => ({
            id: String(dbPlan.id),
            name: dbPlan.name,
            price: parseFloat(dbPlan.price),
            billing_cycle: dbPlan.billing_cycle,
            features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
            description: dbPlan.description || `${dbPlan.name} subscription plan`,
            icon: dbPlan.name === 'Starter' ? <Users className="h-6 w-6" /> :
                  dbPlan.name === 'Professional' ? <TrendingUp className="h-6 w-6" /> :
                  <Crown className="h-6 w-6" />,
            popular: dbPlan.name === 'Professional'
          }));
          console.log('✅ Loaded admin-filtered plans:', databasePlans);
          setAvailablePlans(databasePlans);
        } else {
          throw new Error('Empty admin plans');
        }
      } catch (adminErr) {
        console.warn('ℹ️ Admin plans endpoint unavailable or unauthorized, falling back to public pricing:', adminErr);
        try {
          const plansResponse = await pricingApi.getPlans();
          console.log('📡 Public Plans API Response:', plansResponse);
          if (plansResponse.data && plansResponse.data.success && plansResponse.data.data) {
            databasePlans = plansResponse.data.data.map((dbPlan: any) => ({
              id: dbPlan.id.toString(),
              name: dbPlan.name,
              price: parseFloat(dbPlan.price),
              billing_cycle: dbPlan.billing_cycle,
              features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
              description: dbPlan.description || `${dbPlan.name} subscription plan`,
              icon: dbPlan.name === 'Starter' ? <Users className="h-6 w-6" /> :
                    dbPlan.name === 'Professional' ? <TrendingUp className="h-6 w-6" /> :
                    <Crown className="h-6 w-6" />,
              popular: dbPlan.name === 'Professional'
            }));
            console.log('✅ Loaded public plans:', databasePlans);
            setAvailablePlans(databasePlans);
          } else {
            console.log('⚠️ Plans API returned unexpected structure, using fallback plans');
            setAvailablePlans(enhancedPlans);
            databasePlans = enhancedPlans;
          }
        } catch (plansError) {
          console.warn('⚠️ Failed to fetch public subscription plans, falling back to hardcoded plans:', plansError);
          setAvailablePlans(enhancedPlans);
          databasePlans = enhancedPlans;
        }
      }
      
      // Fetch current subscription
      console.log('🔄 Fetching subscription data...');
      const subscriptionResponse = await billingApi.getSubscription();
      console.log('📡 Subscription API Response:', subscriptionResponse);
      
      // Fix: Check for the correct response structure
      if (subscriptionResponse.data && subscriptionResponse.data.success && subscriptionResponse.data.subscription) {
        const dbSubscription = subscriptionResponse.data.subscription;
        console.log('📊 Raw subscription data:', dbSubscription);
        
        // Find matching plan from database plans
        const matchingPlan = databasePlans.find(p => p.name === dbSubscription.plan_name);
        console.log('🔍 Matching plan found:', matchingPlan);
        
        if (matchingPlan) {
          const formattedSubscription: UserSubscription = {
            id: dbSubscription.id.toString(),
            plan_id: matchingPlan.id,
            plan_name: dbSubscription.plan_name,
            status: dbSubscription.status,
            current_period_start: dbSubscription.current_period_start,
            current_period_end: dbSubscription.current_period_end,
            cancel_at_period_end: !!dbSubscription.cancel_at_period_end,
            billing_cycle: dbSubscription.plan_type === 'monthly' ? 'monthly' : 'yearly',
            plan: {
              ...matchingPlan,
              price: parseFloat(matchingPlan.price.toString())
            }
          };
          
          console.log('✅ Setting formatted subscription:', formattedSubscription);
          setSubscription(formattedSubscription);
        } else {
          console.log('❌ No matching plan found for:', dbSubscription.plan_name);
          console.log('Available plan names:', databasePlans.map(p => p.name));
        }
      } else {
        console.log('❌ No subscription data or API call failed');
        console.log('Response structure:', subscriptionResponse);
        console.log('Has data:', !!subscriptionResponse.data);
        console.log('Has success:', !!subscriptionResponse.data?.success);
        console.log('Has subscription:', !!subscriptionResponse.data?.subscription);
      }
    } catch (error) {
      console.error('❌ Error fetching subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Default selected tab aligns with current subscription if available
  useEffect(() => {
    if (subscription?.billing_cycle) {
      setBillingFilter(subscription.billing_cycle);
    }
  }, [subscription]);

  // Resolve affiliateId from URL (?ref=) or localStorage (referral_affiliate_id)
  const resolveAffiliateId = (): string | undefined => {
    try {
      const urlRef = new URLSearchParams(window.location.search).get('ref');
      const storedRef = localStorage.getItem('referral_affiliate_id');
      return (urlRef || storedRef) || undefined;
    } catch {
      return undefined;
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setUpgrading(true);
      
      const selectedPlan = availablePlans.find(p => p.id === planId);
      if (!selectedPlan) return;

      console.log('🟡 [REGULAR] Starting plan selection:', {
        planId: planId,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        billingCycle: selectedPlan.billing_cycle
      });
      
      const response = await billingApi.createSubscriptionCheckout({
        planId: planId,
        billingCycle: selectedPlan.billing_cycle,
        affiliateId: resolveAffiliateId()
      });

      console.log('🟡 [REGULAR] Checkout session response:', response);
      
      if (response.data && response.data.success && response.data.url) {
        console.log('🟡 [REGULAR] Redirecting to Stripe Checkout:', response.data.url);
        window.location.href = response.data.url;
      } else {
        console.error('🔴 [REGULAR] Failed to create checkout session:', response.data);
        toast({
          title: 'Checkout Error',
          description: 'Could not start checkout. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('🔴 [REGULAR] Plan selection error:', error);
      toast({
        title: 'Error',
        description: 'Failed to select plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('🟢 [REGULAR] Payment successful, processing...');
    setShowPaymentForm(false);
    setPaymentData(null);
    await fetchSubscriptionData();
    
    toast({
      title: 'Payment Successful! 🎉',
      description: 'Your subscription is now active. Welcome to the full experience!'
    });

    console.log('🟢 [REGULAR] Reloading page in 2000ms...');
    // Automatically refresh the page after successful payment
    setTimeout(() => {
      window.location.reload();
    }, 2000); // Wait 2 seconds to show the success message
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.status !== 'active') {
      toast({
        title: 'Cannot Cancel',
        description: 'No active subscription found to cancel.',
        variant: 'destructive'
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to cancel your subscription? You can continue using the service until the end of your billing period.');
    if (!confirmed) return;

    try {
      setUpgrading(true);
      
      // Show loading toast
      toast({
        title: 'Processing...',
        description: 'Cancelling your subscription...',
      });

      const response = await billingApi.cancelSubscription();
      
      // Fix: Check response.data.success instead of response.success (Axios wraps response in data)
      if (response.data && response.data.success) {
        setSubscription(prev => prev ? {
          ...prev,
          ...(response.data.subscription && {
            current_period_end: response.data.subscription.current_period_end,
            plan_name: response.data.subscription.plan_name,
            cancel_at_period_end: true
          })
        } : null);
        const endDate = response.data.subscription?.current_period_end ? new Date(response.data.subscription.current_period_end) : (subscription ? new Date(subscription.current_period_end) : null);
        toast({
          title: 'Subscription Cancellation Scheduled',
          description: `Your ${response.data.subscription?.plan_name || 'subscription'} will end on ${endDate ? endDate.toLocaleDateString() : 'the end of your billing period'}.`
        });
        setTimeout(() => {
          fetchSubscriptionData();
        }, 500);
      } else {
        // Handle API error response
        const errorMessage = response.data?.error || response.data?.message || 'Unknown error occurred';
        console.error('Subscription cancellation failed:', response);
        
        toast({
          title: 'Cancellation Failed',
          description: `Failed to cancel subscription: ${errorMessage}`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      
      // Extract detailed error information
      let errorMessage = 'Failed to cancel subscription. Please try again.';
      
      if (error.response) {
        // HTTP error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Redirect to login if unauthorized
          setTimeout(() => navigate('/login'), 2000);
        } else if (status === 404) {
          errorMessage = 'No active subscription found to cancel.';
        } else if (status === 400) {
          errorMessage = data?.error || 'Invalid request. Please check your subscription status.';
        } else if (status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (data?.error) {
          errorMessage = data.error;
        }
      } else if (error.message) {
        // Network or other errors
        errorMessage = `Network error: ${error.message}`;
      }
      
      toast({
        title: 'Error Cancelling Subscription',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUpgrading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending' },
      expired: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Expired' },
      canceled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, text: 'Canceled' }
    } as const;
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 px-3 py-1`}>
        <Icon className="h-3.5 w-3.5" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Loading Your Subscription</h3>
              <p className="text-gray-600">Please wait while we fetch your subscription details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Subscription Management
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock powerful funding tools and grow your business with our comprehensive platform
          </p>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && paymentData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-emerald-50">
                <h3 className="text-lg font-semibold text-gray-900">Complete Your Payment</h3>
                <p className="text-gray-600 text-sm mt-1">Secure payment powered by Stripe</p>
              </div>
              <div className="p-6">
                <PaymentForm
                  clientSecret={paymentData.clientSecret}
                  amount={paymentData.amount}
                  planName={paymentData.planName}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription Card */}
        {subscription && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-700 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-sea-green/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-ocean-blue to-sea-green rounded-lg text-white">
                      {subscription.plan.icon || <Crown className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subscription.plan.name} Plan
                      </CardTitle>
                      <CardDescription className="text-base dark:text-gray-300">
                        Your current subscription
                      </CardDescription>
                    </div>
                  </div>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Plan Details */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="text-center p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-sm border">
                    <div className="text-3xl font-bold text-blue-600 dark:text-white mb-1">
                      ${subscription.plan.price}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">per {subscription.billing_cycle}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium dark:text-white">Started</div>
                        <div className="text-gray-600 dark:text-gray-300">{new Date(subscription.current_period_start).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium dark:text-white">Next billing</div>
                        <div className="text-gray-600 dark:text-gray-300">{new Date(subscription.current_period_end).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Your Plan Features
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {subscription.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg border">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {subscription.status === 'pending' && (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Payment
                  </Button>
                )}
                
                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button 
                    onClick={handleCancelSubscription}
                    disabled={upgrading}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {upgrading ? (
                      <div className="w-4 h-4 mr-2 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Cancel Subscription
                  </Button>
                )}
              </div>
              {subscription.cancel_at_period_end && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      Your subscription will be canceled at the end of the current billing period on {new Date(subscription.current_period_end).toLocaleDateString()}.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">Select the perfect plan for your funding business</p>
          </div>

          {/* Billing Cycle Tabs */}
          <div className="flex justify-center">
            <Tabs
              value={billingFilter}
              onValueChange={(val) => setBillingFilter(val as 'monthly' | 'yearly')}
            >
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {availablePlans
              .filter((p) => p.billing_cycle === billingFilter)
              .map((plan) => {
              // Enhanced debugging for button logic
              console.log('🔍 Plan Button Debug:', {
                planName: plan.name,
                subscriptionPlanName: subscription?.plan_name,
                subscriptionStatus: subscription?.status,
                subscriptionData: subscription,
                planData: plan
              });
              
              const isCurrentPlan = subscription?.plan_name === plan.name && subscription?.status === 'active';
              const isPendingPlan = subscription?.plan_name === plan.name && subscription?.status === 'pending';
              
              console.log('🎯 Button State for', plan.name, ':', {
                isCurrentPlan,
                isPendingPlan,
                comparison: `"${subscription?.plan_name}" === "${plan.name}"`,
                statusCheck: `"${subscription?.status}" === "active"`
              });
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative border-0 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                  } ${isCurrentPlan ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700' : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-ocean-blue to-sea-green text-white px-4 py-1 shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center space-y-4 pb-4">
                    <div className="mx-auto p-3 bg-gradient-to-br from-ocean-blue to-sea-green rounded-xl text-white w-fit">
                      {plan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-base mt-2 dark:text-gray-300">{plan.description}</CardDescription>
                    </div>
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">per {plan.billing_cycle}</div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button 
                          disabled
                          className="w-full bg-green-100 text-green-800 hover:bg-green-100 cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Currently Active
                        </Button>
                      ) : isPendingPlan ? (
                        <Button 
                          onClick={() => navigate('/subscription')}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Complete Payment
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={upgrading}
                          className={`w-full ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90' 
                              : 'bg-gray-900 hover:bg-gray-800'
                          }`}
                        >
                          {upgrading ? (
                            <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              Select Plan
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {availablePlans.filter((p) => p.billing_cycle === billingFilter).length === 0 && (
              <div className="lg:col-span-3 text-center text-gray-600">
                No {billingFilter} plans available.
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div className="pt-8">
          <BillingHistory />
        </div>
      </div>
    </DashboardLayout>
  );
};

const Subscription: React.FC = () => {
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        setStripeLoading(true);
        setStripeError(null);
        const stripe = await getStripePromise();
        setStripeInstance(stripe);
      } catch (error) {
        console.error('❌ Failed to initialize Stripe:', error);
        setStripeError('Failed to load payment system. Please refresh the page.');
      } finally {
        setStripeLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (stripeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading payment system...</p>
        </div>
      </div>
    );
  }

  if (stripeError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{stripeError}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripeInstance}>
      <SubscriptionContent />
    </Elements>
  );
};

export default Subscription;
