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
import { Home, ArrowRight, DollarSign, Percent, Calendar } from "lucide-react";

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

export default function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState("450000");
  const [downPayment, setDownPayment] = useState("20");
  const [downPaymentIsPercent, setDownPaymentIsPercent] = useState(true);
  const [interestRate, setInterestRate] = useState("6.5");
  const [termYears, setTermYears] = useState("30");
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState("4800");
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState("1800");
  const [pmiRateAnnual, setPmiRateAnnual] = useState("0.5");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const results = useMemo(() => {
    const price = Math.max(0, parseNumber(homePrice));
    const dpRaw = Math.max(0, parseNumber(downPayment));
    const dpAmount = downPaymentIsPercent ? (price * dpRaw) / 100 : dpRaw;
    const loanAmount = Math.max(0, price - dpAmount);
    const years = Math.max(0, Math.floor(parseNumber(termYears)));
    const months = years * 12;
    const ratePct = Math.max(0, parseNumber(interestRate));
    const principalAndInterest = computeMonthlyPayment(loanAmount, ratePct, months);

    const taxMonthly = Math.max(0, parseNumber(propertyTaxAnnual)) / 12;
    const insuranceMonthly = Math.max(0, parseNumber(homeInsuranceAnnual)) / 12;

    const loanToValue = price > 0 ? loanAmount / price : 0;
    const pmiMonthly =
      loanToValue > 0.8 ? (loanAmount * (Math.max(0, parseNumber(pmiRateAnnual)) / 100)) / 12 : 0;

    const totalMonthly = principalAndInterest + taxMonthly + insuranceMonthly + pmiMonthly;

    return {
      price,
      dpAmount,
      loanAmount,
      months,
      years,
      ratePct,
      principalAndInterest,
      taxMonthly,
      insuranceMonthly,
      pmiMonthly,
      totalMonthly,
    };
  }, [homePrice, downPayment, downPaymentIsPercent, interestRate, termYears, propertyTaxAnnual, homeInsuranceAnnual, pmiRateAnnual]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Helmet>
        <title>Mortgage Calculator | Score Machine</title>
        <meta
          name="description"
          content="Estimate monthly mortgage payment including principal, interest, taxes, insurance, and PMI."
        />
      </Helmet>

      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-full mb-5">
                <Home className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Mortgage Calculator</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Estimate monthly mortgage payment including taxes, insurance, and PMI.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-white">
                  P&amp;I + Taxes + Insurance
                </Badge>
                <Badge variant="secondary" className="bg-white">
                  PMI when down payment &lt; 20%
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-teal-600" />
                <CardHeader className="p-6">
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-700" />
                    Inputs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="homePrice" className="text-slate-700">
                      Home price
                    </Label>
                    <Input
                      id="homePrice"
                      inputMode="decimal"
                      value={homePrice}
                      onChange={(e) => setHomePrice(e.target.value)}
                      placeholder="450000"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Label htmlFor="downPayment" className="text-slate-700">
                        Down payment
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={downPaymentIsPercent ? "default" : "outline"}
                          onClick={() => setDownPaymentIsPercent(true)}
                          className="h-8 px-3"
                        >
                          %
                        </Button>
                        <Button
                          type="button"
                          variant={!downPaymentIsPercent ? "default" : "outline"}
                          onClick={() => setDownPaymentIsPercent(false)}
                          className="h-8 px-3"
                        >
                          $
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="downPayment"
                      inputMode="decimal"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder={downPaymentIsPercent ? "20" : "90000"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mortgageRate" className="text-slate-700 flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Interest rate (%)
                      </Label>
                      <Input
                        id="mortgageRate"
                        inputMode="decimal"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="6.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termYears" className="text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Term (years)
                      </Label>
                      <Input
                        id="termYears"
                        inputMode="numeric"
                        value={termYears}
                        onChange={(e) => setTermYears(e.target.value)}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyTax" className="text-slate-700">
                        Property tax (annual)
                      </Label>
                      <Input
                        id="propertyTax"
                        inputMode="decimal"
                        value={propertyTaxAnnual}
                        onChange={(e) => setPropertyTaxAnnual(e.target.value)}
                        placeholder="4800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance" className="text-slate-700">
                        Home insurance (annual)
                      </Label>
                      <Input
                        id="insurance"
                        inputMode="decimal"
                        value={homeInsuranceAnnual}
                        onChange={(e) => setHomeInsuranceAnnual(e.target.value)}
                        placeholder="1800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pmiRate" className="text-slate-700">
                      PMI rate (annual %)
                    </Label>
                    <Input
                      id="pmiRate"
                      inputMode="decimal"
                      value={pmiRateAnnual}
                      onChange={(e) => setPmiRateAnnual(e.target.value)}
                      placeholder="0.5"
                    />
                  </div>

                  <div className="pt-2 flex gap-3 flex-wrap">
                    <Button asChild className="bg-gradient-to-r from-ocean-blue to-sea-green">
                      <Link to="/funding-calculator">
                        Funding Calculator <ArrowRight className="ml-2 w-4 h-4" />
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
                      <div className="text-sm text-slate-600">Estimated total monthly payment</div>
                      <div className="text-2xl font-bold text-slate-900">{formatMoney(results.totalMonthly)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Loan amount</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.loanAmount)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Down payment</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.dpAmount)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Principal &amp; interest</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {formatMoney(results.principalAndInterest)}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">PMI</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.pmiMonthly)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Taxes</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.taxMonthly)}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200">
                        <div className="text-sm text-slate-600">Insurance</div>
                        <div className="text-lg font-semibold text-slate-900">{formatMoney(results.insuranceMonthly)}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200">
                      <div className="text-sm text-slate-600">Term</div>
                      <div className="text-lg font-semibold text-slate-900">{results.years} years</div>
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

