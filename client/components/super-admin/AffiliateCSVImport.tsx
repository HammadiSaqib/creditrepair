import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { superAdminApi } from "@/lib/api";

export default function AffiliateCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.importAffiliateCSV(file);
      setResults(Array.isArray(res.data?.results) ? res.data.results : []);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Import Affiliate Referrals & Commissions</CardTitle>
        <CardDescription>
          Upload a CSV with columns: refer by, full name, email, pay status, last paid invoice ID, invoice amount, active status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept=".csv" onChange={handleFileChange} />
        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
        {results.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-2">Results</div>
            <div className="rounded border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{r.email || ""}</td>
                      <td className="p-2">{r.status || ""}</td>
                      <td className="p-2">{r.error || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}