import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { clientsApi } from "@/lib/api";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Link as LinkIcon, User } from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "myfreescorenow", label: "My Free Score Now" },
  { value: "identityiq", label: "IdentityIQ" },
  { value: "myscoreiq", label: "MyScoreIQ" },
];

const normalizeSlug = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const normalizeHexColor = (value?: string | null) => {
  const color = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toUpperCase();
  return "#16A34A";
};

const ClientIntake = () => {
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";
  const intakeSlug = normalizeSlug(slug || "");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [intakeConfig, setIntakeConfig] = useState<{
    redirectUrl: string | null;
    logoUrl: string | null;
    primaryColor: string;
  }>({
    redirectUrl: null,
    logoUrl: null,
    primaryColor: "#16A34A",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState<{ clientName?: string; clientId?: number | string } | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    password: "",
    ssnLast4: "",
  });
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);

  const requiresSsn = useMemo(
    () => formData.platform === "identityiq" || formData.platform === "myscoreiq",
    [formData.platform]
  );

  const intakeLink = useMemo(() => {
    if (intakeSlug) return `${window.location.origin}/client-intake/${encodeURIComponent(intakeSlug)}`;
    if (token) return `${window.location.origin}/client-intake?token=${encodeURIComponent(token)}`;
    return "";
  }, [intakeSlug, token]);

  const intakePrimaryColor = useMemo(() => normalizeHexColor(intakeConfig.primaryColor), [intakeConfig.primaryColor]);
  const intakeTint = useMemo(() => `${intakePrimaryColor}22`, [intakePrimaryColor]);

  useEffect(() => {
    const fetchIntakeConfig = async () => {
      if (!token && !intakeSlug) {
        setLoadingConfig(false);
        return;
      }
      try {
        const response = await clientsApi.getClientIntakeConfig({
          token: token || undefined,
          slug: intakeSlug || undefined,
        });
        const data = response.data?.data || response.data;
        setIntakeConfig({
          redirectUrl: data?.redirectUrl || null,
          logoUrl: data?.logoUrl || null,
          primaryColor: normalizeHexColor(data?.primaryColor),
        });
      } catch (error: any) {
        const message = error?.response?.data?.error || error?.message || "Unable to load intake branding settings.";
        toast({
          title: "Intake link issue",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchIntakeConfig();
  }, [token, intakeSlug, toast]);

  const handleSuccessRedirect = () => {
    const redirectUrl = intakeConfig.redirectUrl;
    if (!redirectUrl) return;
    window.location.assign(redirectUrl);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token && !intakeSlug) {
      toast({
        title: "Missing intake link",
        description: "Please use the intake link provided by your admin.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.platform || !formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Platform, email, and password are required.",
        variant: "destructive",
      });
      return;
    }

    if (requiresSsn && !formData.ssnLast4) {
      toast({
        title: "Missing SSN last 4",
        description: "Please enter the last 4 digits of your SSN for this platform.",
        variant: "destructive",
      });
      return;
    }
    if (!authorizationConfirmed) {
      toast({
        title: "Authorization Required",
        description: "Please confirm authorization to use the credit report for educational analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await clientsApi.submitClientIntake({
        token,
        slug: intakeSlug || undefined,
        platform: formData.platform,
        email: formData.email,
        password: formData.password,
        ssnLast4: requiresSsn ? formData.ssnLast4 : undefined,
      });
      const data = response.data?.data || response.data;
      setSuccessData({
        clientName: data?.clientName || "",
        clientId: data?.clientId,
      });
      setAuthorizationConfirmed(false);
      toast({
        title: "Intake completed",
        description: "Your credit report is being prepared.",
      });
      if (intakeConfig.redirectUrl) {
        setTimeout(() => {
          handleSuccessRedirect();
        }, 1200);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to submit intake form.";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!intakeLink) return;
    try {
      await navigator.clipboard.writeText(intakeLink);
      toast({ title: "Link copied", description: "Intake link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(140deg, #F8FAFC 10%, ${intakeTint} 90%)` }}>
      <div className="w-full max-w-xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            {intakeConfig.logoUrl ? (
              <img
                src={intakeConfig.logoUrl}
                alt="Brand logo"
                className="mx-auto mb-3 max-h-14 object-contain"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="mx-auto mb-3 p-3 rounded-full w-fit" style={{ backgroundColor: intakeTint }}>
                <User className="h-6 w-6" style={{ color: intakePrimaryColor }} />
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-gray-900">Client Intake</CardTitle>
            <CardDescription className="text-gray-600">
              Securely connect your credit monitoring platform to begin your report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConfig ? (
              <div className="rounded-lg border p-4 text-sm text-slate-600" style={{ borderColor: intakeTint, backgroundColor: `${intakeTint}55` }}>
                Loading intake configuration...
              </div>
            ) : (!token && !intakeSlug ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This intake link is missing or invalid. Please request a new link from your admin.
              </div>
            ) : successData ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-lg border p-4" style={{ borderColor: intakeTint, backgroundColor: `${intakeTint}55` }}>
                  <CheckCircle2 className="h-6 w-6" style={{ color: intakePrimaryColor }} />
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#14532D" }}>
                      {successData.clientName ? `Thanks, ${successData.clientName}.` : "Thanks for submitting your intake."}
                    </div>
                    <div className="text-sm" style={{ color: "#166534" }}>
                      Your report details are on the way. Use the client portal to track progress.
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {intakeConfig.redirectUrl ? (
                    <Button onClick={handleSuccessRedirect} className="w-full" style={{ backgroundColor: intakePrimaryColor }}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={handleCopyLink} className="w-full">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy Intake Link
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Credit Monitoring Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Platform Email/Username</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Enter your platform email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Platform Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Enter your platform password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {requiresSsn ? (
                  <div className="space-y-2">
                    <Label htmlFor="ssnLast4">SSN Last 4</Label>
                    <Input
                      id="ssnLast4"
                      value={formData.ssnLast4}
                      onChange={(event) => setFormData((prev) => ({ ...prev, ssnLast4: event.target.value }))}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                ) : null}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="intake-authorization"
                    checked={authorizationConfirmed}
                    onCheckedChange={(checked) => setAuthorizationConfirmed(checked === true)}
                  />
                  <Label htmlFor="intake-authorization" className="text-sm text-slate-600">
                    I confirm this is my credit report and I authorize its use for educational analysis.
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Intake"}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientIntake;
