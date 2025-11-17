import { useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import PaymentForm from "@/components/PaymentForm";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import Groups from "@/components/community/Groups";
import AdminCalendar from "@/components/AdminCalendar";
import { authApi, User, coursesApi, Course, calendarApi, CalendarEvent, billingApi, schoolManagementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Users,
  Star,
  Award,
  Target,
  Zap,
  Crown,
  Medal,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Lock,
  Plus,
  Edit,
  Trash2,
  X,
  MessageSquare,
  ThumbsUp,
  Reply,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Gift,
  Sparkles,
  Flame,
  Heart,
  Coffee,
  Rocket,
  Brain,
  Lightbulb,
  Diamond,
  Shield,
  Gem,
  ChevronRight,
  PlayCircle,
  FileText,
  Video,
  HelpCircle,
  Share2,
  Download,
  Eye,
  UserPlus,
  Settings,
  MoreHorizontal,
  ArrowRight,
  School as SchoolIcon,
  Coins,
  MapPin,
  Navigation,
  Globe,
  Phone,
  Mail,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  CalendarPlus,
  UserCheck,
  UserX,
  Building,
  Home,
  Car,
  Briefcase,
  Pin,
  Info,
  AlertCircle,
  ExternalLink,
  Send,
  Bell,
  BellRing,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserStats {
  totalPoints: number;
  currentStreak: number;
  coursesCompleted: number;
  badgesEarned: number;
  communityRank: number;
  weeklyPoints: number;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earned: boolean;
  earnedDate?: string;
  requirements: string;
  points: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  rating: number;
  enrolled: number;
  chapters: number;
  progress: number;
  points: number;
  image: string;
  isEnrolled: boolean;
  isCompleted: boolean;
  featured: boolean;
  // New fields for enhanced functionality
  price: number;
  originalPrice?: number;
  isPaid: boolean;
  thumbnail: string;
  videoUrl?: string;
  documents: {
    id: number;
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'ppt' | 'other';
    size: string;
  }[];
  hasQuiz: boolean;
  quizCompleted: boolean;
  quizScore?: number;
  category: string;
  // Quiz questions structure
  quizQuestions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

interface Chapter {
  id: number;
  courseId: number;
  title: string;
  description: string;
  duration: string;
  type: "video" | "text" | "quiz" | "assignment";
  isCompleted: boolean;
  isLocked: boolean;
  points: number;
  order: number;
}

interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string;
  points: number;
  badges: number;
  coursesCompleted: number;
  rank: number;
  weeklyGain: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  category: string;
  replies: number;
  likes: number;
  views: number;
  createdAt: string;
  isAnswered: boolean;
  isPinned: boolean;
  tags: string[];
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  type: "webinar" | "workshop" | "office_hours" | "exam" | "meetup" | "deadline" | "meeting" | "physical_event" | "report_pull" | "other";
  instructor?: string;
  location?: string;
  isVirtual: boolean;
  isPhysical?: boolean;
  attendees: number;
  maxAttendees?: number;
  isRegistered: boolean;
  meetingLink?: string;
  visibleToAdmins?: boolean;
}

interface LearningPath {
  id: number;
  name: string;
  type: "fundamental" | "advanced" | "specialized" | "certification";
  description: string;
  totalCourses: number;
  completedCourses: number;
  estimatedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites?: string[];
  skills: string[];
  isEnrolled: boolean;
  progress: number;
  nextCourse?: {
    id: number;
    title: string;
    estimatedTime: string;
  };
}

interface CourseMap {
  id: number;
  courseId: number;
  courseName: string;
  chapters: {
    id: number;
    title: string;
    isCompleted: boolean;
    isCurrently: boolean;
    isLocked: boolean;
    estimatedTime: string;
    type: "video" | "reading" | "quiz" | "assignment";
  }[];
  overallProgress: number;
  timeSpent: string;
  estimatedRemaining: string;
}

export default function School() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const subscriptionStatus = useSubscriptionStatus();
  const [activeTab, setActiveTab] = useState("community");
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Subscription and enrollment state
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  
  // Video player modal state
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  
  // Quiz modal state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuizCourse, setCurrentQuizCourse] = useState<Course | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string | number>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: '',
    points: 0,
    is_featured: false,
    chapters: [{ title: 'Introduction', content: '', duration: '' }]
  });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [courseFormErrors, setCourseFormErrors] = useState<Record<string, string>>({});

  // Payment state management
  const [stripe, setStripe] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
    planName: string;
    courseId?: number;
  } | null>(null);

  // Calendar state management


  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    currentStreak: 0,
    coursesCompleted: 0,
    badgesEarned: 0,
    communityRank: 0,
    weeklyPoints: 0,
  });


  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getProfile();
        if (response.data) {
          setCurrentUser(response.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast]);

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (stripePublishableKey) {
          const stripeInstance = await loadStripe(stripePublishableKey);
          setStripe(stripeInstance);
        } else {
          console.warn('Stripe publishable key not found in environment variables');
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    };

    initializeStripe();
  }, []);

  // Fetch user subscription and enrollment data
  useEffect(() => {
    const fetchSubscriptionAndEnrollment = async () => {
      try {
        setSubscriptionLoading(true);
        
        // Fetch user subscription
        const subscriptionResponse = await billingApi.getSubscription();
        if (subscriptionResponse.data) {
          setUserSubscription(subscriptionResponse.data);
        }
        
        // Fetch enrolled courses
        const enrolledResponse = await coursesApi.getEnrolledCourses();
        // coursesApi.getEnrolledCourses uses fetch() and returns raw JSON (array)
        if (Array.isArray(enrolledResponse)) {
          const enrolledIds = enrolledResponse.map((course: any) => Number(course.id));
          setEnrolledCourses(enrolledIds);
        } else if (enrolledResponse && Array.isArray((enrolledResponse as any).data)) {
          // Fallback in case shape differs
          const enrolledIds = (enrolledResponse as any).data.map((course: any) => Number(course.id));
          setEnrolledCourses(enrolledIds);
        }
      } catch (error) {
        console.error('Failed to fetch subscription and enrollment data:', error);
        // Don't show error toast as this is not critical for basic functionality
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscriptionAndEnrollment();
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await schoolManagementApi.getLeaderboard();
        const payload = response?.data || response;
        const lb = payload?.data?.leaderboard ?? [];
        const stats = payload?.data?.yourStats ?? {
          totalPoints: 0,
          currentStreak: 0,
          coursesCompleted: 0,
          badgesEarned: 0,
          communityRank: 0,
          weeklyPoints: 0,
        };
        setLeaderboard(lb);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        toast({
          title: 'Leaderboard Unavailable',
          description: 'Unable to load leaderboard at the moment.',
          variant: 'destructive',
        });
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [toast]);

  // Fetch courses from backend
  const fetchCourses = async () => {
      try {
        console.log('🔄 Starting course fetch...');
        setCoursesLoading(true);
    const response = await coursesApi.getCourses();
    console.log('📡 API Response:', response);
    
    // coursesApi.getCourses uses fetch() and returns raw JSON with { success, data: { courses } }
    const coursesArray = (response && response.success && response.data?.courses && Array.isArray(response.data.courses))
      ? response.data.courses
      : (Array.isArray((response as any)?.courses) ? (response as any).courses : []);
    
    if (Array.isArray(coursesArray) && coursesArray.length >= 0) {
      console.log('✅ Valid response data received:', coursesArray.length, 'courses');
      
      // Transform backend data to match frontend interface and check enrollment status
      const transformedCourses = await Promise.all(coursesArray.map(async (course: any) => {
        // Check enrollment status for each course
        let isEnrolled = false;
        let progress = 0;
        try {
          const enrollmentResponse = await coursesApi.checkEnrollment(course.id);
          // coursesApi.checkEnrollment uses fetch() and returns raw JSON { isEnrolled, enrollment }
          isEnrolled = (enrollmentResponse as any)?.isEnrolled || false;
          progress = (enrollmentResponse as any)?.enrollment?.progress || 0;
        } catch (error) {
          console.warn(`Failed to check enrollment for course ${course.id}:`, error);
          // Default to false if check fails
          isEnrolled = false;
        }

            const transformed = {
              id: course.id,
              title: course.title,
              description: course.description,
              instructor: course.instructor,
              duration: course.duration?.toString() || '0 mins',
              difficulty: course.difficulty,
              rating: 4.5, // Default rating since not in backend
              enrolled: 0, // Default enrolled count
              chapters: course.chapters || 0,
              progress: progress, // Use actual progress from enrollment
              points: course.points || 0,
              // Prefer backend thumbnail_url; fall back to image_url; finally to a valid local placeholder
              image: (course.thumbnail_url && course.thumbnail_url !== '/placeholder-course.jpg')
                ? course.thumbnail_url
                : (course.image_url && course.image_url !== '/placeholder-course.jpg')
                  ? course.image_url
                  : 'uploads/school/default_thumbnil.png',
              isEnrolled: isEnrolled, // Use actual enrollment status
              isCompleted: progress >= 100, // Mark as completed if progress is 100%
              featured: Boolean(course.featured),
              // New fields for enhanced functionality
              price: course.price || 0,
              originalPrice: course.original_price,
              isPaid: !course.is_free, // Backend returns is_free, so we invert it to get isPaid
              // Use thumbnail_url when available; avoid broken '/placeholder-course.jpg' by falling back to '/placeholder.svg'
              thumbnail: (course.thumbnail_url && course.thumbnail_url !== '/placeholder-course.jpg')
                ? course.thumbnail_url
                : (course.thumbnail && course.thumbnail !== '/placeholder-course.jpg')
                  ? course.thumbnail
                  : (course.image_url && course.image_url !== '/placeholder-course.jpg')
                    ? course.image_url
                    : 'uploads/school/default_thumbnil.png',
              videoUrl: course.video_url,
              documents: course.documents || [],
              hasQuiz: course.has_quiz || false,
              quizCompleted: course.quiz_completed || false,
              quizScore: course.quiz_score,
              category: course.category || 'General',
              // Sample quiz questions for demonstration
              quizQuestions: course.quiz_questions || [
                {
                  id: 1,
                  question: "What is the most important factor in credit scoring?",
                  type: 'multiple-choice' as const,
                  options: ["Payment history", "Credit utilization", "Length of credit history", "Types of credit"],
                  correctAnswer: 0,
                  explanation: "Payment history accounts for 35% of your credit score and is the most important factor.",
                  points: 10
                },
                {
                  id: 2,
                  question: "Credit utilization should be kept below what percentage?",
                  type: 'multiple-choice' as const,
                  options: ["10%", "30%", "50%", "70%"],
                  correctAnswer: 1,
                  explanation: "Keeping credit utilization below 30% is recommended for a good credit score.",
                  points: 10
                },
                {
                  id: 3,
                  question: "Closing old credit cards always improves your credit score.",
                  type: 'true-false' as const,
                  options: ["True", "False"],
                  correctAnswer: 1,
                  explanation: "False. Closing old cards can actually hurt your score by reducing your credit history length and available credit.",
                  points: 10
                }
              ]
            };
            console.log(`Course ${course.title}: enrolled=${isEnrolled}, progress=${progress}%`);
            return transformed;
          }));
          
          console.log('📚 Setting courses state with', transformedCourses.length, 'courses');
          console.log('⭐ Featured courses:', transformedCourses.filter(c => c.featured).length);
      setCourses(transformedCourses);
    } else {
      console.warn('❌ Invalid response structure:', response);
      // Ensure courses is always an array, even on error
      setCourses([]);
      if (response.error) {
        console.error('🚨 API Error:', response.error);
        toast({
          title: "Error",
          description: response.error || "Failed to load courses",
          variant: "destructive",
        });
      }
    }
  } catch (error) {
        console.error('💥 Failed to fetch courses:', error);
        // Ensure courses is always an array, even on error
        setCourses([]);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      } finally {
        console.log('🏁 Course fetch completed');
        setCoursesLoading(false);
      }
  };

  useEffect(() => {
    fetchCourses();
  }, [toast]);

  // Helper functions for course access logic
  const isCourseInSubscriptionPlan = (courseId: number): boolean => {
    if (!userSubscription || !userSubscription.plan) return false;
    
    // Check if the subscription plan includes this course
    // This assumes the subscription plan has a 'courses' or 'includedCourses' array
    const includedCourses = userSubscription.plan.courses || userSubscription.plan.includedCourses || [];
    return includedCourses.some((course: any) => course.id === courseId || course === courseId);
  };

  const isCourseEnrolled = (courseId: number): boolean => {
    // Compare with numeric normalization to handle potential string IDs
    return enrolledCourses.some((id) => Number(id) === Number(courseId));
  };

  const canAccessCourse = (course: Course): boolean => {
    // User can access course if:
    // 1. Course is included in their subscription plan, OR
    // 2. They have individually enrolled/purchased the course, OR
    // 3. Course is free
    // Use both course.isEnrolled (from per-course check) and enrolledCourses state for robustness
    return (
      isCourseInSubscriptionPlan(course.id) ||
      course.isEnrolled ||
      isCourseEnrolled(course.id) ||
      !course.isPaid
    );
  };

  const getCourseButtonText = (course: Course): string => {
    if (canAccessCourse(course)) {
      return course.progress > 0 ? "Continue Course" : "Start Course";
    }
    return "Purchase Now";
  };

  const handleCourseAction = (course: Course) => {
    if (canAccessCourse(course)) {
      // Navigate to course page
      navigate(`/course/${course.id}`);
    } else {
      // Call handlePurchaseCourse to create payment intent and show payment form
      handlePurchaseCourse(course.id);
    }
  };

  // Fetch calendar events from backend
  // Handle course creation
  const handleCreateCourse = async () => {
    try {
      setIsSubmittingCourse(true);
      setCourseFormErrors({});

      // Validate form
      const errors: Record<string, string> = {};
      if (!courseFormData.title.trim()) errors.title = 'Title is required';
      if (!courseFormData.instructor.trim()) errors.instructor = 'Instructor is required';
      if (!courseFormData.description.trim()) errors.description = 'Description is required';
      if (!courseFormData.duration.trim()) errors.duration = 'Duration is required';
      if (!courseFormData.points || courseFormData.points <= 0) errors.points = 'Points must be greater than 0';

      if (Object.keys(errors).length > 0) {
        setCourseFormErrors(errors);
        return;
      }

      // Basic duration validation - just ensure it's not empty
      if (!courseFormData.duration.trim()) {
        setCourseFormErrors({ duration: 'Duration is required' });
        return;
      }

      // Prepare course data
      const courseData = {
        title: courseFormData.title.trim(),
        description: courseFormData.description.trim(),
        instructor: courseFormData.instructor.trim(),
        difficulty: courseFormData.difficulty,
        duration: courseFormData.duration.trim(), // Send original duration string
        points: courseFormData.points,
        featured: courseFormData.is_featured, // Use 'featured' instead of 'is_featured'
        chapters: courseFormData.chapters.filter(ch => ch.title.trim() && ch.duration.trim()).map(ch => ({
          title: ch.title.trim(),
          content: ch.content.trim(),
          duration: ch.duration.trim() // Send original duration string for chapters
        }))
      };

      const response = await coursesApi.createCourse(courseData);
      // coursesApi.createCourse uses fetch() and returns { success, data }
      if ((response as any)?.success) {
        toast({
          title: "Success",
          description: "Course created successfully!",
        });
        
        // Reset form and close modal
        setCourseFormData({
          title: '',
          description: '',
          instructor: '',
          difficulty: 'beginner',
          duration: '',
          points: 0,
          is_featured: false,
          chapters: [{ title: 'Introduction', content: '', duration: '' }]
        });
        setIsCreateCourseOpen(false);
        
        // Refresh courses list
        const coursesResponse = await coursesApi.getCourses();
        const refreshedCourses = (coursesResponse && (coursesResponse as any).success && (coursesResponse as any).data?.courses && Array.isArray((coursesResponse as any).data.courses))
          ? (coursesResponse as any).data.courses
          : (Array.isArray((coursesResponse as any)?.courses) ? (coursesResponse as any).courses : []);
        if (Array.isArray(refreshedCourses)) {
          const transformedCourses = refreshedCourses.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            instructor: course.instructor,
            duration: course.duration?.toString() || '0 mins',
            difficulty: course.difficulty,
            rating: 4.5,
            enrolled: 0,
            chapters: course.chapters || 0,
            progress: 0,
            points: course.points || 0,
            // Keep image consistent with thumbnail handling
            image: (course.thumbnail_url && course.thumbnail_url !== '/placeholder-course.jpg')
              ? course.thumbnail_url
              : (course.image_url && course.image_url !== '/placeholder-course.jpg')
                ? course.image_url
                : '/placeholder.svg',
            // Ensure thumbnail is set for newly created courses
            thumbnail: (course.thumbnail_url && course.thumbnail_url !== '/placeholder-course.jpg')
              ? course.thumbnail_url
              : (course.image_url && course.image_url !== '/placeholder-course.jpg')
                ? course.image_url
                : '/placeholder.svg',
            isEnrolled: false,
            isCompleted: false,
            featured: Boolean(course.featured)
          }));
          setCourses(transformedCourses);
        }
      } else if ((response as any)?.error) {
        toast({
          title: "Error",
          description: (response as any).error || "Failed to create course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingCourse(false);
    }
  };





  // Helper function to parse duration string to minutes
  const parseDurationToMinutes = (duration: string): number => {
    if (!duration) return 0;
    
    const hourMatch = duration.match(/(\d+)h/);
    const minuteMatch = duration.match(/(\d+)m/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return hours * 60 + minutes;
  };

  // Handle form input changes
  const handleCourseFormChange = (field: string, value: any) => {
    setCourseFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (courseFormErrors[field]) {
      setCourseFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle chapter changes
  const handleChapterChange = (index: number, field: string, value: string) => {
    setCourseFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) => 
        i === index ? { ...ch, [field]: value } : ch
      )
    }));
  };

  // Add new chapter
  const addChapter = () => {
    setCourseFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, { title: '', content: '', duration: '' }]
    }));
  };

  // Remove chapter
  const removeChapter = (index: number) => {
    if (courseFormData.chapters.length > 1) {
      setCourseFormData(prev => ({
        ...prev,
        chapters: prev.chapters.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle course enrollment
  const handleEnrollInCourse = async (courseId: number) => {
    try {
      await coursesApi.enrollInCourse(courseId);
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in the course.",
      });
      // Refresh courses to update enrollment status
      fetchCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in the course. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle course purchase with Stripe integration
  const handlePurchaseCourse = async (courseId: number) => {
    try {
      // Subscription is NOT required to purchase a course; proceed to payment.

      // Find the course to get pricing info
      const course = courses.find(c => c.id === courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Validate price meets Stripe minimum requirements for paid courses
      if (course.isPaid && course.price < 0.50) {
        toast({
          title: "Pricing Error",
          description: "This course has an invalid price. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Create payment intent with Stripe
      const response = await billingApi.createPaymentIntent({
        amount: course.price, // Amount in dollars (API will convert to cents)
        currency: 'usd',
        planName: course.title,
        planType: 'course', // Course purchases are single course purchases
        course_id: courseId, // Add course ID for course purchases
        metadata: {
          courseId: courseId.toString(),
          courseName: course.title,
          type: 'course_purchase'
        }
      });

      if (response.data?.clientSecret) {
        // Set payment data for the PaymentForm component
        setPaymentData({
          clientSecret: response.data.clientSecret,
          amount: course.price,
          planName: course.title,
          courseId: courseId
        });
        setShowPaymentForm(true);
      } else {
        throw new Error('Failed to create payment intent');
      }

    } catch (error) {
      console.error('Error initiating course purchase:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      if (paymentData?.courseId) {
        // Refresh courses to update enrollment status
        await fetchCourses();
        // Also refresh enrolled courses to keep enrolledCourses state in sync
        try {
          const enrolledResponse = await coursesApi.getEnrolledCourses();
          if (Array.isArray(enrolledResponse)) {
            const enrolledIds = enrolledResponse.map((course: any) => Number(course.id));
            setEnrolledCourses(enrolledIds);
          } else if ((enrolledResponse as any)?.data && Array.isArray((enrolledResponse as any).data)) {
            const enrolledIds = (enrolledResponse as any).data.map((course: any) => Number(course.id));
            setEnrolledCourses(enrolledIds);
          }
        } catch (e) {
          console.warn('Failed to refresh enrolled courses after payment:', e);
        }

        toast({
          title: "Payment Successful!",
          description: `You now have access to ${paymentData.planName}. You can start learning immediately.`,
        });

        // Close payment form
        setShowPaymentForm(false);
        setPaymentData(null);

        // Navigate to the course
        navigate(`/course/${paymentData.courseId}`);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      toast({
        title: "Success Confirmation Error",
        description: "Payment was successful, but there was an issue updating your access. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
    toast({
      title: "Payment Cancelled",
      description: "Your payment was cancelled. You can try again anytime.",
    });
  };

  // Handle video player - navigate to course learning page
  const handleWatchVideo = async (courseId: number) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if user has access (enrolled or paid)
      if (!course.isEnrolled && course.isPaid) {
        toast({
          title: "Access Denied",
          description: "Please purchase the course to watch videos.",
          variant: "destructive",
        });
        return;
      }

      // Navigate to course learning page
      navigate(`/course/${courseId}`);

    } catch (error) {
      console.error('Error opening course:', error);
      toast({
        title: "Course Error",
        description: "Failed to open course. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle document download
  const handleDownloadDocument = async (courseId: number) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course || !course.documents || course.documents.length === 0) {
        throw new Error('No documents available');
      }

      // Check if user has access (enrolled or paid)
      if (!course.isEnrolled && course.isPaid) {
        toast({
          title: "Access Denied",
          description: "Please purchase the course to download documents.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Downloading Documents",
        description: `Preparing ${course.documents.length} document(s) for download`,
      });

      // Download each document
      for (const document of course.documents) {
        try {
          // Create a downloadable link for each document
          const link = document.createElement('a');
          link.href = document.url;
          link.download = document.name || `${course.title}_document_${document.id}`;
          link.target = '_blank';
          
          // Append to body, click, and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay between downloads to avoid browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (docError) {
          console.error(`Error downloading document ${document.name}:`, docError);
        }
      }

      toast({
        title: "Download Complete",
        description: `Successfully initiated download for ${course.documents.length} document(s)`,
      });

    } catch (error) {
      console.error('Error downloading documents:', error);
      toast({
        title: "Download Error",
        description: "Failed to download documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle quiz access
  const handleTakeQuiz = async (courseId: number) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course || !course.hasQuiz) {
        throw new Error('Quiz not available');
      }

      // Check if user has access (enrolled or paid)
      if (!course.isEnrolled && course.isPaid) {
        toast({
          title: "Access Denied",
          description: "Please purchase the course to take the quiz.",
          variant: "destructive",
        });
        return;
      }

      // Initialize quiz state
      setCurrentQuizCourse(course);
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
      setQuizStarted(false);
      setQuizCompleted(false);
      setQuizScore(null);
      setIsQuizOpen(true);

    } catch (error) {
      console.error('Error opening quiz:', error);
      toast({
        title: "Quiz Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle quiz start
  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
  };

  // Handle quiz answer
  const handleQuizAnswer = (questionId: number, answer: string | number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuizCourse && currentQuestionIndex < currentQuizCourse.quizQuestions!.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    if (!currentQuizCourse || !currentQuizCourse.quizQuestions) return;

    let correctAnswers = 0;
    const totalQuestions = currentQuizCourse.quizQuestions.length;

    currentQuizCourse.quizQuestions.forEach(question => {
      const userAnswer = quizAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    setQuizScore(score);
    setQuizCompleted(true);

    // Update course quiz completion status
    setCourses(prev => prev.map(course => 
      course.id === currentQuizCourse.id 
        ? { ...course, quizCompleted: true, quizScore: score }
        : course
    ));

    toast({
      title: "Quiz Completed!",
      description: `You scored ${score}% (${correctAnswers}/${totalQuestions} correct)`,
      variant: score >= 70 ? "default" : "destructive",
    });
  };

  // userStats now loaded from API

  const badges: Badge[] = [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first course",
      icon: "🎯",
      rarity: "common",
      earned: true,
      earnedDate: "2024-01-15",
      requirements: "Complete 1 course",
      points: 50
    },
    {
      id: 2,
      name: "Knowledge Seeker",
      description: "Complete 5 courses",
      icon: "📚",
      rarity: "rare",
      earned: true,
      earnedDate: "2024-01-20",
      requirements: "Complete 5 courses",
      points: 200
    },
    {
      id: 3,
      name: "Report Master",
      description: "Pull 100 credit reports",
      icon: "📊",
      rarity: "epic",
      earned: true,
      earnedDate: "2024-01-22",
      requirements: "Pull 100 credit reports",
      points: 500
    },
    {
      id: 4,
      name: "Community Helper",
      description: "Help 25 community members",
      icon: "🤝",
      rarity: "rare",
      earned: false,
      requirements: "Answer 25 community questions",
      points: 300
    },
    {
      id: 5,
      name: "Streak Master",
      description: "Maintain 30-day learning streak",
      icon: "🔥",
      rarity: "legendary",
      earned: false,
      requirements: "30 consecutive days of activity",
      points: 1000
    }
  ];

  // Filter courses based on search query and category
  const filteredCourses = (courses && Array.isArray(courses)) ? courses.filter(course => {
    const matchesSearch = course?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course?.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || course?.difficulty === filterCategory;
    
    return matchesSearch && matchesCategory;
  }) : [];
  
  // Debug logging for course filtering
  console.log('🔍 Course filtering debug:');
  console.log('  - Total courses:', courses?.length || 0);
  console.log('  - Raw courses data:', courses?.map(c => ({ id: c?.id, title: c?.title, featured: c?.featured })) || []);
  console.log('  - Filtered courses:', filteredCourses?.length || 0);
  console.log('  - Featured courses in all:', courses?.filter(c => c?.featured)?.length || 0);
  console.log('  - Featured courses in filtered:', filteredCourses?.filter(c => c?.featured)?.length || 0);
  console.log('  - Search query:', searchQuery);
  console.log('  - Filter category:', filterCategory);
  console.log('  - Featured courses details:', courses?.filter(c => c?.featured)?.map(c => ({ id: c?.id, title: c?.title, difficulty: c?.difficulty })) || []);

  // leaderboard now loaded from API

  const forumPosts: ForumPost[] = [
    {
      id: 1,
      title: "Best practices for medical collection disputes?",
      content: "I'm working with a client who has several medical collections...",
      author: "CreditExpert2024",
      authorAvatar: "CE",
      category: "Disputes",
      replies: 8,
      likes: 15,
      views: 234,
      createdAt: "2024-01-22T10:30:00Z",
      isAnswered: true,
      isPinned: false,
      tags: ["medical", "collections", "disputes"]
    },
    {
      id: 2,
      title: "📌 NEW: FCRA Updates - Important Changes for 2024",
      content: "The Fair Credit Reporting Act has some important updates...",
      author: "AdminTeam",
      authorAvatar: "AT",
      category: "Announcements",
      replies: 23,
      likes: 45,
      views: 1247,
      createdAt: "2024-01-21T14:15:00Z",
      isAnswered: false,
      isPinned: true,
      tags: ["fcra", "updates", "2024", "important"]
    },
    {
      id: 3,
      title: "Client refused to pay after score improvement - advice?",
      content: "One of my clients saw a 120-point increase but now...",
      author: "NewAgent2023",
      authorAvatar: "NA",
      category: "Business",
      replies: 12,
      likes: 8,
      views: 456,
      createdAt: "2024-01-21T09:45:00Z",
      isAnswered: true,
      isPinned: false,
      tags: ["payment", "clients", "business"]
    }
  ];

  // Calendar events are now loaded from API via fetchCalendarEvents()

  const learningPaths: LearningPath[] = [
    {
      id: 1,
      name: "Credit Repair Foundation",
      type: "fundamental",
      description: "Essential knowledge for starting your credit repair journey",
      totalCourses: 5,
      completedCourses: 3,
      estimatedHours: 25,
      difficulty: "beginner",
      skills: ["FCRA Basics", "Credit Reports", "Dispute Letters", "Client Communication"],
      isEnrolled: true,
      progress: 60,
      nextCourse: {
        id: 4,
        title: "Advanced Dispute Strategies",
        estimatedTime: "3h 30m"
      }
    },
    {
      id: 2,
      name: "Advanced Professional Track",
      type: "advanced",
      description: "Master advanced techniques and become an industry expert",
      totalCourses: 8,
      completedCourses: 1,
      estimatedHours: 45,
      difficulty: "advanced",
      prerequisites: ["Credit Repair Foundation"],
      skills: ["Complex Disputes", "Legal Compliance", "Business Scaling", "Advanced Analytics"],
      isEnrolled: true,
      progress: 12,
      nextCourse: {
        id: 6,
        title: "Legal Compliance Deep Dive",
        estimatedTime: "4h 15m"
      }
    },
    {
      id: 3,
      name: "Business Builder Certification",
      type: "certification",
      description: "Build and scale your credit repair business",
      totalCourses: 6,
      completedCourses: 0,
      estimatedHours: 35,
      difficulty: "intermediate",
      prerequisites: ["Credit Repair Foundation"],
      skills: ["Business Management", "Marketing", "Client Acquisition", "Team Building"],
      isEnrolled: false,
      progress: 0
    },
    {
      id: 4,
      name: "Medical Collections Specialist",
      type: "specialized",
      description: "Specialized expertise in medical debt disputes",
      totalCourses: 4,
      completedCourses: 4,
      estimatedHours: 18,
      difficulty: "intermediate",
      skills: ["Medical Collections", "HIPAA Compliance", "Healthcare Billing", "Medical Disputes"],
      isEnrolled: true,
      progress: 100
    }
  ];

  const courseMaps: CourseMap[] = [
    {
      id: 1,
      courseId: 1,
      courseName: "Credit Repair Fundamentals",
      overallProgress: 75,
      timeSpent: "8h 45m",
      estimatedRemaining: "3h 15m",
      chapters: [
        {
          id: 1,
          title: "Introduction to Credit Repair",
          isCompleted: true,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "45m",
          type: "video"
        },
        {
          id: 2,
          title: "Understanding Credit Reports",
          isCompleted: true,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "1h 20m",
          type: "video"
        },
        {
          id: 3,
          title: "FCRA Overview",
          isCompleted: true,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "2h 10m",
          type: "reading"
        },
        {
          id: 4,
          title: "Basic Dispute Letters",
          isCompleted: false,
          isCurrently: true,
          isLocked: false,
          estimatedTime: "1h 30m",
          type: "assignment"
        },
        {
          id: 5,
          title: "Client Communication",
          isCompleted: false,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "1h 45m",
          type: "video"
        },
        {
          id: 6,
          title: "Final Assessment",
          isCompleted: false,
          isCurrently: false,
          isLocked: true,
          estimatedTime: "45m",
          type: "quiz"
        }
      ]
    },
    {
      id: 2,
      courseId: 2,
      courseName: "Advanced Dispute Strategies",
      overallProgress: 30,
      timeSpent: "3h 20m",
      estimatedRemaining: "7h 40m",
      chapters: [
        {
          id: 1,
          title: "Complex Dispute Scenarios",
          isCompleted: true,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "2h 15m",
          type: "video"
        },
        {
          id: 2,
          title: "Advanced Letter Templates",
          isCompleted: false,
          isCurrently: true,
          isLocked: false,
          estimatedTime: "1h 45m",
          type: "assignment"
        },
        {
          id: 3,
          title: "Escalation Procedures",
          isCompleted: false,
          isCurrently: false,
          isLocked: false,
          estimatedTime: "2h 30m",
          type: "reading"
        },
        {
          id: 4,
          title: "Legal Considerations",
          isCompleted: false,
          isCurrently: false,
          isLocked: true,
          estimatedTime: "3h 10m",
          type: "video"
        }
      ]
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "silver":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "platinum":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "diamond":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "bronze":
        return <Award className="h-3 w-3" />;
      case "silver":
        return <Medal className="h-3 w-3" />;
      case "gold":
        return <Trophy className="h-3 w-3" />;
      case "platinum":
        return <Crown className="h-3 w-3" />;
      case "diamond":
        return <Diamond className="h-3 w-3" />;
      default:
        return <Award className="h-3 w-3" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DashboardLayout
      title="Score Machine Academy"
      description="Learn, grow, and earn points in our gamified learning platform"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-2 text-xs -mx-2 px-2 lg:grid lg:w-auto lg:grid-cols-6">
          <TabsTrigger value="community" className="whitespace-nowrap">Community</TabsTrigger>
          <TabsTrigger value="classroom" className="whitespace-nowrap">Classroom</TabsTrigger>
          <TabsTrigger value="calendar" className="whitespace-nowrap">Calendar</TabsTrigger>
          <TabsTrigger value="maps" className="whitespace-nowrap">Maps</TabsTrigger>
          <TabsTrigger value="leaderboard" className="whitespace-nowrap">Leaderboard</TabsTrigger>
          <TabsTrigger value="about" className="whitespace-nowrap">About</TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="space-y-6">
          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading community feed...</p>
              </div>
            </div>
          ) : currentUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Community Feed - Takes up 2/3 of the space */}
              <div className="lg:col-span-2">
                <CommunityFeed currentUser={currentUser} />
              </div>
              
              {/* Groups Section - Takes up 1/3 of the space */}
              <div className="lg:col-span-1">
                <Groups currentUser={currentUser} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Unable to load community feed. Please try refreshing the page.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="classroom" className="space-y-6">
          {/* Featured Courses */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text-primary">
                    Featured Courses
                  </CardTitle>
                  <CardDescription>
                    Hand-picked courses to accelerate your learning
                  </CardDescription>
                </div>
                {/* Removed Create Course button from Classroom tab */}
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue"></div>
                  <span className="ml-2 text-muted-foreground">Loading courses...</span>
                </div>
              ) : (() => {
                const featuredCourses = (filteredCourses && Array.isArray(filteredCourses)) ? filteredCourses.filter(c => c?.featured) : [];
                console.log('🎯 Featured Courses Render Check:');
                console.log('  - Courses loading:', coursesLoading);
                console.log('  - Total filtered courses:', filteredCourses?.length || 0);
                console.log('  - Featured courses to display:', featuredCourses?.length || 0);
                console.log('  - Featured course IDs:', featuredCourses?.map(c => c?.id) || []);
                
                return (featuredCourses?.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No featured courses available</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">Debug: {courses?.length || 0} total, {courses?.filter(c => c?.featured)?.length || 0} featured, {filteredCourses?.length || 0} filtered</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(featuredCourses || []).map((course) => {
                      console.log('🎨 Rendering featured course:', course?.id, course?.title);
                      return (
                  <Card key={course.id} className="border border-border/40 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="aspect-video bg-gradient-light rounded-t-lg relative overflow-hidden">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue/20 to-sea-green/20 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      {course.isCompleted && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/90 text-gray-900 font-semibold">
                          {course.originalPrice ? (
                            <div className="flex items-center space-x-1">
                              <span className="line-through text-xs">${course.originalPrice}</span>
                              <span>${course.price}</span>
                            </div>
                          ) : (
                            <span>${course.price}</span>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-sm mb-1">{course.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{course.instructor}</span>
                          <span>{course.duration}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getDifficultyColor(course.difficulty)} variant="outline">
                              {course.difficulty}
                            </Badge>
                            <Badge variant="outline" className="border-yellow-300 text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              {course.rating}
                            </Badge>
                          </div>
                          <div className="text-sm font-medium gradient-text-secondary">
                            {course.points} pts
                          </div>
                        </div>

                        {course.isEnrolled && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {course.isPaid ? (
                            <div className="flex space-x-2 w-full">
                              <Button 
                                size="sm" 
                                className="flex-1 gradient-primary hover:opacity-90"
                                onClick={() => handleWatchVideo(course.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Watch Video
                              </Button>
                              {course.documents && course.documents.length > 0 && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(course.id)}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                              {course.hasQuiz && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTakeQuiz(course.id)}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : course.isPaid ? (
                            <Button 
                              size="sm" 
                              className="flex-1 gradient-primary hover:opacity-90"
                              onClick={() => handlePurchaseCourse(course.id)}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Purchase ${course.price}
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleEnrollInCourse(course.id)}
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              Enroll Free
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                       );
                     })}
                   </div>
                 );
               })()}
            </CardContent>
          </Card>

          {/* All Courses */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="gradient-text-secondary">
                  All Courses
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search courses..."
                      className="pl-10 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue"></div>
                  <span className="ml-2 text-muted-foreground">Loading courses...</span>
                </div>
              ) : (() => {
                console.log('📚 All Courses Render Check:');
                console.log('  - Courses loading:', coursesLoading);
                console.log('  - Filtered courses to display:', filteredCourses?.length || 0);
                console.log('  - Course IDs:', filteredCourses?.map(c => c?.id) || []);
                console.log('  - Search query:', searchQuery);
                console.log('  - Filter category:', filterCategory);
                
                return (filteredCourses?.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || filterCategory !== 'all' ? 'No courses match your search criteria' : 'No courses available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(filteredCourses || []).map((course) => {
                      console.log('🎨 Rendering course:', course?.id, course?.title);
                      return (
                  <Card key={course.id} className="border border-border/40 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-light rounded-lg flex items-center justify-center relative overflow-hidden">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 text-ocean-blue" />
                          )}
                          {course.isCompleted && (
                            <div className="absolute -top-1 -right-1">
                              <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{course.title}</h3>
                              {course.isPaid && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    ${course.price}
                                  </Badge>
                                  {course.originalPrice && course.originalPrice > course.price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ${course.originalPrice}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium gradient-text-secondary">
                              {course.points} pts
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {course.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={getDifficultyColor(course.difficulty)} variant="outline">
                                {course.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{course.duration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button 
                                size="sm" 
                                className={canAccessCourse(course) ? "gradient-primary hover:opacity-90" : "gradient-primary hover:opacity-90"}
                                onClick={() => handleCourseAction(course)}
                              >
                                {canAccessCourse(course) ? (
                                  <>
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    {getCourseButtonText(course)}
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    {getCourseButtonText(course)}
                                  </>
                                )}
                              </Button>
                              
                              {/* Additional action buttons - only show if user has access */}
                              {canAccessCourse(course) && (
                                <>
                                  {course.videoUrl && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleWatchVideo(course.id)}
                                    >
                                      <PlayCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {course.documents && course.documents.length > 0 && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleDownloadDocument(course.id)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {course.hasQuiz && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleTakeQuiz(course.id)}
                                    >
                                      <HelpCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                       );
                     })}
                   </div>
                 );
               })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <AdminCalendar />
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          {/* Community Overview */}
          <div className="grid lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-ocean-blue" />
                <div className="text-2xl font-bold gradient-text-primary">2,847</div>
                <div className="text-xs text-muted-foreground">Active Members</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <div className="text-2xl font-bold gradient-text-secondary">1,234</div>
                <div className="text-xs text-muted-foreground">Discussions</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">456</div>
                <div className="text-xs text-muted-foreground">Questions Answered</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">89</div>
                <div className="text-xs text-muted-foreground">Expert Contributors</div>
              </CardContent>
            </Card>
          </div>

          {/* Forum Posts */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text-primary">
                    Community Discussions
                  </CardTitle>
                  <CardDescription>
                    Get help and share knowledge with fellow professionals
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="gradient-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forumPosts.map((post) => (
                  <Card key={post.id} className="border border-border/40 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="gradient-primary text-white">
                            {post.authorAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {post.isPinned && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                📌 Pinned
                              </Badge>
                            )}
                            {post.isAnswered && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                ✓ Answered
                              </Badge>
                            )}
                            <Badge variant="outline">{post.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>by {post.author}</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Reply className="h-3 w-3" />
                                <span>{post.replies}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{post.views}</span>
                              </div>
                            </div>
                          </div>
                          {post.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maps" className="space-y-6">
          {/* Learning Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold gradient-text-primary">
                  {learningPaths.length}
                </div>
                <div className="text-xs text-muted-foreground">Learning Paths</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold gradient-text-secondary">
                  {learningPaths.filter(p => p.isEnrolled).length}
                </div>
                <div className="text-xs text-muted-foreground">Active Paths</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {learningPaths.filter(p => p.progress === 100).length}
                </div>
                <div className="text-xs text-muted-foreground">Completed Paths</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {learningPaths.reduce((sum, path) => sum + path.totalCourses, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Courses</div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Paths */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text-primary">
                    Learning Pathways
                  </CardTitle>
                  <CardDescription>
                    Structured learning journeys to master credit repair
                  </CardDescription>
                </div>
                <Button className="gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Path
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {learningPaths.map((path) => {
                  const getPathTypeColor = (type: string) => {
                    switch (type) {
                      case "fundamental":
                        return "bg-blue-100 text-blue-800 border-blue-200";
                      case "advanced":
                        return "bg-purple-100 text-purple-800 border-purple-200";
                      case "specialized":
                        return "bg-green-100 text-green-800 border-green-200";
                      case "certification":
                        return "bg-yellow-100 text-yellow-800 border-yellow-200";
                      default:
                        return "bg-gray-100 text-gray-800 border-gray-200";
                    }
                  };

                  const getPathTypeIcon = (type: string) => {
                    switch (type) {
                      case "fundamental":
                        return <BookOpen className="h-4 w-4" />;
                      case "advanced":
                        return <Rocket className="h-4 w-4" />;
                      case "specialized":
                        return <Target className="h-4 w-4" />;
                      case "certification":
                        return <Award className="h-4 w-4" />;
                      default:
                        return <BookOpen className="h-4 w-4" />;
                    }
                  };

                  return (
                    <Card key={path.id} className="border border-border/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-light rounded-lg flex items-center justify-center">
                                {getPathTypeIcon(path.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{path.name}</h3>
                                <Badge className={getPathTypeColor(path.type)} variant="outline">
                                  {path.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium gradient-text-primary">
                                {path.progress}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {path.completedCourses}/{path.totalCourses} courses
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">{path.description}</p>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{path.progress}%</span>
                            </div>
                            <Progress value={path.progress} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{path.estimatedHours}h total</span>
                            </div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              <BarChart3 className="h-3 w-3" />
                              <Badge className={getDifficultyColor(path.difficulty)} variant="outline" className="text-xs">
                                {path.difficulty}
                              </Badge>
                            </div>
                          </div>

                          {path.prerequisites && (
                            <div>
                              <div className="text-xs font-medium mb-1">Prerequisites:</div>
                              <div className="flex flex-wrap gap-1">
                                {path.prerequisites.map((prereq) => (
                                  <Badge key={prereq} variant="outline" className="text-xs">
                                    {prereq}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-medium mb-1">Skills:</div>
                            <div className="flex flex-wrap gap-1">
                              {path.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {path.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{path.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {path.nextCourse && (
                            <div className="p-3 bg-gradient-light rounded-lg">
                              <div className="text-xs font-medium mb-1">Next Course:</div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs">{path.nextCourse.title}</span>
                                <span className="text-xs text-muted-foreground">{path.nextCourse.estimatedTime}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {path.isEnrolled ? (
                              path.progress === 100 ? (
                                <Button size="sm" variant="outline" className="flex-1" disabled>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Button>
                              ) : (
                                <Button size="sm" className="flex-1 gradient-primary hover:opacity-90">
                                  <Play className="h-3 w-3 mr-1" />
                                  Continue
                                </Button>
                              )
                            ) : (
                              <Button size="sm" variant="outline" className="flex-1">
                                <BookOpen className="h-3 w-3 mr-1" />
                                Enroll
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Course Progress Maps */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-secondary">
                Course Progress Maps
              </CardTitle>
              <CardDescription>
                Visual progress tracking for your enrolled courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courseMaps.map((courseMap) => (
                  <Card key={courseMap.id} className="border border-border/40">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{courseMap.courseName}</h3>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Time spent: {courseMap.timeSpent}</span>
                              <span>Remaining: {courseMap.estimatedRemaining}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold gradient-text-primary">
                              {courseMap.overallProgress}%
                            </div>
                            <div className="text-xs text-muted-foreground">Overall Progress</div>
                          </div>
                        </div>

                        <Progress value={courseMap.overallProgress} className="h-3" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {courseMap.chapters.map((chapter, index) => {
                            const getChapterIcon = (type: string, isCompleted: boolean, isCurrently: boolean, isLocked: boolean) => {
                              if (isLocked) return <Lock className="h-4 w-4 text-gray-400" />;
                              if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-600" />;
                              if (isCurrently) return <PlayCircle className="h-4 w-4 text-blue-600" />;

                              switch (type) {
                                case "video":
                                  return <Video className="h-4 w-4 text-gray-500" />;
                                case "reading":
                                  return <FileText className="h-4 w-4 text-gray-500" />;
                                case "quiz":
                                  return <HelpCircle className="h-4 w-4 text-gray-500" />;
                                case "assignment":
                                  return <Edit className="h-4 w-4 text-gray-500" />;
                                default:
                                  return <BookOpen className="h-4 w-4 text-gray-500" />;
                              }
                            };

                            return (
                              <Card
                                key={chapter.id}
                                className={`border transition-all duration-200 ${
                                  chapter.isCompleted
                                    ? 'border-green-200 bg-green-50/50'
                                    : chapter.isCurrently
                                      ? 'border-blue-200 bg-blue-50/50'
                                      : chapter.isLocked
                                        ? 'border-gray-200 bg-gray-50/50 opacity-60'
                                        : 'border-border/40 hover:shadow-sm'
                                }`}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                      {getChapterIcon(chapter.type, chapter.isCompleted, chapter.isCurrently, chapter.isLocked)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-xs font-medium text-muted-foreground">
                                          Chapter {index + 1}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {chapter.type}
                                        </Badge>
                                      </div>
                                      <h4 className="text-sm font-medium mb-1 line-clamp-2">
                                        {chapter.title}
                                      </h4>
                                      <div className="text-xs text-muted-foreground">
                                        {chapter.estimatedTime}
                                      </div>
                                      {chapter.isCurrently && (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 mt-2">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/50">
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <div className="text-3xl font-bold gradient-text-primary">{userStats.badgesEarned}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {badges.filter(b => !b.earned).length}
                </div>
                <div className="text-sm text-muted-foreground">Badges to Unlock</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/50">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-emerald-600" />
                <div className="text-3xl font-bold gradient-text-secondary">
                  {badges.filter(b => b.earned).reduce((sum, badge) => sum + badge.points, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Achievement Points</div>
              </CardContent>
            </Card>
          </div>

          {/* Badge Collection */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="gradient-text-primary">
                Badge Collection
              </CardTitle>
              <CardDescription>
                Unlock badges by completing courses, helping others, and achieving milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => (
                  <Card 
                    key={badge.id} 
                    className={`border transition-all duration-300 ${
                      badge.earned 
                        ? 'border-border/40 hover:shadow-lg' 
                        : 'border-dashed border-border/60 opacity-60'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`text-6xl mb-4 ${!badge.earned && 'grayscale'}`}>
                        {badge.earned ? badge.icon : '🔒'}
                      </div>
                      <h3 className="font-semibold mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                      
                      <div className="space-y-2">
                        <Badge className={getRarityColor(badge.rarity)} variant="outline">
                          {badge.rarity}
                        </Badge>
                        <div className="text-sm font-medium gradient-text-secondary">
                          {badge.points} points
                        </div>
                      </div>

                      {badge.earned ? (
                        <div className="mt-4 p-2 bg-green-50 rounded-lg">
                          <div className="text-xs text-green-600">
                            Earned on {new Date(badge.earnedDate!).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-2 bg-gray-50 rounded-lg">
                          <div className="text-xs text-muted-foreground">
                            {badge.requirements}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Leaderboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold gradient-text-primary">#{userStats.communityRank}</div>
                <div className="text-xs text-muted-foreground">Your Rank</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Coins className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold gradient-text-primary">{userStats.totalPoints.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Your Points</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold gradient-text-secondary">+{userStats.weeklyPoints}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-800 dark:to-slate-700">
              <CardContent className="p-4 text-center">
                <Flame className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{userStats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Table */}
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="gradient-text-primary">
                    Community Leaderboard
                  </CardTitle>
                  <CardDescription>
                    See how you rank against other credit repair professionals
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="weekly">
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">This Week</SelectItem>
                      <SelectItem value="monthly">This Month</SelectItem>
                      <SelectItem value="alltime">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/40 overflow-x-auto">
                <div className="min-w-[900px] sm:min-w-0">
                  <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-light">
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Badges</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Weekly Gain</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((user, index) => (
                      <TableRow 
                        key={user.id} 
                        className={`hover:bg-gradient-light/50 ${user.name === "You" ? "bg-blue-50/50" : ""}`}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8">
                            {index < 3 ? (
                              <div className="text-lg">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                            ) : (
                              <span className="font-bold text-muted-foreground">#{user.rank}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={user.name === "You" ? "gradient-primary text-white" : ""}>
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.name}</div>
                              {user.name === "You" && (
                                <div className="text-xs text-blue-600">That's you!</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTierColor(user.tier)} variant="outline">
                            {getTierIcon(user.tier)}
                            <span className="ml-1 capitalize">{user.tier}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold gradient-text-primary">
                            {user.points.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span>{user.badges}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                            <span>{user.coursesCompleted}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-green-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>+{user.weeklyGain}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          {/* About Academy */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Academy Overview */}
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="gradient-text-primary">
                    About Credit Repair Academy
                  </CardTitle>
                  <CardDescription>
                    Empowering professionals with knowledge and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Our Mission</h3>
                    <p className="text-muted-foreground">
                      To provide comprehensive education and support for credit repair professionals,
                      helping them build successful businesses while delivering exceptional results for their clients.
                      We believe in the power of knowledge sharing and community collaboration to elevate the entire industry.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">What We Offer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <BookOpen className="h-5 w-5 text-ocean-blue mt-1" />
                        <div>
                          <h4 className="font-medium">Expert-Led Courses</h4>
                          <p className="text-sm text-muted-foreground">
                            Comprehensive training from industry experts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-emerald-600 mt-1" />
                        <div>
                          <h4 className="font-medium">Active Community</h4>
                          <p className="text-sm text-muted-foreground">
                            Connect with 2,800+ professionals worldwide
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Award className="h-5 w-5 text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-medium">Certification Programs</h4>
                          <p className="text-sm text-muted-foreground">
                            Earn recognized certifications and badges
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-purple-600 mt-1" />
                        <div>
                          <h4 className="font-medium">Local Meetups</h4>
                          <p className="text-sm text-muted-foreground">
                            Network at local events and workshops
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Academy Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-gradient-light rounded-lg">
                        <div className="text-2xl font-bold gradient-text-primary">2,847</div>
                        <div className="text-xs text-muted-foreground">Active Members</div>
                      </div>
                      <div className="p-3 bg-gradient-light rounded-lg">
                        <div className="text-2xl font-bold gradient-text-secondary">156</div>
                        <div className="text-xs text-muted-foreground">Courses Available</div>
                      </div>
                      <div className="p-3 bg-gradient-light rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">95%</div>
                        <div className="text-xs text-muted-foreground">Completion Rate</div>
                      </div>
                      <div className="p-3 bg-gradient-light rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">4.8</div>
                        <div className="text-xs text-muted-foreground">Avg Rating</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructors */}
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="gradient-text-secondary">
                    Meet Our Instructors
                  </CardTitle>
                  <CardDescription>
                    Learn from industry experts and thought leaders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="gradient-primary text-white">SJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">Sarah Johnson</h4>
                        <p className="text-sm text-muted-foreground">FCRA Compliance Expert</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          15+ years in credit repair, former bureau executive
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="gradient-secondary text-white">MC</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">Michael Chen</h4>
                        <p className="text-sm text-muted-foreground">Dispute Strategy Specialist</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Advanced techniques and automation expert
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">LR</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">Lisa Rodriguez</h4>
                        <p className="text-sm text-muted-foreground">Business Development Coach</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Help professionals scale their practice
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">DW</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">David Wilson</h4>
                        <p className="text-sm text-muted-foreground">Legal Affairs Advisor</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Attorney specializing in consumer law
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-700">
                <CardHeader>
                  <CardTitle className="gradient-text-primary">
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-ocean-blue" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-xs text-muted-foreground">academy@creditrepairpro.com</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-xs text-muted-foreground">(555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium">Headquarters</div>
                      <div className="text-xs text-muted-foreground">Phoenix, AZ</div>
                    </div>
                  </div>
                  <Button className="w-full gradient-primary hover:opacity-90">
                    <Send className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

              {/* Certification Info */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50 dark:from-slate-800 dark:to-slate-700">
                <CardHeader>
                  <CardTitle className="gradient-text-secondary">
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">FCRA Certified Program</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Dispute Specialist Badge</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Business Coach Certification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Community Expert Status</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    View All Certifications
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="border-0 shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="gradient-text-primary">
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Student Handbook
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    FAQ
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Academy Policies
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Industry Resources
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Course Dialog */}
      <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text-primary">
              Create New Course
            </DialogTitle>
            <DialogDescription>
              Create an engaging course for your academy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseTitle">Course Title *</Label>
                <Input
                  id="courseTitle"
                  placeholder="e.g., Advanced Credit Repair Strategies"
                  value={courseFormData.title}
                  onChange={(e) => handleCourseFormChange('title', e.target.value)}
                  className={courseFormErrors.title ? 'border-red-500' : ''}
                />
                {courseFormErrors.title && (
                  <p className="text-sm text-red-500">{courseFormErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor *</Label>
                <Input
                  id="instructor"
                  placeholder="Instructor name"
                  value={courseFormData.instructor}
                  onChange={(e) => handleCourseFormChange('instructor', e.target.value)}
                  className={courseFormErrors.instructor ? 'border-red-500' : ''}
                />
                {courseFormErrors.instructor && (
                  <p className="text-sm text-red-500">{courseFormErrors.instructor}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this course..."
                rows={3}
                value={courseFormData.description}
                onChange={(e) => handleCourseFormChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={courseFormData.difficulty} onValueChange={(value) => handleCourseFormChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 2h 30m"
                  value={courseFormData.duration}
                  onChange={(e) => handleCourseFormChange('duration', e.target.value)}
                  className={courseFormErrors.duration ? 'border-red-500' : ''}
                />
                {courseFormErrors.duration && (
                  <p className="text-sm text-red-500">{courseFormErrors.duration}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Reward</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="e.g., 200"
                  value={courseFormData.points}
                  onChange={(e) => handleCourseFormChange('points', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Course Structure</Label>
              <div className="border border-border/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Chapters</span>
                  <Button size="sm" variant="outline" onClick={addChapter}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Chapter
                  </Button>
                </div>
                <div className="space-y-3">
                  {courseFormData.chapters.map((chapter, index) => (
                    <div key={index} className="p-3 border border-border/40 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center text-white text-xs">{index + 1}</div>
                          <span className="text-sm font-medium">Chapter {index + 1}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeChapter(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Title *</Label>
                          <Input
                            placeholder="Chapter title"
                            value={chapter.title}
                            onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration *</Label>
                          <Input
                            placeholder="e.g., 15 min"
                            value={chapter.duration}
                            onChange={(e) => handleChapterChange(index, 'duration', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Content</Label>
                        <Textarea
                          placeholder="Chapter description or content"
                          value={chapter.content}
                          onChange={(e) => handleChapterChange(index, 'content', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  {courseFormData.chapters.length === 0 && (
                    <div className="flex items-center space-x-3 p-2 border border-dashed border-border/40 rounded">
                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">+</div>
                      <span className="text-sm text-muted-foreground">Add your first chapter</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateCourseOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="gradient-primary" 
              onClick={handleCreateCourse}
              disabled={isSubmittingCourse}
            >
              {isSubmittingCourse ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="gradient-text-primary">
              Start a Discussion
            </DialogTitle>
            <DialogDescription>
              Share knowledge and get help from the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postTitle">Title *</Label>
              <Input
                id="postTitle"
                placeholder="What's your question or topic?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="disputes">Disputes</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="fcra">FCRA Compliance</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Describe your question or share your thoughts..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="e.g., medical, collections, strategies"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas to help others find your post
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatePostOpen(false)}
            >
              Cancel
            </Button>
            <Button className="gradient-primary">
              <MessageSquare className="h-4 w-4 mr-2" />
              Post Discussion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Video Player Modal */}
      <Dialog open={isVideoPlayerOpen} onOpenChange={setIsVideoPlayerOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              {currentVideoTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-black rounded-lg overflow-hidden">
            {currentVideoUrl ? (
              <video
                className="w-full h-full object-contain"
                controls
                autoPlay
                src={currentVideoUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Video not available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz: {currentQuizCourse?.title}
            </DialogTitle>
            <DialogDescription>
              Test your knowledge with this course quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!quizStarted && !quizCompleted ? (
              // Quiz Introduction
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Quiz Instructions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Answer all questions to complete the quiz</li>
                    <li>• You need 70% or higher to pass</li>
                    <li>• You can retake the quiz if needed</li>
                    <li>• Total Questions: {currentQuizCourse?.quizQuestions?.length || 0}</li>
                  </ul>
                </div>
                <div className="text-center">
                  <Button
                    className="gradient-primary"
                    onClick={handleStartQuiz}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                </div>
              </div>
            ) : quizCompleted ? (
              // Quiz Results
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  (quizScore || 0) >= 70 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {(quizScore || 0) >= 70 ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <X className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {(quizScore || 0) >= 70 ? 'Quiz Passed!' : 'Quiz Failed'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your Score: {quizScore || 0}%
                </p>
                <div className="space-x-2">
                  <Button
                    onClick={() => {
                      setQuizStarted(false);
                      setQuizCompleted(false);
                      setQuizScore(null);
                      setQuizAnswers({});
                      setCurrentQuestionIndex(0);
                    }}
                    variant="outline"
                  >
                    Retake Quiz
                  </Button>
                  <Button
                    onClick={() => setIsQuizOpen(false)}
                    className="gradient-primary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              // Quiz Questions
              currentQuizCourse?.quizQuestions && (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Question {currentQuestionIndex + 1} of {currentQuizCourse.quizQuestions.length}</span>
                      <span>{Math.round(((currentQuestionIndex + 1) / currentQuizCourse.quizQuestions.length) * 100)}%</span>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / currentQuizCourse.quizQuestions.length) * 100} />
                  </div>

                  {/* Current Question */}
                  {(() => {
                    const currentQuestion = currentQuizCourse.quizQuestions[currentQuestionIndex];
                    if (!currentQuestion) return null;

                    return (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-4">{currentQuestion.question}</h4>
                          
                          {currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false' ? (
                            <div className="space-y-2">
                              {currentQuestion.options?.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}`}
                                    value={index}
                                    checked={quizAnswers[currentQuestion.id] === index}
                                    onChange={() => handleQuizAnswer(currentQuestion.id, index)}
                                    className="text-blue-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <Input
                              placeholder="Enter your answer..."
                              value={quizAnswers[currentQuestion.id] as string || ''}
                              onChange={(e) => handleQuizAnswer(currentQuestion.id, e.target.value)}
                            />
                          )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                          >
                            Previous
                          </Button>
                          
                          {currentQuestionIndex === currentQuizCourse.quizQuestions.length - 1 ? (
                            <Button
                              className="gradient-primary"
                              onClick={handleSubmitQuiz}
                              disabled={!quizAnswers[currentQuestion.id]}
                            >
                              Submit Quiz
                            </Button>
                          ) : (
                            <Button
                              onClick={handleNextQuestion}
                              disabled={!quizAnswers[currentQuestion.id]}
                            >
                              Next
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Form Modal */}
      {showPaymentForm && paymentData && stripe && (
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Purchase Course</DialogTitle>
              <DialogDescription>
                Complete your payment for {paymentData.planName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold">${paymentData.amount}</p>
                <p className="text-sm text-muted-foreground">One-time payment</p>
              </div>
              <Elements stripe={stripe}>
                <PaymentForm
                  clientSecret={paymentData.clientSecret}
                  amount={paymentData.amount}
                  planName={paymentData.planName}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
