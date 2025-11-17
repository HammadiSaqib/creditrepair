import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import AdminAgreementTab from "@/components/AdminAgreementTab";
import { useState, useEffect, useMemo } from "react";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  Key,
  Download,
  Upload,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Camera,
  Webhook,
  Database,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2,
  Sun,
  Moon,
  CreditCard,
} from "lucide-react";

// User profile data is now loaded from backend via API

const integrationStatus = [
  {
    name: "MyFreeScoreNow",
    status: "Connected",
    lastSync: "2024-01-15 16:00",
    health: "Good",
  },
  {
    name: "IdentityIQ",
    status: "Disconnected",
    lastSync: "Never",
    health: "In Progress",
  },
  {
    name: "SmartCredit",
    status: "Disconnected",
    lastSync: "Never",
    health: "In Progress",
  },
  {
    name: "MyScoreIQ",
    status: "Disconnected",
    lastSync: "Never",
    health: "In Progress",
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Funding & Payments state
  const [fundingSettings, setFundingSettings] = useState({
    merchantId: "",
    publicKey: "",
    apiKey: "",
    nmiUsername: "",
    nmiPassword: "",
    testMode: false,
    gatewayLogoFile: null as File | null,
  });
  const [savingFunding, setSavingFunding] = useState(false);
  const { toast } = useToast();
  const { userProfile, refreshProfile } = useAuthContext();

  // Credit Repair Integration state
  const DEFAULT_CREDIT_REPAIR_URL = "https://www.m2ficoforge.com/";
  const [creditRepairUrl, setCreditRepairUrl] = useState<string>("");
  const [savingCreditRepair, setSavingCreditRepair] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [appearance, setAppearance] = useState({
    theme: "light",
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 60,
    ipWhitelist: false,
    auditLog: true,
  });

  // Hydrate Funding & Payments form from loaded user profile (privileged roles)
  useEffect(() => {
    if (!userProfile) return;
    setFundingSettings(prev => ({
      ...prev,
      merchantId: (userProfile as any).nmi_merchant_id ?? prev.merchantId,
      publicKey: (userProfile as any).nmi_public_key ?? prev.publicKey,
      apiKey: (userProfile as any).nmi_api_key ?? prev.apiKey,
      nmiUsername: (userProfile as any).nmi_username ?? prev.nmiUsername,
      // Do not populate password field
      nmiPassword: prev.nmiPassword,
      testMode: !!(userProfile as any).nmi_test_mode,
    }));
  }, [userProfile]);

  // Initialize credit repair URL input from profile
  useEffect(() => {
    setCreditRepairUrl(userProfile?.credit_repair_url || "");
  }, [userProfile?.credit_repair_url]);

  const effectiveCreditRepairUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_CREDIT_REPAIR_URL as string | undefined;
    const profileUrl = (userProfile?.credit_repair_url || "").trim();
    return profileUrl || envUrl || DEFAULT_CREDIT_REPAIR_URL;
  }, [userProfile?.credit_repair_url]);

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSaveCreditRepair = async () => {
    try {
      setSavingCreditRepair(true);
      const normalized = normalizeUrl(creditRepairUrl);
      const payload: any = {
        credit_repair_url: normalized || undefined,
      };
      const res = await authApi.updateProfile(payload);

      if ((res as any)?.error) {
        toast({
          title: "Error",
          description: (res as any)?.error || "Failed to save Credit Repair URL",
          variant: "destructive",
        });
        return;
      }

      await refreshProfile();
      toast({
        title: "Saved",
        description: "Credit Repair URL updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving credit repair url:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update Credit Repair URL",
        variant: "destructive",
      });
    } finally {
      setSavingCreditRepair(false);
    }
  };

  const handleUseDefaultCreditRepair = async () => {
    try {
      setSavingCreditRepair(true);
      setCreditRepairUrl(DEFAULT_CREDIT_REPAIR_URL);
      const res = await authApi.updateProfile({ credit_repair_url: DEFAULT_CREDIT_REPAIR_URL });

      if ((res as any)?.error) {
        toast({
          title: "Error",
          description: (res as any)?.error || "Failed to set default Credit Repair URL",
          variant: "destructive",
        });
        return;
      }

      await refreshProfile();
      toast({
        title: "Default Applied",
        description: "M2 Fico Forge set as default Credit Repair",
      });
    } catch (error: any) {
      console.error("Error setting default credit repair url:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to set default",
        variant: "destructive",
      });
    } finally {
      setSavingCreditRepair(false);
    }
  };

  // Compute logo preview URL from uploaded file or saved profile value, fallback to site logo
  const logoPreviewUrl = useMemo(() => {
    if (fundingSettings.gatewayLogoFile) {
      try {
        return URL.createObjectURL(fundingSettings.gatewayLogoFile);
      } catch {
        return (userProfile as any)?.nmi_gateway_logo || "/image.png";
      }
    }
    return (userProfile as any)?.nmi_gateway_logo || "/image.png";
  }, [fundingSettings.gatewayLogoFile, userProfile]);

  // Revoke object URL when file changes/unmount to prevent memory leaks
  useEffect(() => {
    if (!fundingSettings.gatewayLogoFile || !logoPreviewUrl) return;
    return () => {
      try { URL.revokeObjectURL(logoPreviewUrl); } catch {}
    };
  }, [fundingSettings.gatewayLogoFile, logoPreviewUrl]);

  // Sample funding charges preview data (for invoice preview only)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const sampleCardCharges = useMemo(
    () => [
      { card: "Chase Ink Business", approved: 15000, adminFeePercent: 12 },
      { card: "Amex Blue Business", approved: 8000, adminFeePercent: 10 },
      { card: "Bank of America Travel", approved: 12000, adminFeePercent: 12 },
    ],
    [],
  );

  const fundingSummary = useMemo(() => {
    const totalFunding = sampleCardCharges.reduce((sum, c) => sum + c.approved, 0);
    const totalAdminFees = sampleCardCharges.reduce(
      (sum, c) => sum + c.approved * (c.adminFeePercent / 100),
      0,
    );
    return { totalFunding, totalAdminFees };
  }, [sampleCardCharges]);

  // Save profile changes
  const saveProfile = async (profileData: any) => {
    try {
      setSaving(true);
      const response = await authApi.updateProfile(profileData);

      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to save profile changes",
          variant: "destructive",
        });
        return;
      }

      // Refresh the global auth context to update all components
      await refreshProfile();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingPassword(true);
      const response = await authApi.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error || "Failed to update password",
          variant: "destructive",
        });
        return;
      }

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    // No need to fetch user profile since we're using global auth context
    setLoading(false);
    
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setAppearance(prev => ({ ...prev, theme: savedTheme }));
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setAppearance(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${theme} mode`,
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      await authApi.uploadAvatar(file);
      
      // Refresh global auth context to update avatar across all components
      await refreshProfile();
      
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image deletion
  const handleImageDelete = async () => {
    setUploadingImage(true);
    try {
      await authApi.deleteAvatar();
      
      // Refresh global auth context to update avatar across all components
      await refreshProfile();
      
      toast({
        title: "Success",
        description: "Profile image removed successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle saving for Funding tab (persist NMI settings)
  const handleFundingSave = async () => {
    try {
      setSavingFunding(true);

      // Optional: upload gateway logo if selected
      let uploadedLogoUrl: string | undefined = undefined;
      if (fundingSettings.gatewayLogoFile) {
        const file = fundingSettings.gatewayLogoFile;
        // Basic validation: image type and <= 2MB
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Error",
            description: "Please select a valid image file.",
            variant: "destructive",
          });
          setSavingFunding(false);
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "Error",
            description: "Gateway logo must be less than 2MB.",
            variant: "destructive",
          });
          setSavingFunding(false);
          return;
        }

        const uploadRes = await authApi.uploadGatewayLogo(file);
        uploadedLogoUrl = uploadRes.data?.logoUrl;
      }

      // Prepare payload for profile update
      const payload: any = {
        nmi_merchant_id: fundingSettings.merchantId || undefined,
        nmi_public_key: fundingSettings.publicKey || undefined,
        nmi_api_key: fundingSettings.apiKey || undefined,
        nmi_username: fundingSettings.nmiUsername || undefined,
        nmi_password: fundingSettings.nmiPassword || undefined,
        nmi_test_mode: fundingSettings.testMode,
      };
      if (uploadedLogoUrl) {
        payload.nmi_gateway_logo = uploadedLogoUrl;
      }

      await authApi.updateProfile(payload);

      // Refresh profile so any derived UI can reflect changes
      await refreshProfile();

      // Clear selected file after successful save
      setFundingSettings(prev => ({ ...prev, gatewayLogoFile: null }));

      toast({
        title: "Success",
        description: "Funding settings saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving funding settings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save funding settings",
        variant: "destructive",
      });
    } finally {
      setSavingFunding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
      case "Connected":
      case "Good":
        return "bg-green-100 text-green-800 border-green-200";
      case "Warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Invited":
      case "Disconnected":
      case "Error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DashboardLayout
      title="Settings"
      description="Manage your account, preferences, and system configuration"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="agreement">Agreement</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="funding">Funding & Payments</TabsTrigger>
          <TabsTrigger value="appearance">Appearance & Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          {/* Profile Information */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="gradient-text-primary">
                  Profile Picture
                </CardTitle>
                <CardDescription>
                  Update your profile photo and display name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32">
                      <AvatarImage 
                        src={userProfile?.avatar || ''} 
                        alt={`${userProfile?.first_name} ${userProfile?.last_name}`} 
                      />
                      <AvatarFallback className="gradient-primary text-white text-2xl">
                        {userProfile?.first_name?.[0] || "U"}
                        {userProfile?.last_name?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-ocean-blue/30 text-ocean-blue hover:bg-gradient-soft"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                    {userProfile?.avatar && (
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleImageDelete}
                        disabled={uploadingImage}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>

                <div className="text-center space-y-1">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </h3>
                      <p className="text-muted-foreground">{userProfile?.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.company_name || "CreditRepair Pro"}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="gradient-text-primary">
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading profile...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            defaultValue={userProfile?.first_name || ""}
                            className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            defaultValue={userProfile?.last_name || ""}
                            className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={userProfile?.email || ""}
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed
                        </p>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        defaultValue={userProfile?.phone || ""}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        defaultValue={userProfile?.title || ""}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      defaultValue={userProfile?.company_name || ""}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      defaultValue={userProfile?.address || ""}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        defaultValue={userProfile?.city || ""}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        defaultValue={userProfile?.state || ""}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        defaultValue={userProfile?.zipCode || ""}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select defaultValue={userProfile?.country || "United States"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="United States">
                            United States
                          </SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="United Kingdom">
                            United Kingdom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue={userProfile?.timezone || "America/New_York"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset form fields to original values
                        const form = document.querySelector('form') as HTMLFormElement;
                        if (form) form.reset();
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      className="gradient-primary hover:opacity-90"
                      disabled={saving}
                      onClick={async () => {
                        const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value;
                        const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value;
                        const company = (document.getElementById('company') as HTMLInputElement)?.value;

                        if (firstName && lastName) {
                          await saveProfile({
                            first_name: firstName,
                            last_name: lastName,
                            company_name: company || undefined,
                          });
                        }
                      }}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>



        <TabsContent value="security" className="space-y-8">
          {/* Security Settings */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary">
                Security Settings
              </CardTitle>
              <CardDescription>
                Protect your account with enhanced security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Change Password
                  </Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-gradient-light border-border/40 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gradient-light border-border/40"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gradient-light border-border/40"
                    />
                    <Button
                      size="sm"
                      className="gradient-primary hover:opacity-90"
                      onClick={handlePasswordUpdate}
                      disabled={updatingPassword}
                    >
                      {updatingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="agreement" className="space-y-8">
          <AdminAgreementTab />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-8">
          {/* Integration Status */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary">
                System Integrations
              </CardTitle>
              <CardDescription>
                Monitor and manage your external service connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {integrationStatus.map((integration, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border/40 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          integration.health === "Good"
                            ? "bg-green-500"
                            : integration.health === "Warning"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last sync: {integration.lastSync}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={getStatusColor(integration.health)}
                      >
                        {integration.health}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusColor(integration.status)}
                      >
                        {integration.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Credit Repair Provider Settings */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Credit Repair Provider
              </CardTitle>
              <CardDescription>
                Configure the credit repair software URL used across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditRepairUrl">Custom URL</Label>
                  <Input
                    id="creditRepairUrl"
                    placeholder="https://your-software.example.com/"
                    value={creditRepairUrl}
                    onChange={(e) => setCreditRepairUrl(e.target.value)}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use default ({DEFAULT_CREDIT_REPAIR_URL})
                  </p>
                </div>
                <div className="border border-border/40 rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Effective URL</div>
                  <a
                    href={effectiveCreditRepairUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm break-all text-ocean-blue hover:underline"
                  >
                    {effectiveCreditRepairUrl}
                  </a>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseDefaultCreditRepair}
                  disabled={savingCreditRepair}
                  className="border-ocean-blue/30 text-ocean-blue hover:bg-gradient-soft"
                >
                  Set M2 Fico Forge default
                </Button>
                <Button
                  className="gradient-primary hover:opacity-90"
                  onClick={handleSaveCreditRepair}
                  disabled={savingCreditRepair}
                >
                  {savingCreditRepair ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save URL
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="funding" className="space-y-8">
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Funding & Payments
              </CardTitle>
              <CardDescription>
                Configure NMI gateway credentials and branding (UI only for now)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-2 block">Gateway Credentials</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="merchantId">Merchant ID</Label>
                    <Input
                      id="merchantId"
                      placeholder="e.g., 123456"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      value={fundingSettings.merchantId}
                      onChange={(e) => setFundingSettings(prev => ({ ...prev, merchantId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicKey">Public Key</Label>
                    <Input
                      id="publicKey"
                      placeholder="pk_live_..."
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      value={fundingSettings.publicKey}
                      onChange={(e) => setFundingSettings(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      placeholder="sk_live_..."
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      value={fundingSettings.apiKey}
                      onChange={(e) => setFundingSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nmiUsername">Username</Label>
                    <Input
                      id="nmiUsername"
                      placeholder="gateway username"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      value={fundingSettings.nmiUsername}
                      onChange={(e) => setFundingSettings(prev => ({ ...prev, nmiUsername: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="nmiPassword">Password</Label>
                    <Input
                      id="nmiPassword"
                      type="password"
                      placeholder="gateway password"
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      value={fundingSettings.nmiPassword}
                      onChange={(e) => setFundingSettings(prev => ({ ...prev, nmiPassword: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between border border-border/40 rounded-md p-3">
                    <div>
                      <Label className="text-base font-medium">Test Mode</Label>
                      <p className="text-sm text-muted-foreground">Use sandbox for testing payments</p>
                    </div>
                    <Switch
                      id="testMode"
                      checked={fundingSettings.testMode}
                      onCheckedChange={(checked) => setFundingSettings(prev => ({ ...prev, testMode: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-base font-medium mb-2 block">Gateway Logo</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="gatewayLogo"
                    type="file"
                    accept="image/*"
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (!file) {
                        setFundingSettings(prev => ({ ...prev, gatewayLogoFile: null }));
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        toast({ title: 'Error', description: 'Please select a valid image file.', variant: 'destructive' });
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        toast({ title: 'Error', description: 'Image size must be less than 2MB.', variant: 'destructive' });
                        return;
                      }
                      setFundingSettings(prev => ({ ...prev, gatewayLogoFile: file }));
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="border-ocean-blue/30 text-ocean-blue hover:bg-gradient-soft">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">PNG or JPG up to 2MB.</p>
              </div>

              {/* Invoice Preview with logo fallback */}
              <div className="mt-6">
                <Label className="text-base font-medium mb-2 block">Invoice Preview</Label>
                <Card className="border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={logoPreviewUrl}
                          alt="Brand logo"
                          className="h-10 w-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white"
                        />
                        <div>
                          <div className="text-sm font-semibold">Invoice Branding Preview</div>
                          <div className="text-xs text-muted-foreground">Logo displayed on funding charge invoices</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Funding Charges Preview</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Invoice #</div>
                        <div className="font-medium">INV-1001</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Due Date</div>
                        <div className="font-medium">Dec 15, 2024</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Funding</div>
                        <div className="font-medium">{formatCurrency(fundingSummary.totalFunding)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Total Admin Fees</div>
                        <div className="font-medium">{formatCurrency(fundingSummary.totalAdminFees)}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/40">
                          <tr>
                            <th className="text-left p-3 font-medium">Card</th>
                            <th className="text-right p-3 font-medium">Funding Amount</th>
                            <th className="text-right p-3 font-medium">Admin Fee (%)</th>
                            <th className="text-right p-3 font-medium">Admin Fee Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleCardCharges.map((c, idx) => {
                            const feeAmount = c.approved * (c.adminFeePercent / 100);
                            return (
                              <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="p-3">{c.card}</td>
                                <td className="p-3 text-right">{formatCurrency(c.approved)}</td>
                                <td className="p-3 text-right">{c.adminFeePercent}%</td>
                                <td className="p-3 text-right">{formatCurrency(feeAmount)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700">
                          <tr>
                            <td className="p-3 font-semibold" colSpan={3}>Total Admin Fees Due</td>
                            <td className="p-3 text-right font-semibold">{formatCurrency(fundingSummary.totalAdminFees)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Preview only • Items reflect card funding and admin fees</div>
                      <Button variant="secondary" size="sm" disabled>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button className="gradient-primary hover:opacity-90" onClick={handleFundingSave} disabled={savingFunding}>
                  {savingFunding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-8">
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Theme Preferences
              </CardTitle>
              <CardDescription>
                Customize the appearance and visual preferences of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Color Theme
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      appearance.theme === 'light' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white border rounded-md shadow-sm">
                        <Sun className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <div className="font-medium">Light Mode</div>
                        <div className="text-sm text-muted-foreground">
                          Clean and bright interface
                        </div>
                      </div>
                    </div>
                    {appearance.theme === 'light' && (
                      <div className="mt-3 flex items-center text-primary text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        Currently active
                      </div>
                    )}
                  </div>

                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      appearance.theme === 'dark' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-800 border rounded-md shadow-sm">
                        <Moon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Dark Mode</div>
                        <div className="text-sm text-muted-foreground">
                          Easy on the eyes for long sessions
                        </div>
                      </div>
                    </div>
                    {appearance.theme === 'dark' && (
                      <div className="mt-3 flex items-center text-primary text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        Currently active
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Compact Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce spacing for more content on screen
                    </p>
                  </div>
                  <Switch
                    checked={appearance.compactMode}
                    onCheckedChange={(checked) =>
                      setAppearance({ ...appearance, compactMode: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    Animations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch
                  checked={appearance.animations}
                  onCheckedChange={(checked) =>
                    setAppearance({ ...appearance, animations: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
