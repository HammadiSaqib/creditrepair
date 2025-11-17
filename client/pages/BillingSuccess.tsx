import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { billingApi } from "@/lib/api";

const BillingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = useMemo(() => new URLSearchParams(location.search).get("session_id"), [location.search]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        if (sessionId) {
          try {
            await billingApi.finalizeCheckoutSession(sessionId);
          } catch {}
        }
        const res = await billingApi.getSubscription();
        if (!mounted) return;
        if (res?.data?.success) {
          setSubscription(res.data.subscription || null);
          setError(null);
        } else {
          setError("Could not verify subscription yet. Please refresh.");
        }
      } catch (err) {
        setError("Unable to fetch subscription status.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Webhook usually completes instantly, but allow a short delay if needed
    fetchSubscription();
    const retry = setTimeout(fetchSubscription, 2500);
    return () => {
      mounted = false;
      clearTimeout(retry);
    };
  }, [location.search]);

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Subscription Checkout Successful</h1>
        {sessionId && (
          <p className="text-sm text-muted-foreground mb-4">Session ID: {sessionId}</p>
        )}

        {loading && (
          <p className="text-sm">Finalizing your subscription…</p>
        )}

        {!loading && error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        {!loading && !error && (
          <div className="space-y-2 mb-4">
            <p className="text-sm">Your subscription has been processed.</p>
            {subscription ? (
              <div className="text-sm">
                <p><span className="font-medium">Plan:</span> {subscription.plan_name || "—"}</p>
                <p><span className="font-medium">Status:</span> {subscription.status || "—"}</p>
              </div>
            ) : (
              <p className="text-sm">No active subscription found yet. Please refresh in a moment.</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          <Button variant="secondary" onClick={() => navigate("/subscription")}>Manage Subscription</Button>
        </div>
      </Card>
    </div>
  );
};

export default BillingSuccess;