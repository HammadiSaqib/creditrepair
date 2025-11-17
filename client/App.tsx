import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import ClientProfile from "./pages/ClientProfile";
import FundingRequests from "./pages/funding-manager/FundingRequests";
import Reports from "./pages/Reports";
import CreditReport from "./pages/CreditReport";
import CreditReportScraperPage from "./pages/credit-reports/scraper";
import ScraperLogs from "./components/ScraperLogs";
import Disputes from "./pages/Disputes";
import AICoach from "./pages/AICoach";

import School from "./pages/School";
import CourseLearning from "./pages/CourseLearning";
import Analytics from "./pages/Analytics";
import Affiliate from "./pages/Affiliate";
import Compliance from "./pages/Compliance";
import Automation from "./pages/Automation";
import Settings from "./pages/Settings";
import AffiliateSettings from "./pages/AffiliateSettings";
import Support from "./pages/Support";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Subscription from "./pages/Subscription";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminOverview from "./pages/super-admin/SuperAdminOverview";
import SuperAdminPlans from "./pages/super-admin/SuperAdminPlans";
import SuperAdminAdmins from "./pages/super-admin/SuperAdminAdmins";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminSubscriptions from "./pages/super-admin/SuperAdminSubscriptions";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import SuperAdminAffiliates from "./pages/super-admin/SuperAdminAffiliates";
import SuperAdminReports from "./pages/super-admin/SuperAdminReports";
import SuperAdminContracts from "./pages/super-admin/SuperAdminContracts";
import SuperAdminSupportUsers from "./pages/super-admin/SuperAdminSupportUsers";
import SuperAdminSchoolManagement from "./pages/super-admin/SuperAdminSchoolManagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SupportLogin from "./pages/SupportLogin";
import SupportDashboard from "./pages/SupportDashboard";
import SupportAffiliateCsvImport from "./pages/SupportAffiliateCsvImport";
import SupportTickets from "./pages/SupportTickets";
import SupportLiveChat from "./pages/SupportLiveChat";
import SupportUsers from "./pages/SupportUsers";
import SupportKnowledgeBase from "./pages/SupportKnowledgeBase";
import SupportReports from "./pages/SupportReports";
import SupportEscalations from "./pages/SupportEscalations";
import SupportSettings from "./pages/SupportSettings";
import SupportAdminManagement from "./pages/SupportAdminManagement";
import SupportProtectedRoute from "./components/SupportProtectedRoute";
import AffiliateLogin from "./pages/AffiliateLogin";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AffiliateReferrals from "./pages/AffiliateReferrals";
import AffiliateEarnings from "./pages/AffiliateEarnings";
import AffiliateAnalytics from "./pages/AffiliateAnalytics";
import AffiliateMarketing from "./pages/AffiliateMarketing";
import AffiliateLinks from "./pages/AffiliateLinks";
import AffiliateCommissions from "./pages/AffiliateCommissions";
import AffiliateProtectedRoute from "./components/AffiliateProtectedRoute";
import AffiliateManagement from "./pages/AffiliateManagement";
import AffiliateSubscription from "./pages/AffiliateSubscription";
import JoinAffiliate from "./pages/JoinAffiliate";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import FundingManagerLogin from "./pages/FundingManagerLogin";
import FundingManagerDashboard from "./pages/funding-manager/FundingManagerDashboard";
import BankManagement from "./pages/funding-manager/BankManagement";
import BankDetails from "./pages/funding-manager/BankDetails";
import CardManagement from "./pages/funding-manager/CardManagement";
import FundingManagerClients from "./pages/funding-manager/FundingManagerClients";
import FundingManagerSettings from "./pages/funding-manager/FundingManagerSettings";
import FundingManagerOverview from "./pages/funding-manager/FundingManagerOverview";
import FundingManagerAnalytics from "./pages/funding-manager/FundingManagerAnalytics";
import FundingManagerCommissions from "./pages/funding-manager/FundingManagerCommissions";
import FundingManagerRevenue from "./pages/funding-manager/FundingManagerRevenue";
import FundingRequestDetails from "./pages/funding-manager/FundingRequestDetails";
import FundingManagerCreditReport from "./pages/funding-manager/CreditReport";
 import Invoices from "./pages/Invoices";
import FundingManagerProtectedRoute from "./components/FundingManagerProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import ClientLogin from "./pages/client/ClientLogin";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientAccounts from "./pages/client/Accounts";
import ClientPayments from "./pages/client/Payments";
import ClientCollections from "./pages/client/Collections";
import ClientInquiries from "./pages/client/Inquiries";
import ClientPersonal from "./pages/client/Personal";
import ClientUnderwriting from "./pages/client/Underwriting";
import ClientProgressReport from "./pages/client/ProgressReport";
import ClientAnalysis from "./pages/client/Analysis";
import ClientFunding from "./pages/client/Funding";
import ClientPublicRecords from "./pages/client/PublicRecords";
import ClientMonitoring from "./pages/client/Monitoring";
import ClientScoreHistory from "./pages/client/ScoreHistory";
import ClientSettings from "./pages/client/Settings";
import ClientSupport from "./pages/client/Support";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import ReferralLandingPage from "../src/components/ReferralLandingPage";
import PermissionDebug from "./pages/PermissionDebug";
import FundingDIY from "./pages/FundingDIY";
import FundingApplication from "./pages/FundingApplication";
import InvoiceView from "./pages/InvoiceView";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
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
            path="/credit-report"
            element={
              <ProtectedRoute allowUnpaidAccess={true} pageId="credit-report">
                <CreditReport />
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
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
