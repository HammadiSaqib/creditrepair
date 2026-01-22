import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ClientIntake = () => {
  const [searchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";
  const intakeSlug = normalizeSlug(slug || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState<{ clientName?: string; clientId?: number | string } | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    password: "",
    ssnLast4: "",
  });

  const requiresSsn = useMemo(
    () => formData.platform === "identityiq" || formData.platform === "myscoreiq",
    [formData.platform]
  );

  const intakeLink = useMemo(() => {
    if (intakeSlug) return `${window.location.origin}/client-intake/${encodeURIComponent(intakeSlug)}`;
    if (token) return `${window.location.origin}/client-intake?token=${encodeURIComponent(token)}`;
    return "";
  }, [intakeSlug, token]);
  const loginTarget = useMemo(() => {
    const email = formData.email.trim();
    if (!email) return "/member/login";
    return `/member/login?email=${encodeURIComponent(email)}`;
  }, [formData.email]);

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
      toast({
        title: "Intake completed",
        description: "Your credit report is being prepared.",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 p-3 bg-emerald-100 rounded-full w-fit">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Client Intake</CardTitle>
            <CardDescription className="text-gray-600">
              Securely connect your credit monitoring platform to begin your report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token && !intakeSlug ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                This intake link is missing or invalid. Please request a new link from your admin.
              </div>
            ) : successData ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">
                      {successData.clientName ? `Thanks, ${successData.clientName}.` : "Thanks for submitting your intake."}
                    </div>
                    <div className="text-sm text-emerald-700">
                      Your report details are on the way. Use the client portal to track progress.
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Button onClick={() => navigate(loginTarget)} className="w-full">
                    Go to Client Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Intake"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientIntake;
