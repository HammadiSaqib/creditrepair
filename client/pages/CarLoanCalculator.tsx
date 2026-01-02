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
import { Car, ArrowRight, DollarSign, Percent, Calendar } from "lucide-react";

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

export default function CarLoanCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState("32000");
  const [downPayment, setDownPayment] = useState("3000");
  const [tradeIn, setTradeIn] = useState("0");
  const [salesTaxPercent, setSalesTaxPercent] = useState("7.5");
  const [fees, setFees] = useState("600");
  const [interestRate, setInterestRate] = useState("8.0");
  const [termMonths, setTermMonths] = useState("72");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const results = useMemo(() => {
    const price = Math.max(0, parseNumber(vehiclePrice));
    const dp = Math.max(0, parseNumber(downPayment));
    const trade = Math.max(0, parseNumber(tradeIn));
    const taxPct = Math.max(0, parseNumber(salesTaxPercent));
    const feeAmount = Math.max(0, parseNumber(fees));
    const months = Math.max(0, Math.floor(parseNumber(termMonths)));
    const ratePct = Math.max(0, parseNumber(interestRate));

    const taxableBase = Math.max(0, price - trade);
    const taxAmount = (taxableBase * taxPct) / 100;

    const amountBeforeDown = taxableBase + taxAmount + feeAmount;
    const loanAmount = Math.max(0, amountBeforeDown - dp);

    const monthlyPayment = computeMonthlyPayment(loanAmount, ratePct, months);
    const totalPaid = monthlyPayment * months;
    const totalInterest = Math.max(0, totalPaid - loanAmount);

    return {
      price,
      dp,
      trade,
      taxAmount,
      feeAmount,
      loanAmount,
      months,
      monthlyPayment,
      totalPaid,
      totalInterest,
    };
  }, [vehiclePrice, downPayment, tradeIn, salesTaxPercent, fees, interestRate, termMonths]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Helmet>
        <title>Car Loan Calculator | Score Machine</title>
        <meta
          name="description"
          content="Estimate car loan amount and monthly payment including sales tax and fees."
        />
      </Helmet>

      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-700 rounded-full mb-5">
                <Car className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Car Loan Calculator</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Estimate loan amount and monthly payment including sales tax, trade-in, and fees.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-white">
                  Loan amount
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  Monthly payment
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  Total interest
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-600 to-teal-600" />
                <CardHeader className="p-6">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-700" />
                    Inputs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="vehiclePrice" className="text-slate-700">
                      Vehicle price
                    </Label>
                    <Input
                      id="vehiclePrice"
                      inputMode="decimal"
                      value={vehiclePrice}
                      onChange={(e) => setVehiclePrice(e.target.value)}
                      placeholder="32000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="downPayment" className="text-slate-700">
                        Down payment
                      </Label>
                      <Input
                        id="downPayment"
                        inputMode="decimal"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        placeholder="3000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradeIn" className="text-slate-700">
                        Trade-in value
                      </Label>
                      <Input
                        id="tradeIn"
                        inputMode="decimal"
                        value={tradeIn}
                        onChange={(e) => setTradeIn(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salesTax" className="text-slate-700 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Sales tax (%)
                      </Label>
                      <Input
                        id="salesTax"
                        inputMode="decimal"
                        value={salesTaxPercent}
                        onChange={(e) => setSalesTaxPercent(e.target.value)}
                        placeholder="7.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fees" className="text-slate-700">
                        Fees
                      </Label>
                      <Input
                        id="fees"
                        inputMode="decimal"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        placeholder="600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carRate" className="text-slate-700 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Interest rate (%)
                      </Label>
                      <Input
                        id="carRate"
                        inputMode="decimal"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="8.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carTerm" className="text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Term (months)
                      </Label>
                      <Input
                        id="carTerm"
                        inputMode="numeric"
                        value={termMonths}
                        onChange={(e) => setTermMonths(e.target.value)}
                        placeholder="72"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3 flex-wrap">
                    <Button asChild className="bg-gradient-to-r from-ocean-blue to-sea-green">
                      <Link to="/mortgage-calculator">
                        Mortgage Calculator <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/funding-calculator">Funding Calculator</Link>
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
                      <div className="text-2xl font-bold text-slate-900">{formatMoney(results.monthlyPayment)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Loan amount</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.loanAmount)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Sales tax</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.taxAmount)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Total interest</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.totalInterest)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Total paid</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.totalPaid)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Down payment</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.dp)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Fees</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.feeAmount)}</div>
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

