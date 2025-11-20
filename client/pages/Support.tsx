import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  Send,
  Book,
  Video,
  Download,
  Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  category: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  ticket_reference_id?: number;
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

interface ChatConversation {
  user: User;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isOnline: boolean;
}

export default function Support() {
  const [activeTab, setActiveTab] = useState("livechat");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Chat-related state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [typingUsers, setTypingUsers] = useState<{userId: number; userEmail: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user ID from localStorage
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  // Mock data - in real app, this would come from API
  const supportTickets: SupportTicket[] = [
    {
      id: "TICK-001",
      subject: "Unable to generate credit report",
      status: "in-progress",
      priority: "high",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T14:20:00Z",
      category: "Technical Issue",
    },
    {
      id: "TICK-002",
      subject: "Question about dispute process",
      status: "resolved",
      priority: "medium",
      created_at: "2024-01-14T09:15:00Z",
      updated_at: "2024-01-14T16:45:00Z",
      category: "General Inquiry",
    },
  ];

  const faqItems: FAQItem[] = [
    {
      id: "faq-1",
      question: "How do I add a new client?",
      answer: "To add a new client, navigate to the Clients page and click the 'Add Client' button. Fill in the required information including name, contact details, and initial credit report data.",
      category: "Client Management",
      helpful: 45,
    },
    {
      id: "faq-2",
      question: "How long does a dispute typically take?",
      answer: "Credit disputes typically take 30-45 days to process. The credit bureaus have 30 days to investigate and respond to disputes under the Fair Credit Reporting Act.",
      category: "Disputes",
      helpful: 38,
    },
    {
      id: "faq-3",
      question: "Can I export client reports?",
      answer: "Yes, you can export client reports in PDF format. Go to the Reports section, select the client, and click the 'Export' button to download the report.",
      category: "Reports",
      helpful: 29,
    },
  ];

  // WebSocket integration for live chat
  const { connected, emit } = useWebSocket({
    enabled: activeTab === 'livechat',
    autoConnect: true,
    requireAuth: true,
    onConnect: () => {
      console.log('WebSocket connected for admin chat');
      // Load conversations when connected
      loadConversations();
    },
    onDisconnect: (reason) => {
      console.log('WebSocket disconnected:', reason);
    },
    onChatMessage: (data: any) => {
      console.log('Received chat message:', data);
      if (selectedUser && (data.senderId === selectedUser.id || data.receiverId === selectedUser.id)) {
        const newMessage: ChatMessage = {
          id: Date.now(),
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          message: data.message,
          ticket_reference_id: data.ticketReferenceId,
          is_read: false,
          created_at: data.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    },
    onUserTyping: (data: { userId: number; userEmail: string; isTyping: boolean }) => {
      if (selectedUser && data.userId === selectedUser.id) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
            userId: data.userId,
            userEmail: data.userEmail
          }]);
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      }
    },
    onUserOnlineStatus: (data: { userId: number; isOnline: boolean }) => {
      setConversations(prev => prev.map(conv => 
        conv.user.id === data.userId 
          ? { ...conv, isOnline: data.isOnline }
          : conv
      ));
    }
  });

  // Load conversations; if none exist, fall back to available chat users so admin can start new chats
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      // First try to load existing conversations
      const convRes = await fetch('/api/support/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let conversationsData: ChatConversation[] = [];
      if (convRes.ok) {
        const convData = await convRes.json();
        const rawConversations = Array.isArray(convData) ? convData : convData.conversations || [];
        conversationsData = rawConversations.map((conv: any) => ({
          user: {
            id: conv.user_id,
            name: `${conv.first_name ?? ''} ${conv.last_name ?? ''}`.trim(),
            email: conv.email || '',
            role: conv.role,
            avatar: conv.avatar || ''
          },
          lastMessage: conv.last_message ? {
            message: conv.last_message,
            created_at: conv.last_message_time
          } : undefined,
          unreadCount: conv.unread_count || 0,
          isOnline: false
        }));

        // Only show conversations with support users
        conversationsData = conversationsData.filter(c => c.user.role === 'support');
      } else {
        console.warn('Support: conversations endpoint returned status', convRes.status);
      }

      // If there are no conversations, fetch available users to seed the list
      if (conversationsData.length === 0) {
        const usersRes = await fetch('/api/support/chat/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const rawUsers = Array.isArray(usersData) ? usersData : usersData.users || [];
          conversationsData = rawUsers.map((u: any) => ({
            user: {
              id: u.id,
              name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
              email: u.email || '',
              role: u.role,
              avatar: u.avatar || ''
            },
            lastMessage: undefined,
            unreadCount: u.unread_count || 0,
            isOnline: false
          }));

          // Only list support users for initiating new chats
          conversationsData = conversationsData.filter(c => c.user.role === 'support');

          // Prefer selecting a support user first if available
          if (!selectedUser && conversationsData.length > 0) {
            const supportFirst = conversationsData.find(c => c.user.role === 'support') || conversationsData[0];
            setSelectedUser(supportFirst.user);
          }
        } else {
          console.warn('Support: users endpoint returned status', usersRes.status);
        }
      } else if (!selectedUser) {
        // Auto-select first conversation when available
        setSelectedUser(conversationsData[0].user);
      }

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations/users:', error);
      setConversations([]);
    }
  };

  // Load messages for selected user
  const loadMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/support/chat/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Failed to load messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !connected) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/support/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          message: newMessage
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Emit WebSocket event for real-time updates
        const messageData = {
          senderId: result.message.sender_id,
          receiverId: result.message.receiver_id,
          message: result.message.message,
          ticketReferenceId: result.message.ticket_reference_id,
          timestamp: result.message.created_at
        };
        
        emit('send_chat_message', messageData);
        
        // Add message to local state
        setMessages(prev => [...prev, result.message]);
        setNewMessage("");
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Join chat room when user is selected
  useEffect(() => {
    if (selectedUser && connected) {
      emit('join_chat', { userId: selectedUser.id });
    }
  }, [selectedUser, connected, emit]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Support ticket created",
        description: "Your support ticket has been submitted successfully. We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setTicketForm({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFAQs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <DashboardLayout
      onAddClient={() => setShowAddClient(true)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text-primary">Support Center</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Get help, submit tickets, and find answers to common questions
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="livechat">Live Chat</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("tickets")}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                  <CardTitle className="ml-3 text-lg">Submit Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get personalized help from our support team
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("faq")}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Book className="h-6 w-6 text-green-500" />
                  <CardTitle className="ml-3 text-lg">Browse FAQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Find quick answers to common questions
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("contact")}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Phone className="h-6 w-6 text-purple-500" />
                  <CardTitle className="ml-3 text-lg">Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Reach out via phone, email, or live chat
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(ticket.status)}
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline">
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Helpful Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <Video className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Video Tutorials</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Step-by-step guides</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">User Manual</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Complete documentation</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submit New Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Ticket</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll help you resolve it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={ticketForm.category} onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing Question</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({ ...ticketForm, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        placeholder="Please provide detailed information about your issue..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full">
                      {submitting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Support Tickets</CardTitle>
                  <CardDescription>
                    Track the status of your submitted tickets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ticket.status)}
                            <span className="font-medium">{ticket.subject}</span>
                          </div>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <span>{ticket.id}</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{ticket.status}</Badge>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search frequently asked questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      <Badge variant="outline">{faq.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">{faq.answer}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <CheckCircle className="h-4 w-4" />
                        <span>{faq.helpful} people found this helpful</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          👍 Helpful
                        </Button>
                        <Button variant="ghost" size="sm">
                          👎 Not helpful
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>
                    Choose your preferred way to contact our support team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">+1 (475) 259-8768</p>
                      <p className="text-xs text-slate-500">Mon-Fri 9AM-6PM EST</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Mail className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">thesupport@scoremachine.com</p>
                      <p className="text-xs text-slate-500">Response within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Available now</p>
                      <p className="text-xs text-slate-500">Average response: 2 minutes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Support Hours</CardTitle>
                  <CardDescription>
                    When our team is available to help
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monday - Friday</span>
                    <span className="text-slate-600 dark:text-slate-400">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Saturday</span>
                    <span className="text-slate-600 dark:text-slate-400">10:00 AM - 4:00 PM EST</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sunday</span>
                    <span className="text-slate-600 dark:text-slate-400">Closed</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Emergency Support
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      For urgent issues, submit a high-priority ticket and we'll respond within 2 hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Chat Tab */}
          <TabsContent value="livechat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Active Conversations
                    {connected && (
                      <Badge variant="outline" className="ml-2 text-green-600">
                        Online
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {conversations.filter(conversation => conversation?.user).map((conversation) => (
                      <div
                        key={conversation.user.id}
                        className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border-b ${
                          selectedUser?.id === conversation.user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => {
                          setSelectedUser(conversation.user);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.user.avatar} />
                              <AvatarFallback>
                                {conversation.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">
                                {conversation.user.name || 'Unknown User'}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {conversation.lastMessage?.message || 'No messages yet'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {conversation.lastMessage ? new Date(conversation.lastMessage.created_at).toLocaleTimeString() : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2">
                {selectedUser ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedUser.avatar} />
                          <AvatarFallback>
                            {selectedUser.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-[450px]">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => {
                          const isCurrentUser = message.sender_id === currentUserId;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isCurrentUser ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div className="flex flex-col max-w-xs lg:max-w-md">
                                {!isCurrentUser && (
                                  <p className="text-xs text-slate-500 mb-1 ml-2">
                                    {selectedUser?.name}
                                  </p>
                                )}
                                <div
                                  className={`px-4 py-2 rounded-lg ${
                                    isCurrentUser
                                      ? 'bg-blue-500 text-white rounded-br-sm'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                                  }`}
                                >
                                  <p className="text-sm">{message.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    isCurrentUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {new Date(message.created_at).toLocaleString()} (ID: {message.id})
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {typingUsers.length > 0 && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {typingUsers[0].userEmail} is typing...
                              </p>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            disabled={!connected}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || !connected}
                            size="sm"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        {!connected && (
                          <p className="text-xs text-red-500 mt-2">
                            Disconnected - trying to reconnect...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Choose a conversation from the list to start chatting
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}