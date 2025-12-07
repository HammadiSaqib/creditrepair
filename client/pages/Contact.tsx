import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, HelpCircle, Building2, Globe, ArrowRight, Users, Shield, Zap, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Helmet } from 'react-helmet-async';
import Footer from '@/components/Footer';

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <Helmet>
        <title>Contact Us - Score Machine | Support & Inquiries</title>
        <meta name="description" content="Contact Score Machine for support, account assistance, or platform guidance. Our team provides help with onboarding, technical questions, and feature navigation. Typical responses within business hours." />
        <link rel="canonical" href="https://scoremachine.com/contact" />
      </Helmet>
      <SiteHeader />
      
      {/* Enhanced Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Multi-layer Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue via-sea-green to-purple-600"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">24/7 Support Available</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Questions about our
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                platform or services?
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed max-w-3xl mx-auto">
              Our team is here to assist.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-8 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">10,000+ clients served*</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm">Fast Response Times*</span>
              </div>
            </div>
            <div className="text-center mb-8 text-white/60 text-xs max-w-2xl mx-auto">
              <p>*Client count reflects cumulative users since inception. Response times may vary based on inquiry volume.</p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-ocean-blue hover:bg-white/90 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-xl backdrop-blur-sm">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left: Enhanced Quick Contact */}
            <div className="space-y-6">
              {/* Contact Methods */}
              <div className="bg-white rounded-2xl border border-gray-200/50 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-blue to-sea-green flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Quick Contact</h3>
                    <p className="text-sm text-gray-600">Get in touch instantly</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email Support</p>
                      <p className="text-sm text-gray-600">thescoremachineofficial@gmail.com</p>
                      <p className="text-xs text-green-600 font-medium">Fast response times</p>
                    </div>
                  </div>
                  
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Phone Support</p>
                      <p className="text-sm text-gray-600">(475) 259-8768</p>
                      <p className="text-xs text-green-600 font-medium">Available 9am-6pm PST</p>
                    </div>
                  </div>
                  
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Live Chat</p>
                      <p className="text-sm text-gray-600">Instant messaging</p>
                      <p className="text-xs text-green-600 font-medium">Online now</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Global Support Badge */}
              <div className="bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 rounded-2xl border border-ocean-blue/20 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue to-sea-green flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Global Support</p>
                    <p className="text-sm text-gray-600">US, Canada, UK, Australia</p>
                  </div>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-lg">
                <h4 className="font-semibold mb-4 text-gray-900">Why Choose Us?</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">High Customer Satisfaction*</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">SOC 2 Compliant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Reliable Platform</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">*Based on internal post-support surveys.</p>
              </div>
            </div>

            {/* Right: Contact Tabs and Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-blue/10 to-sea-green/10">
                      <MessageSquare className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                      Send Us a Message
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base text-gray-600">
                    Choose a topic and share a few details. We'll get back to you quickly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                      <AlertDescription className="text-green-700">Your message has been sent. We'll be in touch soon.</AlertDescription>
                    </Alert>
                  )}

                  <Tabs defaultValue="support" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-xl">
                      <TabsTrigger value="support" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        Support
                      </TabsTrigger>
                      <TabsTrigger value="sales" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        Sales
                      </TabsTrigger>
                      <TabsTrigger value="partnerships" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all">
                        Partnerships
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="support" className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                            <Input 
                              id="name" 
                              value={name} 
                              onChange={(e) => setName(e.target.value)} 
                              placeholder="Your name" 
                              className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)} 
                              placeholder="you@example.com" 
                              className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-medium text-gray-700">Describe your request</Label>
                          <Textarea 
                            id="message" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="Include goals, steps, screenshots, or URLs" 
                            rows={6} 
                            className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg resize-none"
                          />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Urgency</Label>
                            <Input placeholder="Low / Medium / High" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Workspace</Label>
                            <Input placeholder="Company or team name" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Phone (optional)</Label>
                            <Input placeholder="+1 (555) 000-0000" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                        >
                          {loading ? "Sending..." : (
                            <span className="inline-flex items-center">
                              Send Message <Send className="ml-2 h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                            <Input placeholder="Your name" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Work Email</Label>
                            <Input type="email" placeholder="you@company.com" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Company</Label>
                            <Input placeholder="Company name" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Team Size</Label>
                            <Input placeholder="e.g., 10-50" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Phone</Label>
                            <Input placeholder="+1 (555) 000-0000" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">What are you looking to achieve?</Label>
                          <Textarea placeholder="Share your goals, team size, and timeline" rows={5} className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg resize-none" />
                        </div>
                        <div className="flex gap-4">
                          <Button asChild variant="outline" className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue/5 rounded-lg px-6 py-3 h-12">
                            <a href="/pricing">View Pricing</a>
                          </Button>
                          <Button className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 h-12">
                            Request Demo
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="partnerships" className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Contact Name</Label>
                            <Input placeholder="Your name" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Business Email</Label>
                            <Input type="email" placeholder="you@company.com" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Company</Label>
                            <Input placeholder="Company name" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Partnership Type</Label>
                            <Input placeholder="Affiliate / Reseller / White Label" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Website</Label>
                            <Input placeholder="https://" className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg h-11" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Describe your partnership proposal</Label>
                          <Textarea placeholder="Share your audience, goals, and how you'd like to partner" rows={5} className="border-gray-200 focus:border-ocean-blue focus:ring-ocean-blue/20 rounded-lg resize-none" />
                        </div>
                        <Button className="bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 h-12">
                          Submit Proposal
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Office Info */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 group-hover:from-ocean-blue/20 group-hover:to-sea-green/20 transition-all duration-300">
                        <Building2 className="h-5 w-5 text-ocean-blue" />
                      </div>
                      <span className="bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                        Headquarters
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">San Francisco, CA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      123 Market St, Suite 400<br/>
                      San Francisco, CA 94103
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 group-hover:from-ocean-blue/20 group-hover:to-sea-green/20 transition-all duration-300">
                        <Clock className="h-5 w-5 text-ocean-blue" />
                      </div>
                      <span className="bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                        Response Times
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">We're here to help</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex justify-between">
                        <span>Support:</span> 
                        <span className="font-semibold text-ocean-blue">Fast response*</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Sales:</span> 
                        <span className="font-semibold text-ocean-blue">Priority*</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Partnerships:</span> 
                        <span className="font-semibold text-ocean-blue">Promptly*</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 group-hover:from-ocean-blue/20 group-hover:to-sea-green/20 transition-all duration-300">
                        <HelpCircle className="h-5 w-5 text-ocean-blue" />
                      </div>
                      <span className="bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                        Help Center
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Self-serve resources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <a href="/support" className="text-ocean-blue hover:text-sea-green transition-colors duration-200 text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Knowledge Base
                      </a>
                      <a href="/support" className="text-ocean-blue hover:text-sea-green transition-colors duration-200 text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Community Forum
                      </a>
                      <a href="/support" className="text-ocean-blue hover:text-sea-green transition-colors duration-200 text-sm font-medium flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" />
                        Status Page
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-blue/5 to-sea-green/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-ocean-blue/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sea-green/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ocean-blue/10 to-sea-green/10 rounded-full">
                  <HelpCircle className="h-4 w-4 text-ocean-blue" />
                  <span className="text-sm font-medium text-ocean-blue">FAQ</span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-ocean-blue to-sea-green bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Answers to common questions about Score Machine and your account.
                </p>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border border-gray-200 rounded-xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-ocean-blue py-6">
                    How fast do you respond?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    We aim for fast response times during office hours. For urgent issues, our premium support offers prioritized assistance.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border border-gray-200 rounded-xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-ocean-blue py-6">
                    Do you offer onboarding?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    Yes, we provide guided onboarding and comprehensive resources to help you launch your credit strategy toolkit. Our team will walk you through setup and best practices.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border border-gray-200 rounded-xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-ocean-blue py-6">
                    Is live chat available?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    Live chat is available for all paid plans and trial users during office hours (9 AM - 6 PM PST). Outside these hours, you can leave a message and we'll respond promptly.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border border-gray-200 rounded-xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-ocean-blue py-6">
                    What security measures do you have?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    We're SOC 2 compliant with enterprise-grade security including 256-bit encryption, regular security audits, and strict data privacy controls to protect your sensitive information.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border border-gray-200 rounded-xl px-6 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                  <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-ocean-blue py-6">
                    Can I cancel anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                    Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees. Your data remains accessible during your billing period.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <div className="lg:pl-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/20 to-sea-green/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-ocean-blue to-sea-green rounded-full flex items-center justify-center mx-auto">
                        <MessageSquare className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Still have questions?</h3>
                      <p className="text-gray-600">Our support team is here to help you succeed.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Customer Support Team</p>
                          <p className="text-sm text-gray-600">Dedicated specialists</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Fast Response</p>
                          <p className="text-sm text-gray-600">Prompt assistance</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Secure & Private</p>
                          <p className="text-sm text-gray-600">SOC 2 compliant</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-ocean-blue to-sea-green hover:from-ocean-blue/90 hover:to-sea-green/90 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
           <p className="text-xs">Score Machine is a software platform. We do not provide financial advice or guarantee credit score improvements.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}