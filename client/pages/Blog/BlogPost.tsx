import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-grow container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Post Not Found</h1>
          <p className="text-slate-600 mb-8">The article you are looking for does not exist or has been removed.</p>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = window.location.href;
  const normalizeContentHTML = (raw: string) => {
    const hasTags = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (hasTags) return raw;
    const paragraphs = raw
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
    return paragraphs || '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Helmet>
        <title>{post.seo_title || post.title} | Lend Ready Ai Blog</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        {post.seo_keywords && <meta name="keywords" content={post.seo_keywords} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.published_at} />
        {post.author_first_name && <meta property="article:author" content={`${post.author_first_name} ${post.author_last_name}`} />}
      </Helmet>

      <SiteHeader />

      <main className="flex-grow">
        {/* Article Header */}
        <header className="bg-[#0f182a] py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-emerald-900/20 pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link to="/blog" className="inline-flex items-center text-teal-400 hover:text-teal-300 mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Articles
              </Link>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {post.category_name && (
                  <Badge className="bg-teal-600 hover:bg-teal-700 text-white border-0 px-3 py-1">
                    {post.category_name}
                  </Badge>
                )}
                <span className="text-slate-400 text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-slate-400 text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {Math.max(1, Math.ceil(post.content.length / 1000))} min read
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
                {post.title}
              </h1>

              <div className="flex items-center gap-4">
                {post.author_avatar ? (
                  <img src={post.author_avatar} alt="Author" className="w-12 h-12 rounded-full border-2 border-slate-700" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                    {post.author_first_name?.[0]}{post.author_last_name?.[0]}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{post.author_first_name} {post.author_last_name}</div>
                  <div className="text-slate-400 text-sm">Author</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            
            {/* Featured Image */}
            {post.featured_image && (
              <div className="rounded-2xl overflow-hidden shadow-2xl mb-12 -mt-32 relative z-20 border-4 border-white dark:border-slate-800">
                <img src={post.featured_image} alt={post.title} className="w-full h-auto" />
              </div>
            )}

            {/* Content Body */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-700">
              
              {/* YouTube Embed */}
              {post.youtube_url && (
                <div className="mb-10 aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={post.youtube_url.replace('watch?v=', 'embed/')} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div 
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-img:rounded-xl whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: normalizeContentHTML(post.content) }}
              />
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-12 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Share this article
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')}>
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${post.title}`, '_blank')}>
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank')}>
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;

