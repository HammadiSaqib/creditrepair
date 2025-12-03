import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { clientsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddClientDialog({ isOpen, onClose, onSuccess }: AddClientDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClient, setNewClient] = useState({
    platform: "",
    email: "",
    password: "",
    ssnLast4: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add a new client.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // First, scrape the credit report to get personal information
      console.log("Starting credit report scraping...");
      
      const scraperResponse = await fetch("/api/credit-reports/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: newClient.platform,
          credentials: {
            username: newClient.email,
            password: newClient.password,
          },
          options: {
            saveHtml: false,
            takeScreenshots: false,
            ...(((newClient.platform === "identityiq" || newClient.platform === "myscoreiq") && newClient.ssnLast4)
              ? { ssnLast4: newClient.ssnLast4 }
              : {}),
          },
          clientId: "unknown",
        }),
      });
      const contentType = scraperResponse.headers.get("content-type") || "";
      let scraperData: any = null;
      if (scraperResponse.ok) {
        if (contentType.includes("application/json")) {
          scraperData = await scraperResponse.json();
        }
      } else {
        if (scraperResponse.status === 401 || scraperResponse.status === 403) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          localStorage.removeItem("auth_token");
          navigate("/login");
          return;
        }
        if (contentType.includes("application/json")) {
          try {
            const errorData = await scraperResponse.json();
            const msg = errorData?.message || "Failed to scrape credit report";
            if (scraperResponse.status >= 500 || scraperResponse.status === 504) {
              scraperData = null;
            } else {
              throw new Error(msg);
            }
          } catch {
            if (scraperResponse.status >= 500 || scraperResponse.status === 504) {
              scraperData = null;
            } else {
              throw new Error("Failed to scrape credit report");
            }
          }
        } else {
          try { await scraperResponse.text(); } catch {}
          if (scraperResponse.status >= 500 || scraperResponse.status === 504) {
            scraperData = null;
          } else {
            throw new Error("Failed to scrape credit report");
          }
        }
      }
      if (!scraperData) {
        const start = Date.now();
        const timeoutMs = 120000;
        const intervalMs = 3000;
        let reportPath: string | null = null;
        while (Date.now() - start < timeoutMs && !reportPath) {
          const histResp = await fetch("/api/credit-reports/history", {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (histResp.ok) {
            const histJson = await histResp.json();
            const list = (histJson?.data ?? histJson) as any[];
            if (Array.isArray(list) && list.length > 0) {
              const match = list.find((item: any) =>
                String(item?.platform || '').toLowerCase() === String(newClient.platform || '').toLowerCase() &&
                String(item?.status || '').toLowerCase() === 'completed' &&
                item?.report_path
              );
              if (match) {
                reportPath = String(match.report_path);
              }
            }
          }
          if (!reportPath) {
            await new Promise((r) => setTimeout(r, intervalMs));
          }
        }
        if (reportPath) {
          const fileResp = await fetch(`/api/credit-reports/json-file?path=${encodeURIComponent(reportPath)}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (fileResp.ok) {
            const fileJson = await fileResp.json();
            scraperData = { data: fileJson?.data ?? fileJson };
          }
        }
      }
      if (!scraperData) {
        throw new Error("Scrape is taking longer than expected. Please try again shortly.");
      }
      console.log("Scraper response:", scraperData);
      console.log("Scraper response keys:", Object.keys(scraperData));
      console.log("Report data structure:", scraperData.data ? Object.keys(scraperData.data) : "No data");

      // Extract personal information from the scraped data
      let firstName = "";
      let lastName = "";
      let dateOfBirth = "";
      let address = "";
      let city = "";
      let state = "";
      let zipCode = "";
      let creditScore = 0;
      let experianScore = 0;
      let equifaxScore = 0;
      let transunionScore = 0;

      // The scraper returns data in the format: { success: true, message: "...", data: { reportData: { ... } } }
      if (scraperData.data && scraperData.data.reportData) {
        const reportData = scraperData.data.reportData;
        console.log("Found reportData, checking Name array:", reportData.Name);
        
        // Try to extract name from Name section (based on scraper structure)
        if (reportData.Name && Array.isArray(reportData.Name) && reportData.Name.length > 0) {
          // Find the primary name entry (BureauId 1 or first entry with Primary type)
          const primaryName = reportData.Name.find(name => name.NameType === "Primary") || reportData.Name[0];
          console.log("Primary name data:", primaryName);
          
          firstName = primaryName.FirstName || "";
          lastName = primaryName.LastName || "";
          console.log("Extracted names:", { firstName, lastName });
        }

        // Try to extract date of birth from DOB section
        if (reportData.DOB && Array.isArray(reportData.DOB) && reportData.DOB.length > 0) {
          const dobData = reportData.DOB[0];
          dateOfBirth = dobData.DOB || "";
          console.log("Extracted DOB:", dateOfBirth);
        }

        // Extract address information from Address section
        if (reportData.Address && Array.isArray(reportData.Address) && reportData.Address.length > 0) {
          // Find current address (AddressType === "Current") or use first address
          const currentAddress = reportData.Address.find(addr => addr.AddressType === "Current") || reportData.Address[0];
          console.log("Current address data:", currentAddress);
          
          address = currentAddress.StreetAddress || "";
          city = currentAddress.City || "";
          state = currentAddress.State || "";
          zipCode = currentAddress.Zip || "";
          console.log("Extracted address:", { address, city, state, zipCode });
        }

        // Extract bureau scores from Score section
        if (reportData.Score && Array.isArray(reportData.Score) && reportData.Score.length > 0) {
          console.log("Score data:", reportData.Score);
          
          // Map bureau IDs to scores: 1=TransUnion, 2=Experian, 3=Equifax
          reportData.Score.forEach(scoreData => {
            const score = parseInt(scoreData.Score, 10);
            if (score && score > 0) {
              switch (scoreData.BureauId) {
                case 1: // TransUnion
                  transunionScore = score;
                  break;
                case 2: // Experian
                  experianScore = score;
                  break;
                case 3: // Equifax
                  equifaxScore = score;
                  break;
              }
            }
          });
          
          // Set the primary credit score to the highest available score
          creditScore = Math.max(experianScore, equifaxScore, transunionScore);
          console.log("Extracted scores:", { 
            creditScore, 
            experianScore, 
            equifaxScore, 
            transunionScore 
          });
        }

        // Fallback: try to extract from nested reportData structure or direct data access
        if (!firstName && !lastName) {
          console.log("Trying fallback data access");
          
          // Try direct access to scraperData.data (in case reportData is at the top level)
          if (scraperData.data.Name && Array.isArray(scraperData.data.Name) && scraperData.data.Name.length > 0) {
            const primaryName = scraperData.data.Name.find(name => name.NameType === "Primary") || scraperData.data.Name[0];
            firstName = primaryName.FirstName || "";
            lastName = primaryName.LastName || "";
            console.log("Extracted names from direct data:", { firstName, lastName });
          }
          
          // Try DOB section in direct data
          if (scraperData.data.DOB && Array.isArray(scraperData.data.DOB) && scraperData.data.DOB.length > 0) {
            const dobData = scraperData.data.DOB[0];
            dateOfBirth = dobData.DOB || "";
            console.log("Extracted DOB from direct data:", dateOfBirth);
          }

          // Try Address section in direct data
          if (scraperData.data.Address && Array.isArray(scraperData.data.Address) && scraperData.data.Address.length > 0) {
            const currentAddress = scraperData.data.Address.find(addr => addr.AddressType === "Current") || scraperData.data.Address[0];
            address = currentAddress.StreetAddress || "";
            city = currentAddress.City || "";
            state = currentAddress.State || "";
            zipCode = currentAddress.Zip || "";
            console.log("Extracted address from direct data:", { address, city, state, zipCode });
          }

          // Try Score section in direct data
          if (scraperData.data.Score && Array.isArray(scraperData.data.Score) && scraperData.data.Score.length > 0) {
            scraperData.data.Score.forEach(scoreData => {
              const score = parseInt(scoreData.Score, 10);
              if (score && score > 0) {
                switch (scoreData.BureauId) {
                  case 1: transunionScore = score; break;
                  case 2: experianScore = score; break;
                  case 3: equifaxScore = score; break;
                }
              }
            });
            creditScore = Math.max(experianScore, equifaxScore, transunionScore);
            console.log("Extracted scores from direct data:", { creditScore, experianScore, equifaxScore, transunionScore });
          }
          
          // Try nested reportData structure
          if (!firstName && !lastName && reportData.reportData) {
            console.log("Trying nested reportData structure");
            const nestedReportData = reportData.reportData;
            
            // Try Name section in nested data
            if (nestedReportData.Name && Array.isArray(nestedReportData.Name) && nestedReportData.Name.length > 0) {
              const primaryName = nestedReportData.Name.find(name => name.NameType === "Primary") || nestedReportData.Name[0];
              firstName = primaryName.FirstName || "";
              lastName = primaryName.LastName || "";
              console.log("Extracted names from nested:", { firstName, lastName });
            }
            
            // Try DOB section in nested data
            if (nestedReportData.DOB && Array.isArray(nestedReportData.DOB) && nestedReportData.DOB.length > 0) {
              const dobData = nestedReportData.DOB[0];
              dateOfBirth = dobData.DOB || "";
              console.log("Extracted DOB from nested:", dateOfBirth);
            }

            // Try Address section in nested data
            if (nestedReportData.Address && Array.isArray(nestedReportData.Address) && nestedReportData.Address.length > 0) {
              const currentAddress = nestedReportData.Address.find(addr => addr.AddressType === "Current") || nestedReportData.Address[0];
              address = currentAddress.StreetAddress || "";
              city = currentAddress.City || "";
              state = currentAddress.State || "";
              zipCode = currentAddress.Zip || "";
              console.log("Extracted address from nested:", { address, city, state, zipCode });
            }

            // Try Score section in nested data
            if (nestedReportData.Score && Array.isArray(nestedReportData.Score) && nestedReportData.Score.length > 0) {
              nestedReportData.Score.forEach(scoreData => {
                const score = parseInt(scoreData.Score, 10);
                if (score && score > 0) {
                  switch (scoreData.BureauId) {
                    case 1: transunionScore = score; break;
                    case 2: experianScore = score; break;
                    case 3: equifaxScore = score; break;
                  }
                }
              });
              creditScore = Math.max(experianScore, equifaxScore, transunionScore);
              console.log("Extracted scores from nested:", { creditScore, experianScore, equifaxScore, transunionScore });
            }
          }
        }
      }

      // Additional fallback: try direct access to scraperData.data if no reportData wrapper
      if (!firstName && !lastName && scraperData.data) {
        console.log("Trying direct scraperData.data access");
        
        if (scraperData.data.Name && Array.isArray(scraperData.data.Name) && scraperData.data.Name.length > 0) {
          const primaryName = scraperData.data.Name.find(name => name.NameType === "Primary") || scraperData.data.Name[0];
          firstName = primaryName.FirstName || "";
          lastName = primaryName.LastName || "";
          console.log("Extracted names from scraperData.data:", { firstName, lastName });
        }
        
        if (scraperData.data.DOB && Array.isArray(scraperData.data.DOB) && scraperData.data.DOB.length > 0) {
          const dobData = scraperData.data.DOB[0];
          dateOfBirth = dobData.DOB || "";
          console.log("Extracted DOB from scraperData.data:", dateOfBirth);
        }

        if (scraperData.data.Address && Array.isArray(scraperData.data.Address) && scraperData.data.Address.length > 0) {
          const currentAddress = scraperData.data.Address.find(addr => addr.AddressType === "Current") || scraperData.data.Address[0];
          address = currentAddress.StreetAddress || "";
          city = currentAddress.City || "";
          state = currentAddress.State || "";
          zipCode = currentAddress.Zip || "";
          console.log("Extracted address from scraperData.data:", { address, city, state, zipCode });
        }

        if (scraperData.data.Score && Array.isArray(scraperData.data.Score) && scraperData.data.Score.length > 0) {
          scraperData.data.Score.forEach(scoreData => {
            const score = parseInt(scoreData.Score, 10);
            if (score && score > 0) {
              switch (scoreData.BureauId) {
                case 1: transunionScore = score; break;
                case 2: experianScore = score; break;
                case 3: equifaxScore = score; break;
              }
            }
          });
          creditScore = Math.max(experianScore, equifaxScore, transunionScore);
          console.log("Extracted scores from scraperData.data:", { creditScore, experianScore, equifaxScore, transunionScore });
        }
      }

      console.log("Final extracted data:", { 
        firstName, 
        lastName, 
        dateOfBirth, 
        address, 
        city, 
        state, 
        zipCode, 
        creditScore,
        experianScore,
        equifaxScore,
        transunionScore
      });

      if (!firstName && !lastName) {
        const emailLocal = (newClient.email || '').split('@')[0] || '';
        const parts = emailLocal.replace(/[^a-zA-Z._\-\s]/g, ' ').split(/[._\-\s]+/).filter(Boolean);
        if (parts.length >= 2) {
          const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
          firstName = cap(parts[0]);
          lastName = cap(parts[1]);
        } else if (parts.length === 1) {
          const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
          firstName = cap(parts[0]);
          lastName = "Unknown";
        } else {
          firstName = "Unknown";
          lastName = "Client";
        }
      }

      const hadReportInfo = Boolean(firstName || dateOfBirth || address || creditScore || experianScore || equifaxScore || transunionScore);
      const notesMessage = hadReportInfo
        ? `Client created via credit report scraping from ${newClient.platform}. Bureau Scores - Experian: ${experianScore || 'N/A'}, Equifax: ${equifaxScore || 'N/A'}, TransUnion: ${transunionScore || 'N/A'}`
        : `Client created without attached report due to temporary scraper error on ${newClient.platform}. You can retry scraping from the client profile.`;

      const clientData = {
        first_name: firstName,
        last_name: lastName,
        email: newClient.email,
        date_of_birth: dateOfBirth || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zip_code: zipCode || undefined,
        credit_score: creditScore > 0 ? creditScore : undefined,
        experian_score: experianScore > 0 ? experianScore : undefined,
        equifax_score: equifaxScore > 0 ? equifaxScore : undefined,
        transunion_score: transunionScore > 0 ? transunionScore : undefined,
        status: "active" as const,
        platform: newClient.platform,
        platform_email: newClient.email,
        platform_password: newClient.password,
        notes: notesMessage,
      };

      console.log("Creating client with extracted data:", clientData);
      const response = await clientsApi.createClient(clientData);
      console.log("Create client response:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      // Reset form and close modal
      setNewClient({
        platform: "",
        email: "",
        password: "",
        ssnLast4: "",
      });
      onClose();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      toast({
        title: "Success!",
        description: hadReportInfo
          ? `Client ${firstName} ${lastName} has been added with credit report details.`
          : `Client ${firstName} ${lastName} has been added without report; you can retry scraping from the client profile.`,
      });

      // Redirect to the client's credit report page
      const clientId = response.data?.id || response.id;
      const clientName = `${firstName} ${lastName}`;
      if (clientId) {
        navigate(`/credit-report?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}`);
      }
    } catch (error: any) {
      console.error("Error adding client:", error);
      
      // Handle quota exceeded error specifically
      if (error.response?.status === 403 && error.response?.data?.error === 'Client quota exceeded') {
        const planLimits = error.response.data.planLimits;
        toast({
          title: "Client Quota Exceeded",
          description: error.response.data.message || `You have reached the maximum of ${planLimits?.maxClients || 1} client(s) allowed on your plan. Please upgrade to add more clients.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Adding Client",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setNewClient({
      platform: "",
      email: "",
      password: "",
      ssnLast4: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text-primary">
            Add New Client
          </DialogTitle>
          <DialogDescription>
            Enter the client's credit monitoring platform credentials to automatically import their information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitClient} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Credit Monitoring Platform</Label>
              <Select
                value={newClient.platform}
                onValueChange={(value) =>
                  setNewClient({ ...newClient, platform: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="myfreescorenow">My Free Score Now</SelectItem>
                  <SelectItem value="identityiq">IdentityIQ</SelectItem>
                  <SelectItem value="myscoreiq">MyScoreIQ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Platform Email/Username</Label>
              <Input
                id="email"
                type="email"
                value={newClient.email}
                onChange={(e) =>
                  setNewClient({ ...newClient, email: e.target.value })
                }
                placeholder="Enter platform email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Platform Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newClient.password}
                  onChange={(e) =>
                    setNewClient({ ...newClient, password: e.target.value })
                  }
                  placeholder="Enter platform password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {(newClient.platform === "identityiq" || newClient.platform === "myscoreiq") && (
              <div className="space-y-2">
                <Label htmlFor="ssnLast4">SSN Last 4 *</Label>
                <Input
                  id="ssnLast4"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="off"
                  title="Please enter 4 digits (e.g., 1234)"
                  value={newClient.ssnLast4}
                  onChange={(e) =>
                    setNewClient({ ...newClient, ssnLast4: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  placeholder="1234"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding Client..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
