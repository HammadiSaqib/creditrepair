import React, { useState } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  HelpCircle, 
  FileText, 
  Video, 
  Search,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Users
} from 'lucide-react';

const Support = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    priority: '',
    description: ''
  });

  const supportTickets = [
    {
      id: 'T-2024-001',
      subject: 'Question about dispute process',
      status: 'Open',
      priority: 'Medium',
      created: '2024-01-20',
      lastUpdate: '2024-01-22'
    },
    {
      id: 'T-2024-002',
      subject: 'Credit score not updating',
      status: 'Resolved',
      priority: 'High',
      created: '2024-01-15',
      lastUpdate: '2024-01-18'
    }
  ];

  const faqs = [
    {
      question: 'How long does credit repair take?',
      answer: 'Credit repair typically takes 3-6 months, but can vary depending on the complexity of your situation and the number of items being disputed.',
      category: 'General'
    },
    {
      question: 'What is a good credit score?',
      answer: 'Credit scores range from 300-850. Generally, 670+ is considered good, 740+ is very good, and 800+ is excellent.',
      category: 'Credit Scores'
    },
    {
      question: 'How often should I check my credit report?',
      answer: 'You should check your credit report at least once a year from each bureau, but monthly monitoring is recommended for active credit repair.',
      category: 'Credit Reports'
    },
    {
      question: 'Can I dispute items myself?',
      answer: 'Yes, you can dispute items yourself, but professional credit repair services have experience and resources that can be more effective.',
      category: 'Disputes'
    }
  ];

  const resources = [
    {
      title: 'Credit Repair Guide',
      description: 'Complete guide to understanding and improving your credit',
      type: 'PDF',
      icon: FileText
    },
    {
      title: 'Dispute Letter Templates',
      description: 'Professional templates for disputing credit report errors',
      type: 'Templates',
      icon: FileText
    },
    {
      title: 'Credit Score Basics',
      description: 'Video series explaining how credit scores work',
      type: 'Video',
      icon: Video
    },
    {
      title: 'Budgeting Worksheet',
      description: 'Excel template for managing your finances',
      type: 'Excel',
      icon: FileText
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ClientLayout title="Support Center" description="Get help and find answers to your questions">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-3">Chat with our support team</p>
              <Button className="bg-green-600 hover:bg-green-700">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Phone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-3">Call us at (555) 123-4567</p>
              <Button variant="outline">
                Call Now
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Mail className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-3">Send us an email</p>
              <Button variant="outline">
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Hours */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-semibold">Support Hours</h4>
                  <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 8:00 PM EST</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Currently Open
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Find quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{faq.question}</h4>
                        <Badge variant="outline">{faq.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No FAQs found matching your search.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  View and manage your support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600">Ticket #{ticket.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 font-medium">{ticket.created}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Update:</span>
                          <span className="ml-2 font-medium">{ticket.lastUpdate}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Add Reply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Create New Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Submit a new support request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Question</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="dispute">Dispute Process</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide detailed information about your issue..."
                      rows={6}
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Submit Ticket
                    </Button>
                    <Button variant="outline">
                      Save Draft
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Resources & Downloads
                </CardTitle>
                <CardDescription>
                  Helpful guides, templates, and educational materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((resource, index) => {
                    const Icon = resource.icon;
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <Icon className="h-8 w-8 text-green-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{resource.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{resource.type}</Badge>
                              <Button size="sm" variant="outline">
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Community Forum</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Connect with other clients, share experiences, and get advice from the community.
                  </p>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Visit Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default Support;