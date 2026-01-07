import { useState, useEffect } from 'react';
import { authApi, billingApi, superAdminApi } from '@/lib/api';

interface PagePermissions {
  hasPermission: (pageId: string) => boolean;
  allowedPages: string[];
  isLoading: boolean;
  error?: string;
  refetch: () => void;
}

// 定义所有可用的页面权限
export const AVAILABLE_PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  { id: 'clients', name: 'Clients', path: '/clients' },
  { id: 'employees', name: 'Employees', path: '/employees' },
  { id: 'reports', name: 'Reports', path: '/reports' },
  { id: 'credit-report', name: 'Credit Report', path: '/credit-report' },
  { id: 'credit-reports-scraper', name: 'Credit Reports Scraper', path: '/credit-reports/scraper' },
  { id: 'credit-reports-scraper-logs', name: 'Scraper Logs', path: '/credit-reports/scraper-logs' },
  { id: 'disputes', name: 'Disputes', path: '/disputes' },
  { id: 'ai-coach', name: 'AI Coach', path: '/ai-coach' },
  { id: 'school', name: 'School', path: '/school' },
  { id: 'analytics', name: 'Analytics', path: '/analytics' },
  { id: 'affiliate', name: 'Affiliate', path: '/affiliate' },
  { id: 'affiliate-management', name: 'Affiliate Management', path: '/affiliate-management' },
  { id: 'compliance', name: 'Compliance', path: '/compliance' },
  { id: 'automation', name: 'Automation', path: '/automation' },
  { id: 'settings', name: 'Settings', path: '/settings' },
  { id: 'support', name: 'Support', path: '/support' },
  { id: 'subscription', name: 'Subscription', path: '/subscription' },
  { id: 'feature-requests', name: 'Feature Requests', path: '/admin/feature-requests' }
];

// 根据路径获取页面ID
export const getPageIdFromPath = (path: string): string | null => {
  // 处理动态路由，如 /credit-report/:clientId
  if (path.startsWith('/credit-report/') && path !== '/credit-report') {
    return 'credit-report';
  }
  
  const page = AVAILABLE_PAGES.find(p => p.path === path);
  return page?.id || null;
};

export const usePagePermissions = (): PagePermissions => {
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      console.log('🚀 usePagePermissions - Starting permission fetch...');

      // 获取用户资料（注意后端返回 { success, user })
      const profileResponse = await authApi.getProfile();
      const user = profileResponse.data?.user || profileResponse.data; // 兼容旧结构
      const userRole = user?.role;
      setCurrentRole(userRole || null);
      const permissions: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
      const isExempt = !!user?.is_subscription_exempt || (Array.isArray(permissions) && (permissions.includes('subscription_exempt') || permissions.includes('no_subscription_required')));

      console.log('👤 usePagePermissions - User profile response:', profileResponse);
      console.log('👤 usePagePermissions - Parsed user:', user);
      console.log('👤 usePagePermissions - User role:', userRole);
      console.log('👤 usePagePermissions - User permissions:', permissions);
      console.log('👤 usePagePermissions - is_subscription_exempt:', isExempt);

      // 如果是超级管理员，拥有所有权限
      if (userRole === 'super_admin') {
        console.log('🔑 Super admin detected, granting all permissions');
        setAllowedPages(AVAILABLE_PAGES.map(p => p.id));
        return;
      }

      // 如果不是管理员，给予默认权限（向后兼容）
      if (userRole !== 'admin') {
        console.log('👥 Non-admin user, granting all permissions for backward compatibility');
        setAllowedPages(AVAILABLE_PAGES.map(p => p.id));
        return;
      }

      // 如果是管理员，首先检查是否豁免订阅
      if (userRole === 'admin') {
        if (isExempt) {
          console.log('✅ Admin marked as subscription-exempt, granting all pages');
          setAllowedPages(AVAILABLE_PAGES.map(p => p.id));
          return;
        }

        console.log('🔍 usePagePermissions - Admin user detected, checking subscription...');
        const subscriptionResponse = await billingApi.getSubscription();
        const subscriptionData = subscriptionResponse.data;
        
        // 正确访问嵌套的订阅对象
        const actualSubscription = subscriptionData?.subscription;
        
        console.log('🔍 usePagePermissions - Admin user subscription check:');
        console.log('   - subscriptionResponse:', subscriptionResponse);
        console.log('   - subscriptionData:', subscriptionData);
        console.log('   - actualSubscription:', actualSubscription);
        console.log('   - subscription status:', actualSubscription?.status);
        
        // If user has no subscription or inactive subscription, allow dashboard regardless of email verification
        const normalizedSubStatus = String(actualSubscription?.status || '').trim().toLowerCase();
        if (!actualSubscription || (normalizedSubStatus !== 'active' && normalizedSubStatus !== 'exempt')) {
          console.log('⚠️ Admin user has no active subscription, checking email verification status...');
          console.log('🔍 Subscription data:', actualSubscription);
          console.log('🔍 User email verified:', user?.email_verified);
          
          // Pre-purchase: always allow dashboard, subscription and settings
          console.log('✅ Pre-purchase access - allowing dashboard, subscription, settings, and school');
          console.log('🔍 Setting allowedPages to:', ['dashboard', 'subscription', 'settings', 'school']);
          setAllowedPages(['dashboard', 'subscription', 'settings', 'school']);
          return;
        }

        console.log('✅ usePagePermissions - Admin has active subscription, checking plan permissions...');

        // 获取订阅计划的详细信息
        const limit = 100;
        const maxPages = 1000;
        let page = 1;
        let pages = 1;
        const allPlans: any[] = [];

        while (page <= pages && page <= maxPages) {
          const plansResponse = await superAdminApi.getPlans({ page, limit });
          console.log('🔍 Plans response:', plansResponse);
          console.log('🔍 Plans response.data:', plansResponse.data);
          console.log('🔍 Plans response.data.data:', plansResponse.data?.data);
          
          const plansArray = plansResponse.data?.data || [];
          allPlans.push(...(Array.isArray(plansArray) ? plansArray : []));

          const paginationPages = Number((plansResponse.data as any)?.pagination?.pages);
          if (!Number.isNaN(paginationPages) && paginationPages > 0) {
            pages = paginationPages;
          } else {
            pages = 1;
          }

          page += 1;
        }

        const uniquePlans = Array.from(
          new Map(allPlans.map((p: any) => [String(p?.id ?? ''), p])).values()
        ).filter((p: any) => String(p?.id ?? '') !== '');

        console.log('🔍 Final plans array:', uniquePlans);
        console.log('🔍 Plans array length:', uniquePlans.length);
        console.log('🔍 Plans array type:', typeof uniquePlans);
        console.log('🔍 Is plans array?', Array.isArray(uniquePlans));

        const subscriptionPlanName = String(actualSubscription.plan_name || '').trim().toLowerCase();
        const userPlan = uniquePlans.find((plan: any) => String(plan?.name || '').trim().toLowerCase() === subscriptionPlanName);

        console.log('🔍 Found user plan:', userPlan?.name, 'with page_permissions:', userPlan?.page_permissions);

        if (userPlan) {
          const planPages: string[] = Array.isArray(userPlan.page_permissions) ? userPlan.page_permissions : [];
          if (planPages.length > 0) {
            const permissions = Array.from(
              new Set(['dashboard', 'settings', 'subscription', 'feature-requests', ...planPages])
            );
            console.log('✅ Using plan-defined permissions:', permissions);
            setAllowedPages(permissions);
          } else {
            console.log('⚠️ Plan has no page permissions defined, granting all pages by default');
            setAllowedPages(AVAILABLE_PAGES.map(p => p.id));
          }
        } else {
          console.log('⚠️ Could not find plan in plans list, granting basic permissions only');
          setAllowedPages(['dashboard', 'settings', 'subscription', 'feature-requests']);
        }
      }

    } catch (err) {
      console.error('❌ Error fetching page permissions:', err);
      
      // More detailed error logging
      if (err.response) {
        console.error('Response error:', err.response.status, err.response.data);
      } else if (err.request) {
        console.error('Request error:', err.request);
      } else {
        console.error('General error:', err.message);
      }
      
      setError('Failed to fetch page permissions');
      
      // Get user profile to determine fallback permissions
      try {
        const profileResponse = await authApi.getProfile();
        const user = profileResponse.data?.user || profileResponse.data;
        const userRole = user?.role;
        setCurrentRole(userRole || null);
        
        if (userRole === 'super_admin') {
          // Super admin gets all permissions even on error
          setAllowedPages(AVAILABLE_PAGES.map(p => p.id));
        } else if (userRole === 'admin') {
          // Admin users get restricted permissions on error (assume no subscription)
          console.log('⚠️ API error for admin user, restricting to subscription, settings, dashboard, and school');
          setAllowedPages(['subscription', 'settings', 'dashboard', 'school']);
        } else {
          // Non-admin users get basic permissions for backward compatibility
          setAllowedPages(['dashboard', 'subscription']);
        }
      } catch (profileError) {
        console.error('❌ Failed to get user profile for fallback permissions:', profileError);
        // If we can't even get the profile, give minimal permissions
        setAllowedPages(['subscription']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const hasPermission = (pageId: string): boolean => {
    if (currentRole === 'admin' && (pageId === 'dashboard' || pageId === 'subscription' || pageId === 'settings')) {
      return true;
    }
    const hasAccess = allowedPages.includes(pageId);
    console.log(`🔍 hasPermission("${pageId}"):`, hasAccess, '| allowedPages:', allowedPages);
    return hasAccess;
  };

  const refetch = () => {
    fetchPermissions();
  };

  return {
    hasPermission,
    allowedPages,
    isLoading,
    error,
    refetch
  };
};
