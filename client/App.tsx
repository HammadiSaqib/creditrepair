import "./global.css";

import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import SupportProtectedRoute from "./components/SupportProtectedRoute";
import AffiliateProtectedRoute from "./components/AffiliateProtectedRoute";
import FundingManagerProtectedRoute from "./components/FundingManagerProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ReactGA from "react-ga4";
import Index from "./pages/Index";
const ReferralLandingPage = React.lazy(() => import("../src/components/ReferralLandingPage"));

const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Clients = React.lazy(() => import("./pages/Clients"));
const Employees = React.lazy(() => import("./pages/Employees"));
const AdminFeatureRequests = React.lazy(() => import("./pages/AdminFeatureRequests"));
const ClientProfile = React.lazy(() => import("./pages/ClientProfile"));
const FundingRequests = React.lazy(() => import("./pages/funding-manager/FundingRequests"));
const Reports = React.lazy(() => import("./pages/Reports"));
const CreditReport = React.lazy(() => import("./pages/CreditReport"));
const CreditReportScraperPage = React.lazy(() => import("./pages/credit-reports/scraper"));
const ScraperLogs = React.lazy(() => import("./components/ScraperLogs"));
const Disputes = React.lazy(() => import("./pages/Disputes"));
const AICoach = React.lazy(() => import("./pages/AICoach"));
const School = React.lazy(() => import("./pages/School"));
const CourseLearning = React.lazy(() => import("./pages/CourseLearning"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Affiliate = React.lazy(() => import("./pages/Affiliate"));
const Compliance = React.lazy(() => import("./pages/Compliance"));
const Automation = React.lazy(() => import("./pages/Automation"));
const Settings = React.lazy(() => import("./pages/Settings"));
const AffiliateSettings = React.lazy(() => import("./pages/AffiliateSettings"));
const Support = React.lazy(() => import("./pages/Support"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const Shop = React.lazy(() => import("./pages/Shop"));
const ShopSuccess = React.lazy(() => import("./pages/ShopSuccess"));
const Features = React.lazy(() => import("./pages/Features"));
const Subscription = React.lazy(() => import("./pages/Subscription"));
const BillingSuccess = React.lazy(() => import("./pages/BillingSuccess"));
const BillingCancel = React.lazy(() => import("./pages/BillingCancel"));
const SuperAdmin = React.lazy(() => import("./pages/SuperAdmin"));
const SuperAdminOverview = React.lazy(() => import("./pages/super-admin/SuperAdminOverview"));
const SuperAdminPlans = React.lazy(() => import("./pages/super-admin/SuperAdminPlans"));
const SuperAdminAdmins = React.lazy(() => import("./pages/super-admin/SuperAdminAdmins"));
const AdminDetails = React.lazy(() => import("./pages/super-admin/AdminDetails"));
const BlogIndex = React.lazy(() => import("./pages/Blog/BlogIndex"));
const BlogPost = React.lazy(() => import("./pages/Blog/BlogPost"));
const SuperAdminUsers = React.lazy(() => import("./pages/super-admin/SuperAdminUsers"));
const SuperAdminSubscriptions = React.lazy(() => import("./pages/super-admin/SuperAdminSubscriptions"));
const SuperAdminSettings = React.lazy(() => import("./pages/super-admin/SuperAdminSettings"));
const SuperAdminAffiliates = React.lazy(() => import("./pages/super-admin/SuperAdminAffiliates"));
const SuperAdminAffiliateProfile = React.lazy(() => import("./pages/super-admin/SuperAdminAffiliateProfile"));
const SuperAdminClientTransactions = React.lazy(() => import("./pages/super-admin/SuperAdminClientTransactions"));
const SuperAdminReports = React.lazy(() => import("./pages/super-admin/SuperAdminReports"));
const SuperAdminContracts = React.lazy(() => import("./pages/super-admin/SuperAdminContracts"));
const SuperAdminSupportUsers = React.lazy(() => import("./pages/super-admin/SuperAdminSupportUsers"));
const SuperAdminSchoolManagement = React.lazy(() => import("./pages/super-admin/SuperAdminSchoolManagement"));
const SuperAdminAdminImport = React.lazy(() => import("./pages/super-admin/SuperAdminAdminImport"));
const SuperAdminAffiliateImport = React.lazy(() => import("./pages/super-admin/SuperAdminAffiliateImport"));
const SuperAdminClientImport = React.lazy(() => import("./pages/super-admin/SuperAdminClientImport"));
const SuperAdminCreditReportUpload = React.lazy(() => import("./pages/super-admin/SuperAdminCreditReportUpload"));
const ShopManagement = React.lazy(() => import("./pages/super-admin/ShopManagement"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const SuperAdminLogin = React.lazy(() => import("./pages/SuperAdminLogin"));
const SupportLogin = React.lazy(() => import("./pages/SupportLogin"));
const SupportDashboard = React.lazy(() => import("./pages/SupportDashboard"));
const SupportAffiliateCsvImport = React.lazy(() => import("./pages/SupportAffiliateCsvImport"));
const SupportTickets = React.lazy(() => import("./pages/SupportTickets"));
const SupportLiveChat = React.lazy(() => import("./pages/SupportLiveChat"));
const SupportUsers = React.lazy(() => import("./pages/SupportUsers"));
const SupportKnowledgeBase = React.lazy(() => import("./pages/SupportKnowledgeBase"));
const SupportReports = React.lazy(() => import("./pages/SupportReports"));
const SupportEscalations = React.lazy(() => import("./pages/SupportEscalations"));
const SupportSettings = React.lazy(() => import("./pages/SupportSettings"));
const BlogManagement = React.lazy(() => import("./pages/Support/Blog/BlogManagement"));
const BlogEditor = React.lazy(() => import("./pages/Support/Blog/BlogEditor"));
const BlogCategories = React.lazy(() => import("./pages/Support/Blog/BlogCategories"));
const BlogTags = React.lazy(() => import("./pages/Support/Blog/BlogTags"));
const SupportAdminManagement = React.lazy(() => import("./pages/SupportAdminManagement"));
const AffiliateLogin = React.lazy(() => import("./pages/AffiliateLogin"));
const AffiliateDashboard = React.lazy(() => import("./pages/AffiliateDashboard"));
const AffiliateReferrals = React.lazy(() => import("./pages/AffiliateReferrals"));
const AffiliateEarnings = React.lazy(() => import("./pages/AffiliateEarnings"));
const AffiliateAnalytics = React.lazy(() => import("./pages/AffiliateAnalytics"));
const AffiliateMarketing = React.lazy(() => import("./pages/AffiliateMarketing"));
const AffiliateLinks = React.lazy(() => import("./pages/AffiliateLinks"));
const AffiliateCommissions = React.lazy(() => import("./pages/AffiliateCommissions"));
const AffiliateManagement = React.lazy(() => import("./pages/AffiliateManagement"));
const AffiliateSubscription = React.lazy(() => import("./pages/AffiliateSubscription"));
const JoinAffiliate = React.lazy(() => import("./pages/JoinAffiliate"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Refund = React.lazy(() => import("./pages/Refund"));
const Docs = React.lazy(() => import("./pages/Docs"));
const Sitemap = React.lazy(() => import("./pages/Sitemap"));
const Contact = React.lazy(() => import("./pages/Contact"));
const HowItWorks = React.lazy(() => import("./pages/HowItWorks"));
const FundingCalculator = React.lazy(() => import("./pages/FundingCalculator"));
const MortgageCalculator = React.lazy(() => import("./pages/MortgageCalculator"));
const CarLoanCalculator = React.lazy(() => import("./pages/CarLoanCalculator"));
const BusinessFunding = React.lazy(() => import("./pages/BusinessFunding"));
const CreditReadiness = React.lazy(() => import("./pages/CreditReadiness"));
const LoanPreparation = React.lazy(() => import("./pages/LoanPreparation"));
const ZeroPercentInterestCreditCards = React.lazy(() => import("./pages/ZeroPercentInterestCreditCards"));
const TaxProfessionalsFunding = React.lazy(() => import("./pages/TaxProfessionalsFunding"));
const FundingManagerLogin = React.lazy(() => import("./pages/FundingManagerLogin"));
const FundingManagerDashboard = React.lazy(() => import("./pages/funding-manager/FundingManagerDashboard"));
const BankManagement = React.lazy(() => import("./pages/funding-manager/BankManagement"));
const BankDetails = React.lazy(() => import("./pages/funding-manager/BankDetails"));
const CardManagement = React.lazy(() => import("./pages/funding-manager/CardManagement"));
const FundingManagerClients = React.lazy(() => import("./pages/funding-manager/FundingManagerClients"));
const FundingManagerSettings = React.lazy(() => import("./pages/funding-manager/FundingManagerSettings"));
const FundingManagerOverview = React.lazy(() => import("./pages/funding-manager/FundingManagerOverview"));
const FundingManagerAnalytics = React.lazy(() => import("./pages/funding-manager/FundingManagerAnalytics"));
const FundingManagerCommissions = React.lazy(() => import("./pages/funding-manager/FundingManagerCommissions"));
const FundingManagerRevenue = React.lazy(() => import("./pages/funding-manager/FundingManagerRevenue"));
const FundingRequestDetails = React.lazy(() => import("./pages/funding-manager/FundingRequestDetails"));
const FundingManagerCreditReport = React.lazy(() => import("./pages/funding-manager/CreditReport"));
const Invoices = React.lazy(() => import("./pages/Invoices"));
const ClientLogin = React.lazy(() => import("./pages/client/ClientLogin"));
const ClientDashboard = React.lazy(() => import("./pages/client/ClientDashboard"));
const ClientAccounts = React.lazy(() => import("./pages/client/Accounts"));
const ClientPayments = React.lazy(() => import("./pages/client/Payments"));
const ClientCollections = React.lazy(() => import("./pages/client/Collections"));
const ClientInquiries = React.lazy(() => import("./pages/client/Inquiries"));
const ClientPersonal = React.lazy(() => import("./pages/client/Personal"));
const ClientUnderwriting = React.lazy(() => import("./pages/client/Underwriting"));
const ClientProgressReport = React.lazy(() => import("./pages/client/ProgressReport"));
const ClientAnalysis = React.lazy(() => import("./pages/client/Analysis"));
const ClientFunding = React.lazy(() => import("./pages/client/Funding"));
const ClientPublicRecords = React.lazy(() => import("./pages/client/PublicRecords"));
const ClientMonitoring = React.lazy(() => import("./pages/client/Monitoring"));
const ClientScoreHistory = React.lazy(() => import("./pages/client/ScoreHistory"));
const ClientSettings = React.lazy(() => import("./pages/client/Settings"));
const ClientSupport = React.lazy(() => import("./pages/client/Support"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const PermissionDebug = React.lazy(() => import("./pages/PermissionDebug"));
const FundingDIY = React.lazy(() => import("./pages/FundingDIY"));
const FundingApplication = React.lazy(() => import("./pages/FundingApplication"));
const InvoiceView = React.lazy(() => import("./pages/InvoiceView"));
const PayslipPublic = React.lazy(() => import("./pages/PayslipPublic"));

const queryClient = new QueryClient();

const gaMeasurementId =
  import.meta.env.VITE_GA4_MEASUREMENT_ID || "G-E0ZK4BKGC0";

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!gaMeasurementId) return;
    ReactGA.send({
      hitType: "pageview",
      page: `${location.pathname}${location.search}`,
      title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}

const App = () => {
  useEffect(() => {
    if (!gaMeasurementId) return;
    ReactGA.initialize([
      {
        trackingId: gaMeasurementId,
        gtagOptions: { send_page_view: false },
      },
    ]);
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PageViewTracker />
                <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
                  <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/success" element={<ShopSuccess />} />
          <Route path="/features" element={<Features />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/business-funding" element={<BusinessFunding />} />
          <Route path="/credit-readiness" element={<CreditReadiness />} />
          <Route path="/loan-preparation" element={<LoanPreparation />} />
          <Route path="/0-percent-interest-credit-cards" element={<ZeroPercentInterestCreditCards />} />
          <Route path="/tax-professionals-funding" element={<TaxProfessionalsFunding />} />
          <Route path="/funding-calculator" element={<FundingCalculator />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/car-loan-calculator" element={<CarLoanCalculator />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<Refund />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/support/login" element={<SupportLogin />} />
          <Route path="/affiliate/login" element={<AffiliateLogin />} />
          <Route path="/funding-manager/login" element={<FundingManagerLogin />} />
          <Route path="/funding-manager" element={<Navigate to="/funding-manager/login" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="clients">
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute pageId="employees">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="clients">
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding-requests"
            element={<Navigate to="/funding-manager/funding-requests" replace />}
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute pageId="reports">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payslip/:token"
            element={<PayslipPublic />}
          />
          <Route
            path="/credit-report"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="credit-report">
                <CreditReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding/diy"
            element={
              <ProtectedRoute pageId="credit-report">
                <FundingDIY />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding/diy/:type"
            element={
              <ProtectedRoute pageId="credit-report">
                <FundingDIY />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding/apply/:type"
            element={
              <ProtectedRoute pageId="credit-report">
                <FundingApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-report/:clientId"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="credit-report">
                <CreditReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-reports/scraper"
            element={
              <ProtectedRoute pageId="credit-reports-scraper">
                <CreditReportScraperPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-reports/scraper-logs"
            element={
              <ProtectedRoute pageId="credit-reports-scraper-logs">
                <ScraperLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes"
            element={
              <ProtectedRoute pageId="disputes">
                <Disputes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-coach"
            element={
              <ProtectedRoute pageId="ai-coach">
                <AICoach />
              </ProtectedRoute>
            }
          />

          <Route
            path="/school"
            element={
              <ProtectedRoute pageId="school">
                <School />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute pageId="school">
                <CourseLearning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute pageId="analytics">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/affiliate"
            element={
              <ProtectedRoute pageId="affiliate">
                <Affiliate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/affiliate-management"
            element={
              <ProtectedRoute pageId="affiliate-management">
                <AffiliateManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute pageId="compliance">
                <Compliance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/automation"
            element={
              <ProtectedRoute pageId="automation">
                <Automation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="settings">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feature-requests"
            element={
              <ProtectedRoute pageId="feature-requests">
                <AdminFeatureRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute pageId="support">
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute allowUnpaidAccess={true}>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/success"
            element={
              <ProtectedRoute allowUnpaidAccess={true}>
                <BillingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/cancel"
            element={
              <ProtectedRoute allowUnpaidAccess={true}>
                <BillingCancel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug-permissions"
            element={
              <ProtectedRoute allowUnpaidAccess={true}>
                <PermissionDebug />
              </ProtectedRoute>
            }
          />
          <Route path="/super-admin" element={
            <SuperAdminProtectedRoute>
              <SuperAdmin />
            </SuperAdminProtectedRoute>
          } />
          <Route
            path="/super-admin/overview"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminOverview />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/plans"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminPlans />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/admins"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminAdmins />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/admins/:id"
            element={
              <SuperAdminProtectedRoute>
                <AdminDetails />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminUsers />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/subscriptions"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminSubscriptions />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminSettings />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/affiliates"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminAffiliates />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/affiliates/:id"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminAffiliateProfile />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/clients/:userId/transactions"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminClientTransactions />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/contracts"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminContracts />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reports"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminReports />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/shop-management"
            element={
              <SuperAdminProtectedRoute>
                <ShopManagement />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/support-users"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminSupportUsers />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/school-management"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminSchoolManagement />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/admin-import"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminAdminImport />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/affiliate-import"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminAffiliateImport />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/client-import"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminClientImport />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/credit-report-upload"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminCreditReportUpload />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reports/:clientId"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminReports />
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/support/dashboard"
            element={
              <SupportProtectedRoute>
                <SupportDashboard />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/affiliate-import"
            element={
              <SupportProtectedRoute>
                <SupportAffiliateCsvImport />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/tickets"
            element={
              <SupportProtectedRoute>
                <SupportTickets />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/live-chat"
            element={
              <SupportProtectedRoute>
                <SupportLiveChat />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/users"
            element={
              <SupportProtectedRoute>
                <SupportUsers />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/knowledge-base"
            element={
              <SupportProtectedRoute>
                <SupportKnowledgeBase />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/reports"
            element={
              <SupportProtectedRoute>
                <SupportReports />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/escalations"
            element={
              <SupportProtectedRoute>
                <SupportEscalations />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/admin-management"
            element={
              <SupportProtectedRoute>
                <SupportAdminManagement />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/settings"
            element={
              <SupportProtectedRoute>
                <SupportSettings />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/blog"
            element={
              <SupportProtectedRoute>
                <BlogManagement />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/blog/new"
            element={
              <SupportProtectedRoute>
                <BlogEditor />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/blog/edit/:id"
            element={
              <SupportProtectedRoute>
                <BlogEditor />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/blog/categories"
            element={
              <SupportProtectedRoute>
                <BlogCategories />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/support/blog/tags"
            element={
              <SupportProtectedRoute>
                <BlogTags />
              </SupportProtectedRoute>
            }
          />
          <Route
            path="/affiliate/dashboard"
            element={
              <AffiliateProtectedRoute>
                <AffiliateDashboard />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/referrals"
            element={
              <AffiliateProtectedRoute>
                <AffiliateReferrals />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/earnings"
            element={
              <AffiliateProtectedRoute>
                <AffiliateEarnings />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/analytics"
            element={
              <AffiliateProtectedRoute>
                <AffiliateAnalytics />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/marketing"
            element={
              <AffiliateProtectedRoute>
                <AffiliateMarketing />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/links"
            element={
              <AffiliateProtectedRoute>
                <AffiliateLinks />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/commissions"
            element={
              <AffiliateProtectedRoute>
                <AffiliateCommissions />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/performance"
            element={
              <AffiliateProtectedRoute>
                <AffiliateAnalytics />
              </AffiliateProtectedRoute>
            }
          />
          <Route
            path="/affiliate/subscription"
            element={
              <AffiliateProtectedRoute>
                <AffiliateSubscription />
              </AffiliateProtectedRoute>
            }
          />
          <Route path="/affiliate/settings" element={
              <AffiliateProtectedRoute>
                <AffiliateSettings />
              </AffiliateProtectedRoute>
            } />
          <Route
            path="/funding-manager/dashboard"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerDashboard />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/banks"
            element={
              <FundingManagerProtectedRoute>
                <BankManagement />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/banks/:id"
            element={
              <FundingManagerProtectedRoute>
                <BankDetails />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/clients"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerClients />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/cards"
            element={
              <FundingManagerProtectedRoute>
                <CardManagement />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/funding-requests"
            element={
              <FundingManagerProtectedRoute>
                <FundingRequests />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/funding-requests/:id"
            element={
              <FundingManagerProtectedRoute>
                <FundingRequestDetails />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/settings"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerSettings />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/overview"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerOverview />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/analytics"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerAnalytics />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/commissions"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerCommissions />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/revenue"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerRevenue />
              </FundingManagerProtectedRoute>
            }
          />
          <Route
            path="/funding-manager/credit-report/:userId"
            element={
              <FundingManagerProtectedRoute>
                <FundingManagerCreditReport />
              </FundingManagerProtectedRoute>
            }
          />
          <Route path="/join-affiliate" element={<JoinAffiliate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ref/:affiliateId" element={<ReferralLandingPage />} />
          <Route path="/invoice/:token" element={<InvoiceView />} />
          
          {/* Member Routes */}
          <Route path="/member/login" element={<ClientLogin />} />
          <Route path="/member" element={<Navigate to="/member/login" replace />} />
          <Route
            path="/member/dashboard"
            element={
              <ClientProtectedRoute>
                <ClientDashboard />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/accounts"
            element={
              <ClientProtectedRoute>
                <ClientAccounts />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/payments"
            element={
              <ClientProtectedRoute>
                <ClientPayments />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/collections"
            element={
              <ClientProtectedRoute>
                <ClientCollections />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/inquiries"
            element={
              <ClientProtectedRoute>
                <ClientInquiries />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/personal"
            element={
              <ClientProtectedRoute>
                <ClientPersonal />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/underwriting"
            element={
              <ClientProtectedRoute>
                <ClientUnderwriting />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/progress-report"
            element={
              <ClientProtectedRoute>
                <ClientProgressReport />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/analysis"
            element={
              <ClientProtectedRoute>
                <ClientAnalysis />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/funding"
            element={
              <ClientProtectedRoute>
                <ClientFunding />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/public-records"
            element={
              <ClientProtectedRoute>
                <ClientPublicRecords />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/monitoring"
            element={
              <ClientProtectedRoute>
                <ClientMonitoring />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/score-history"
            element={
              <ClientProtectedRoute>
                <ClientScoreHistory />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/settings"
            element={
              <ClientProtectedRoute>
                <ClientSettings />
              </ClientProtectedRoute>
            }
          />
          <Route
            path="/member/support"
            element={
              <ClientProtectedRoute>
                <ClientSupport />
              </ClientProtectedRoute>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
