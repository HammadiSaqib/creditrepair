import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, DollarSign, Percent, Calendar } from "lucide-react";

function parseNumber(value: string): number {
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function computeMonthlyPayment(principal: number, aprPercent: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = aprPercent > 0 ? aprPercent / 100 / 12 : 0;
  if (monthlyRate === 0) return principal / termMonths;
  const r = monthlyRate;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

export default function FundingCalculator() {
  const [amount, setAmount] = useState("25000");
  const [apr, setApr] = useState("12.5");
  const [termMonths, setTermMonths] = useState("36");
  const [originationFeePercent, setOriginationFeePercent] = useState("0");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const results = useMemo(() => {
    const principal = parseNumber(amount);
    const aprPct = parseNumber(apr);
    const months = Math.max(0, Math.floor(parseNumber(termMonths)));
    const feePct = Math.max(0, parseNumber(originationFeePercent));
    const feeAmount = (principal * feePct) / 100;
    const financed = principal + feeAmount;
    const monthlyPayment = computeMonthlyPayment(financed, aprPct, months);
    const totalPaid = monthlyPayment * months;
    const totalInterest = Math.max(0, totalPaid - financed);

    return {
      principal,
      feeAmount,
      financed,
      months,
      aprPct,
      monthlyPayment,
      totalPaid,
      totalInterest,
    };
  }, [amount, apr, termMonths, originationFeePercent]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Helmet>
        <title>Funding Calculator | Score Machine</title>
        <meta
          name="description"
          content="Estimate monthly payments and total cost for a funding amount based on APR and term."
        />
      </Helmet>

      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-teal-100 text-teal-700 rounded-full mb-5">
                <Calculator className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Funding Calculator</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Enter a funding amount, APR, and term to estimate monthly payment and total cost.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-white">
                  Estimated payment
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  Total interest
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  Total paid
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-teal-600 to-emerald-600" />
                <CardHeader className="p-6">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-teal-700" />
                    Inputs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fundingAmount" className="text-slate-700">
                      Funding amount
                    </Label>
                    <Input
                      id="fundingAmount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="25000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fundingApr" className="text-slate-700 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        APR (%)
                      </Label>
                      <Input
                        id="fundingApr"
                        inputMode="decimal"
                        value={apr}
                        onChange={(e) => setApr(e.target.value)}
                        placeholder="12.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingTerm" className="text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Term (months)
                      </Label>
                      <Input
                        id="fundingTerm"
                        inputMode="numeric"
                        value={termMonths}
                        onChange={(e) => setTermMonths(e.target.value)}
                        placeholder="36"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundingFee" className="text-slate-700">
                      Origination fee (%)
                    </Label>
                    <Input
                      id="fundingFee"
                      inputMode="decimal"
                      value={originationFeePercent}
                      onChange={(e) => setOriginationFeePercent(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="pt-2 flex gap-3 flex-wrap">
                    <Button asChild className="bg-gradient-to-r from-ocean-blue to-sea-green">
                      <Link to="/mortgage-calculator">
                        Mortgage Calculator <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/car-loan-calculator">Car Loan Calculator</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-ocean-blue to-sea-green" />
                <CardHeader className="p-6">
                  <CardTitle className="text-xl text-slate-900">Results</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-sm text-slate-600">Estimated monthly payment</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatMoney(results.monthlyPayment)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Financed amount</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.financed)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Origination fee</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.feeAmount)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Total interest</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {formatMoney(results.totalInterest)}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Total paid</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.totalPaid)}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200">
                      <div className="text-sm text-slate-600">Term</div>
                      <div className="text-lg font-semibold text-slate-900">{results.months} months</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

