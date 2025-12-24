import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import SupportLayout from '@/components/SupportLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon, Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Quote, Code, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  youtube_url: string;
  category_id: string;
  status: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  tags: string; // Comma separated string for input
}

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BlogFormData>({
    defaultValues: {
      status: 'draft',
      category_id: ''
    }
  });

  const title = watch('title');
  const contentValue = watch('content') || '';
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const contentRegister = register('content', { required: 'Content is required' });
  const contentRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPost();
    } else {
      setFetching(false);
    }
  }, [id]);

  // Auto-generate slug from title if not editing and slug is empty
  useEffect(() => {
    if (!isEditing && title && !watch('slug')) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [title, isEditing, setValue, watch]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in to access blog editor');
        navigate('/support/login');
        return;
      }
      const res = await fetch('/api/support/blog/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else if (res.status === 401 || res.status === 403) {
        toast.error('Unauthorized access. Please log in again.');
        navigate('/support/login');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in');
        navigate('/support/login');
        return;
      }
      const res = await fetch(`/api/support/blog/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Populate form
        setValue('title', data.title);
        setValue('slug', data.slug);
        setValue('content', data.content);
        setValue('excerpt', data.excerpt || '');
        setValue('featured_image', data.featured_image || '');
        setValue('youtube_url', data.youtube_url || '');
        setValue('category_id', data.category_id?.toString() || '');
        setValue('status', data.status);
        setValue('seo_title', data.seo_title || '');
        setValue('seo_description', data.seo_description || '');
        setValue('seo_keywords', data.seo_keywords || '');
        
        // Handle tags
        if (data.tags && Array.isArray(data.tags)) {
          setValue('tags', data.tags.map((t: any) => t.name).join(', '));
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Unauthorized access. Please log in again.');
          navigate('/support/login');
          return;
        }
        toast.error('Failed to load post');
        navigate('/support/blog');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Error loading post');
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in');
        navigate('/support/login');
        return;
      }
      const res = await fetch('/api/support/blog/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setValue('featured_image', data.url);
        toast.success('Image uploaded successfully');
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Unauthorized access. Please log in again.');
          navigate('/support/login');
          return;
        }
        const data = await res.json();
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const insertAtCursor = (before: string, after: string = '', placeholder: string = '') => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = contentValue.substring(start, end) || placeholder;
    const newContent = contentValue.substring(0, start) + before + selected + after + contentValue.substring(end);
    setValue('content', newContent, { shouldValidate: true, shouldDirty: true });
    requestAnimationFrame(() => {
      const pos = start + before.length + selected.length + after.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingContentImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in');
        navigate('/support/login');
        return;
      }
      const res = await fetch('/api/support/blog/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        insertAtCursor(`<img src="${data.url}" alt="" />`);
        toast.success('Image inserted');
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Unauthorized access. Please log in again.');
          navigate('/support/login');
          return;
        }
        const err = await res.json();
        toast.error(err.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploadingContentImage(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Please log in');
        navigate('/support/login');
        return;
      }
      const url = isEditing 
        ? `/api/support/blog/posts/${id}`
        : '/api/support/blog/posts';
      
      const method = isEditing ? 'PUT' : 'POST';

      // Parse tags
      const tagsArray = data.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        ...data,
        tags: tagsArray,
        category_id: data.category_id ? parseInt(data.category_id) : null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Post ${isEditing ? 'updated' : 'created'} successfully`);
        navigate('/support/blog');
      } else {
        if (res.status === 401 || res.status === 403) {
          toast.error('Unauthorized access. Please log in again.');
          navigate('/support/login');
          return;
        }
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/support/blog')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Edit Post' : 'Create New Post'}
            </h1>
          </div>
          <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Post' : 'Publish Post'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Post Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted p-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('<strong>', '</strong>')}><Bold className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('<em>', '</em>')}><Italic className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('<u>', '</u>')}><Underline className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<h2>', '</h2>\n', 'Heading') }><Heading2 className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<h3>', '</h3>\n', 'Subheading') }><Heading3 className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<ul>\n<li>', '</li>\n</ul>\n', 'List item') }><List className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<ol>\n<li>', '</li>\n</ol>\n', 'List item') }><ListOrdered className="h-4 w-4" /></Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm"><LinkIcon className="h-4 w-4" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-2">
                          <Input placeholder="Link text" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
                          <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                          <Button
                            type="button"
                            onClick={() => {
                              if (!linkUrl) return;
                              insertAtCursor(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">`, '</a>', linkText || 'Link');
                              setLinkText('');
                              setLinkUrl('');
                            }}
                          >
                            Insert Link
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleContentImageUpload} accept="image/*" disabled={uploadingContentImage} />
                      <Button type="button" variant="ghost" size="sm" disabled={uploadingContentImage}>
                        {uploadingContentImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<pre><code>', '</code></pre>\n', 'code') }><Code className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<blockquote>', '</blockquote>\n', 'Quote') }><Quote className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => insertAtCursor('\n<hr />\n') }><Minus className="h-4 w-4" /></Button>
                  </div>
                  <Textarea
                    id="content"
                    className="min-h-[400px] font-mono"
                    placeholder="Write your post content here (HTML supported)..."
                    {...contentRegister}
                    ref={(e) => {
                      contentRegister.ref(e);
                      contentRef.current = e;
                    }}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">{errors.content.message}</p>
                  )}
                  <div className="flex items-center justify-end text-xs text-muted-foreground">
                    <span>{contentValue.trim().split(/\s+/).filter(Boolean).length} words • {contentValue.length} characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    className="h-24"
                    placeholder="Short summary for lists and SEO..."
                    {...register('excerpt')}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    placeholder="Custom title for search engines"
                    {...register('seo_title')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="url-friendly-slug"
                    {...register('slug')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    className="h-24"
                    placeholder="Description for search results..."
                    {...register('seo_description')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">Keywords</Label>
                  <Input
                    id="seo_keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    {...register('seo_keywords')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={(value) => setValue('status', value)}
                    defaultValue={watch('status')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={(value) => setValue('category_id', value)}
                    value={watch('category_id')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="pt-2">
                    {/* Placeholder for quick category add if needed later */}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags separated by commas"
                    {...register('tags')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas (e.g. credit, finance, tips)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image</Label>
                  <div className="flex gap-2">
                    <Input
                      id="featured_image"
                      placeholder="https://..."
                      {...register('featured_image')}
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageUpload}
                        accept="image/*"
                        disabled={uploading}
                      />
                      <Button type="button" variant="outline" size="icon" disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {watch('featured_image') && (
                    <div className="mt-2 relative aspect-video rounded-md overflow-hidden border bg-muted">
                      <img 
                        src={watch('featured_image')} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube Video URL</Label>
                  <Input
                    id="youtube_url"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register('youtube_url', {
                      pattern: {
                        value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/,
                        message: "Please enter a valid YouTube URL"
                      }
                    })}
                  />
                  {errors.youtube_url && (
                    <p className="text-sm text-red-500">{errors.youtube_url.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
};

export default BlogEditor;
