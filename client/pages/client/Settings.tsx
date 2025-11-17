import React, { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Shield, CreditCard, Eye, Lock, Smartphone, Mail, Loader2, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authApi, billingApi } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

const Settings = () => {
  const { toast } = useToast();
  const { userProfile, refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    scoreUpdates: true,
    disputeUpdates: true,
    marketingEmails: false,
    weeklyReports: true
  });

  const [privacy, setPrivacy] = useState({
    twoFactorAuth: false,
    biometricLogin: false,
    sessionTimeout: '30',
    dataSharing: false,
    creditMonitoring: true
  });

  const [billingInfo, setBillingInfo] = useState({
    subscription: null,
    paymentMethod: null,
    history: []
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const profileResponse = await authApi.getProfile();
      if (profileResponse.data?.success && profileResponse.data?.user) {
        const userData = profileResponse.data.user;
        setProfile({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zip_code || '',
          dateOfBirth: userData.date_of_birth || ''
        });
      }

      // Load billing information
      try {
        const [subscriptionResponse, historyResponse] = await Promise.all([
          billingApi.getSubscription(),
          billingApi.getHistory()
        ]);

        if (subscriptionResponse.data) {
          setBillingInfo(prev => ({
            ...prev,
            subscription: subscriptionResponse.data
          }));
        }

        if (historyResponse.data) {
          setBillingInfo(prev => ({
            ...prev,
            history: historyResponse.data.history || []
          }));
        }
      } catch (billingError) {
        console.log('Billing data not available:', billingError);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyToggle = (key) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zipCode,
        date_of_birth: profile.dateOfBirth
      };

      const response = await authApi.updateProfile(profileData);
      
      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        throw new Error(response.data?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setSaving(true);
      
      // For now, we'll store notifications in localStorage since there's no specific endpoint
      // In a real app, you'd send this to a backend endpoint
      localStorage.setItem('user_notifications', JSON.stringify(notifications));
      
      toast({
        title: "Success",
        description: "Notification preferences saved successfully!",
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      setSaving(true);
      
      // For now, we'll store security settings in localStorage since there's no specific endpoint
      // In a real app, you'd send this to a backend endpoint
      localStorage.setItem('user_security', JSON.stringify(privacy));
      
      toast({
        title: "Success",
        description: "Security settings saved successfully!",
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: "Failed to save security settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔄 Starting image upload process...');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ File validation passed');
    setUploadingImage(true);
    try {
      console.log('📤 Calling authApi.uploadAvatar...');
      const response = await authApi.uploadAvatar(file);
      console.log('✅ Upload response:', response);
      
      console.log('🔄 Refreshing profile from server...');
      // Refresh global auth context to update avatar across all components
      await refreshProfile();
      console.log('✅ Profile refreshed');
      
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('❌ Error response:', error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      console.log('🏁 Upload process completed');
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

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('user_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
      }
    }

    const savedSecurity = localStorage.getItem('user_security');
    if (savedSecurity) {
      try {
        setPrivacy(JSON.parse(savedSecurity));
      } catch (error) {
        console.error('Error parsing saved security settings:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <ClientLayout title="Settings" description="Manage your account preferences and security settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Settings" description="Manage your account preferences and security settings">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-4 pb-6 border-b">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={userProfile?.avatar || ''} 
                        alt={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`} 
                      />
                      <AvatarFallback className="text-lg">
                        {userProfile?.first_name?.[0] || 'U'}{userProfile?.last_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
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
                            Change Photo
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
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={profile.state} onValueChange={(value) => handleProfileChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={profile.zipCode}
                      onChange={(e) => handleProfileChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button variant="outline" onClick={loadUserData}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Email Alerts</h4>
                        <p className="text-sm text-gray-600">Receive important updates via email</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.emailAlerts}
                      onCheckedChange={() => handleNotificationToggle('emailAlerts')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">SMS Alerts</h4>
                        <p className="text-sm text-gray-600">Get text messages for urgent notifications</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.smsAlerts}
                      onCheckedChange={() => handleNotificationToggle('smsAlerts')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-gray-600">Browser and mobile app notifications</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.pushNotifications}
                      onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Notification Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Credit Score Updates</h5>
                        <p className="text-sm text-gray-600">When your credit score changes</p>
                      </div>
                      <Switch 
                        checked={notifications.scoreUpdates}
                        onCheckedChange={() => handleNotificationToggle('scoreUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Dispute Updates</h5>
                        <p className="text-sm text-gray-600">Progress on your credit disputes</p>
                      </div>
                      <Switch 
                        checked={notifications.disputeUpdates}
                        onCheckedChange={() => handleNotificationToggle('disputeUpdates')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Weekly Reports</h5>
                        <p className="text-sm text-gray-600">Summary of your credit activity</p>
                      </div>
                      <Switch 
                        checked={notifications.weeklyReports}
                        onCheckedChange={() => handleNotificationToggle('weeklyReports')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Marketing Emails</h5>
                        <p className="text-sm text-gray-600">Product updates and promotions</p>
                      </div>
                      <Switch 
                        checked={notifications.marketingEmails}
                        onCheckedChange={() => handleNotificationToggle('marketingEmails')}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                   className="bg-green-600 hover:bg-green-700"
                   onClick={saveNotifications}
                   disabled={saving}
                 >
                   {saving ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Saving...
                     </>
                   ) : (
                     'Save Notification Settings'
                   )}
                 </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Switch 
                      checked={privacy.twoFactorAuth}
                      onCheckedChange={() => handlePrivacyToggle('twoFactorAuth')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Biometric Login</h4>
                        <p className="text-sm text-gray-600">Use fingerprint or face recognition</p>
                      </div>
                    </div>
                    <Switch 
                      checked={privacy.biometricLogin}
                      onCheckedChange={() => handlePrivacyToggle('biometricLogin')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Session Timeout</h4>
                      <p className="text-sm text-gray-600">Automatically log out after inactivity</p>
                    </div>
                    <Select value={privacy.sessionTimeout} onValueChange={(value) => setPrivacy(prev => ({ ...prev, sessionTimeout: value }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Privacy Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Data Sharing</h5>
                        <p className="text-sm text-gray-600">Allow sharing anonymized data for research</p>
                      </div>
                      <Switch 
                        checked={privacy.dataSharing}
                        onCheckedChange={() => handlePrivacyToggle('dataSharing')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Credit Monitoring</h5>
                        <p className="text-sm text-gray-600">Monitor your credit reports for changes</p>
                      </div>
                      <Switch 
                        checked={privacy.creditMonitoring}
                        onCheckedChange={() => handlePrivacyToggle('creditMonitoring')}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Password & Security</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Download Security Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View Login History
                    </Button>
                  </div>
                </div>

                <Button 
                   className="bg-green-600 hover:bg-green-700"
                   onClick={saveSecuritySettings}
                   disabled={saving}
                 >
                   {saving ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Saving...
                     </>
                   ) : (
                     'Save Security Settings'
                   )}
                 </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {billingInfo.subscription ? (
                   <div className="p-4 bg-green-50 rounded-lg">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="font-semibold text-green-800">
                         {billingInfo.subscription.plan_name || 'Premium Plan'}
                       </h4>
                       <span className="text-green-600 font-bold">
                         ${billingInfo.subscription.amount || '29.99'}/month
                       </span>
                     </div>
                     <p className="text-sm text-green-700">
                       Next billing date: {billingInfo.subscription.next_billing_date || 'February 15, 2024'}
                     </p>
                   </div>
                 ) : (
                   <div className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="font-semibold text-gray-800">No Active Subscription</h4>
                     </div>
                     <p className="text-sm text-gray-700">You don't have an active subscription.</p>
                   </div>
                 )}

                <div>
                  <h4 className="font-medium mb-4">Payment Method</h4>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-gray-500" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="font-medium mb-4">Billing History</h4>
                   <div className="space-y-2">
                     {billingInfo.history && billingInfo.history.length > 0 ? (
                       billingInfo.history.map((item, index) => (
                         <div key={index} className="flex items-center justify-between p-3 border rounded">
                           <div>
                             <p className="font-medium">
                               {item.date ? new Date(item.date).toLocaleDateString('en-US', { 
                                 year: 'numeric', 
                                 month: 'long' 
                               }) : `Transaction ${index + 1}`}
                             </p>
                             <p className="text-sm text-gray-600">{item.description || 'Premium Plan'}</p>
                           </div>
                           <div className="text-right">
                             <p className="font-medium">${item.amount || '29.99'}</p>
                             <Button variant="ghost" size="sm">Download</Button>
                           </div>
                         </div>
                       ))
                     ) : (
                       <>
                         <div className="flex items-center justify-between p-3 border rounded">
                           <div>
                             <p className="font-medium">January 2024</p>
                             <p className="text-sm text-gray-600">Premium Plan</p>
                           </div>
                           <div className="text-right">
                             <p className="font-medium">$29.99</p>
                             <Button variant="ghost" size="sm">Download</Button>
                           </div>
                         </div>
                         <div className="flex items-center justify-between p-3 border rounded">
                           <div>
                             <p className="font-medium">December 2023</p>
                             <p className="text-sm text-gray-600">Premium Plan</p>
                           </div>
                           <div className="text-right">
                             <p className="font-medium">$29.99</p>
                             <Button variant="ghost" size="sm">Download</Button>
                           </div>
                         </div>
                       </>
                     )}
                   </div>
                 </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Subscription Management</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Pause Subscription
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default Settings;