import { useState, useEffect } from 'react';
import { authApi, billingApi } from '@/lib/api';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planName?: string;
  status?: 'active' | 'pending' | 'expired' | 'cancelled' | 'exempt' | 'trial';
  features?: string[];
  isLoading: boolean;
  refetch?: () => void;
}

export function useSubscriptionStatus(): SubscriptionStatus {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    isLoading: true,
  });

  const checkSubscriptionStatus = async () => {
    try {
      setSubscriptionStatus(prev => ({ ...prev, isLoading: true }));
      
      // Get user profile to check role and exemption
      const userProfile = await authApi.getProfile();
      console.log('🔍 useSubscriptionStatus - FULL User profile response:', userProfile);
      console.log('🔍 useSubscriptionStatus - User profile data:', userProfile.data);

      // Normalize user object across formats
      const user = userProfile.data?.user || userProfile.data;
      const userRole: string | undefined = user?.role;
      const permissions: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
      const isExempt = !!user?.is_subscription_exempt || (Array.isArray(permissions) && (permissions.includes('subscription_exempt') || permissions.includes('no_subscription_required')));

      console.log('🔍 useSubscriptionStatus - Parsed user role:', userRole);
      console.log('🔍 useSubscriptionStatus - Parsed permissions:', permissions);
      console.log('🔍 useSubscriptionStatus - is_subscription_exempt:', isExempt);

      if (!userRole) {
        console.error('❌ useSubscriptionStatus - Could not extract user role from profile response');
      }

      // Short-circuit: if user is exempt, treat as active subscription everywhere
      if (isExempt) {
        console.log('✅ useSubscriptionStatus - User marked as subscription-exempt; granting active access');
        setSubscriptionStatus({
          hasActiveSubscription: true,
          status: 'exempt',
          isLoading: false,
          refetch: checkSubscriptionStatus,
        });
        return;
      }
      
      if (userRole === 'admin') {
        // Fetch actual subscription status from API
        const subscriptionResponse = await billingApi.getSubscription();
        console.log('🔍 useSubscriptionStatus - Admin subscription response:', subscriptionResponse);
        console.log('🔍 useSubscriptionStatus - Full response data:', JSON.stringify(subscriptionResponse, null, 2));
        
        if (subscriptionResponse.data && subscriptionResponse.data.subscription) {
          const subscription = subscriptionResponse.data.subscription;
          console.log('🔍 useSubscriptionStatus - Subscription data:', subscription);
          console.log('🔍 useSubscriptionStatus - Subscription status:', subscription.status);
          console.log('🔍 useSubscriptionStatus - Status type:', typeof subscription.status);
          // Business rule: prioritize explicit status. If status is 'active', treat as active
          // regardless of current_period_end value to avoid false negatives.
          const isActive = subscription.status === 'active';
          console.log('🔍 useSubscriptionStatus - Is active calculation:', isActive);
          console.log('🔍 useSubscriptionStatus - Status comparison:', subscription.status, '===', 'active', '=', subscription.status === 'active');
          console.log('🔍 useSubscriptionStatus - Is active:', isActive);

          // For admin users, even if they have a subscription record, check if it's truly active
          // If not active, they should see blurred content on credit report page
          setSubscriptionStatus({
            hasActiveSubscription: isActive, // Only true if status is 'active'
            planName: subscription.plan_name,
            status: subscription.status,
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        } else {
          console.log('🔍 useSubscriptionStatus - No subscription found for admin');
          // Admin users without subscription should see blurred content on credit report
          // but still have dashboard access for basic functionality
          setSubscriptionStatus({
            hasActiveSubscription: false, // Enable blurring on credit report page
            status: 'trial', // Mark as trial to enable upgrade prompts
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        }
      } else if (userRole === 'affiliate') {
        // Affiliates can also have subscriptions; check status via billing API
        const subscriptionResponse = await billingApi.getSubscription();
        console.log('🔍 useSubscriptionStatus - Affiliate subscription response:', subscriptionResponse);
        if (subscriptionResponse.data && subscriptionResponse.data.subscription) {
          const subscription = subscriptionResponse.data.subscription;
          console.log('🔍 useSubscriptionStatus - Affiliate subscription data:', subscription);
          const isActive = subscription.status === 'active';
          console.log('🔍 useSubscriptionStatus - Affiliate is active:', isActive);
          setSubscriptionStatus({
            hasActiveSubscription: isActive,
            planName: subscription.plan_name,
            status: subscription.status,
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        } else {
          console.log('🔍 useSubscriptionStatus - No subscription found for affiliate');
          setSubscriptionStatus({
            hasActiveSubscription: false,
            status: 'pending',
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        }
      } else {
        // Non-admin users (e.g., regular users, super_admin) have full access
        // But we should still check if they have a subscription for consistency, unless exempt
        console.log('🔍 useSubscriptionStatus - Non-admin user, checking subscription anyway');
        const subscriptionResponse = await billingApi.getSubscription();
        console.log('🔍 useSubscriptionStatus - Non-admin subscription response:', subscriptionResponse);

        if (subscriptionResponse.data && subscriptionResponse.data.subscription) {
          const subscription = subscriptionResponse.data.subscription;
          const isActive = subscription.status === 'active';
          console.log('🔍 useSubscriptionStatus - Non-admin subscription found, is active:', isActive);
          setSubscriptionStatus({
            hasActiveSubscription: isActive || userRole === 'super_admin' || userRole === 'user',
            planName: subscription.plan_name,
            status: isActive ? 'active' : 'pending',
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        } else {
          console.log('🔍 useSubscriptionStatus - No subscription found for non-admin user');
          // For super_admin and other roles, give full access even without subscription
          const hasFullAccess = userRole === 'super_admin' || userRole === 'user';
          setSubscriptionStatus({
            hasActiveSubscription: hasFullAccess,
            status: hasFullAccess ? 'active' : 'pending',
            isLoading: false,
            refetch: checkSubscriptionStatus,
          });
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('General error:', error.message);
      }
      
      // Set error state with more graceful handling
      setSubscriptionStatus({
        hasActiveSubscription: false,
        status: 'pending',
        isLoading: false,
        refetch: checkSubscriptionStatus,
      });
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  return subscriptionStatus;
}