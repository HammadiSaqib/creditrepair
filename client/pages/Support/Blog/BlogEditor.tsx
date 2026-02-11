import React, { useState, useEffect, useRef } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { 
  ArrowLeft, Save, Loader2, Upload, Image as ImageIcon, 
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, 
  Link as LinkIcon, Quote, Code, Minus, Eye, Globe, Calendar, X, 
  AlignLeft, AlignCenter, AlignRight, Type, Table as TableIcon
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  tags: string;
}

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<BlogFormData>({
    defaultValues: {
      status: 'draft',
      category_id: ''
    }
  });

  const title = watch('title');
  const contentValue = watch('content') || '';
  const featuredImage = watch('featured_image');
  const status = watch('status');
  
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  // Initialization Effects
  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPost();
    } else {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && title && !watch('slug')) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [title, isEditing, setValue, watch]);

  // Sync content from form to editor when initial load happens
  useEffect(() => {
    if (!fetching && editorRef.current && contentValue && editorRef.current.innerHTML !== contentValue) {
      // Only set if significantly different to avoid cursor jumping, mostly for initial load
      if (editorRef.current.innerHTML === '' || editorRef.current.innerHTML === '<br>') {
         editorRef.current.innerHTML = contentValue;
      }
    }
  }, [fetching, contentValue]);

  // API Calls
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch('/api/support/blog/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/support/login');
        return;
      }
      const res = await fetch(`/api/support/blog/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
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
        if (data.tags && Array.isArray(data.tags)) {
          setValue('tags', data.tags.map((t: any) => t.name).join(', '));
        }
        
        // Update editor content directly
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content;
        }
      } else {
        toast.error('Failed to load post');
        navigate('/support/blog');
      }
    } catch (error) {
      toast.error('Error loading post');
    } finally {
      setFetching(false);
    }
  };

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch('/api/support/blog/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setValue('featured_image', data.url, { shouldDirty: true });
        toast.success('Cover image updated');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    // Restore selection if saved (for popovers)
    if (savedSelection.current && (command === 'createLink' || command === 'insertHTML')) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
      }
    }

    if (command === 'createLink') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let img: HTMLImageElement | null = null;
        const tryImage = (node: Node | null) => (node instanceof HTMLImageElement ? node : null);
        img = tryImage(range.commonAncestorContainer);
        if (!img) img = tryImage(range.startContainer);
        if (!img) img = tryImage(range.endContainer);
        if (!img && range.startContainer instanceof Element) {
          const child = range.startContainer.childNodes[range.startOffset] || null;
          img = tryImage(child);
        }
        if (!img) {
          const an = selection.anchorNode;
          if (an instanceof HTMLImageElement) {
            img = an;
          } else if (an instanceof Element && an.tagName === 'IMG') {
            img = an as HTMLImageElement;
          } else if (an instanceof Text && an.parentElement && an.parentElement.tagName === 'IMG') {
            img = an.parentElement as HTMLImageElement;
          }
        }
        if (img) {
          const existingLink = img.closest('a');
          if (existingLink) {
            existingLink.href = value;
          } else {
            const a = document.createElement('a');
            a.href = value;
            a.target = '_blank';
            a.rel = 'noopener';
            img.parentNode?.insertBefore(a, img);
            a.appendChild(img);
          }
          savedSelection.current = null;
          if (editorRef.current) {
            setValue('content', editorRef.current.innerHTML, { shouldValidate: true, shouldDirty: true });
          }
          return;
        }
      }
    }

    document.execCommand(command, false, value);
    
    // Clear saved selection after execution
    if (command === 'createLink' || command === 'insertHTML') {
      savedSelection.current = null;
    }

    if (editorRef.current) {
      setValue('content', editorRef.current.innerHTML, { shouldValidate: true, shouldDirty: true });
      // editorRef.current.focus(); // Keep focus logic flexible
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0);
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Save selection before upload starts
    saveSelection();
    
    setUploadingContentImage(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch('/api/support/blog/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        execCommand('insertImage', data.url);
        toast.success('Image inserted');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
    } finally {
      setUploadingContentImage(false);
      e.target.value = '';
    }
  };

  const insertTable = () => {
    saveSelection(); // Ensure we insert where the cursor was
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 1em 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f9fafb;">Header 1</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f9fafb;">Header 2</th>
            <th style="border: 1px solid #ddd; padding: 8px; background-color: #f9fafb;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCommand('insertHTML', tableHTML);
  };

  const onSubmit = async (data: BlogFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/support/login');
        return;
      }
      const url = isEditing 
        ? `/api/support/blog/posts/${id}`
        : '/api/support/blog/posts';
      
      const method = isEditing ? 'PUT' : 'POST';
      const tagsArray = data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

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
        toast.success(`Post ${isEditing ? 'updated' : 'published'} successfully`);
        navigate('/support/blog');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to save post');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Toolbar Button Component
  const ToolbarBtn = ({ icon: Icon, onClick, tooltip, disabled = false, active = false }: any) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          type="button" 
          variant={active ? "secondary" : "ghost"} 
          size="sm" 
          onMouseDown={(e) => {
             e.preventDefault(); // Prevent focus loss
             onClick();
          }}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground",
            active && "bg-muted text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  if (fetching) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading editor...</p>
          </div>
        </div>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50/50 pb-20">
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6 max-w-[1600px] mx-auto">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/support/blog')} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {title || 'Untitled Post'}
                  </span>
                  <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {status}
                  </Badge>
                  {isDirty && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Unsaved Changes</Badge>}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <Type className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="min-w-[120px]">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Update' : 'Publish'}
                </Button>
              </div>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 p-8">
            {/* Main Content Column */}
            <div className={cn("col-span-12 transition-all duration-300", showPreview ? "lg:col-span-12" : "lg:col-span-9")}>
              {showPreview ? (
                <div className="bg-white rounded-xl shadow-sm border min-h-[800px] p-12 prose prose-slate max-w-none mx-auto">
                  {featuredImage && (
                    <img src={featuredImage} alt="Cover" className="w-full h-[400px] object-cover rounded-xl mb-8" />
                  )}
                  <h1 className="text-4xl font-bold mb-4">{title}</h1>
                  <div dangerouslySetInnerHTML={{ __html: contentValue }} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Title Input Area */}
                  <div className="bg-background rounded-xl shadow-sm border p-8 transition-all hover:shadow-md">
                    <input
                      {...register('title', { required: 'Title is required' })}
                      placeholder="Post Title"
                      className="w-full text-4xl font-bold border-none outline-none placeholder:text-muted-foreground/40 bg-transparent"
                    />
                    {errors.title && <p className="text-sm text-red-500 mt-2">{errors.title.message}</p>}
                    
                    {/* Permalink Display */}
                    {watch('slug') && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground bg-slate-50 p-2 rounded w-fit">
                        <Globe className="h-3 w-3" />
                        <span>Permalink:</span>
                        <code className="text-xs bg-white px-1 py-0.5 border rounded">/blog/{watch('slug')}</code>
                      </div>
                    )}
                  </div>

                  {/* WYSIWYG Editor Area */}
                  <div className="bg-background rounded-xl shadow-sm border flex flex-col min-h-[700px] transition-all hover:shadow-md relative overflow-hidden group">
                    {/* Sticky Editor Toolbar */}
                    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b p-2 flex items-center gap-1 flex-wrap supports-[backdrop-filter]:bg-background/80">
                      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                        <Select onValueChange={(val) => execCommand('formatBlock', val)}>
                          <SelectTrigger className="h-8 w-[130px] border-none bg-transparent hover:bg-muted focus:ring-0">
                            <SelectValue placeholder="Paragraph" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="p">Paragraph</SelectItem>
                            <SelectItem value="h1">Heading 1</SelectItem>
                            <SelectItem value="h2">Heading 2</SelectItem>
                            <SelectItem value="h3">Heading 3</SelectItem>
                            <SelectItem value="h4">Heading 4</SelectItem>
                            <SelectItem value="h5">Heading 5</SelectItem>
                            <SelectItem value="h6">Heading 6</SelectItem>
                            <SelectItem value="blockquote">Quote</SelectItem>
                            <SelectItem value="pre">Code</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                        <ToolbarBtn icon={Bold} onClick={() => execCommand('bold')} tooltip="Bold (Cmd+B)" />
                        <ToolbarBtn icon={Italic} onClick={() => execCommand('italic')} tooltip="Italic (Cmd+I)" />
                        <ToolbarBtn icon={Underline} onClick={() => execCommand('underline')} tooltip="Underline (Cmd+U)" />
                      </div>
                      
                      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                        <ToolbarBtn icon={AlignLeft} onClick={() => execCommand('justifyLeft')} tooltip="Align Left" />
                        <ToolbarBtn icon={AlignCenter} onClick={() => execCommand('justifyCenter')} tooltip="Align Center" />
                        <ToolbarBtn icon={AlignRight} onClick={() => execCommand('justifyRight')} tooltip="Align Right" />
                      </div>

                      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                        <ToolbarBtn icon={List} onClick={() => execCommand('insertUnorderedList')} tooltip="Bullet List" />
                        <ToolbarBtn icon={ListOrdered} onClick={() => execCommand('insertOrderedList')} tooltip="Numbered List" />
                      </div>
                      
                      <div className="flex items-center gap-0.5 border-r pr-2 mr-1">
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onMouseDown={saveSelection} // Save selection before popover opens
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-3">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Insert Link</h4>
                              <Input placeholder="Text to display" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="h-8 text-sm" />
                              <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="h-8 text-sm" />
                              <Button size="sm" className="w-full" onClick={() => {
                                if (!linkUrl) return;
                                execCommand('createLink', linkUrl);
                                setLinkText('');
                                setLinkUrl('');
                              }}>Insert</Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            onChange={handleContentImageUpload} 
                            accept="image/*" 
                            disabled={uploadingContentImage} 
                          />
                          <ToolbarBtn icon={uploadingContentImage ? Loader2 : ImageIcon} onClick={() => {}} tooltip="Insert Image" disabled={uploadingContentImage} />
                        </div>
                        <ToolbarBtn icon={TableIcon} onClick={insertTable} tooltip="Insert Table" />
                      </div>
                      <ToolbarBtn icon={Minus} onClick={() => execCommand('insertHorizontalRule')} tooltip="Horizontal Rule" />
                    </div>

                    {/* Writing Canvas (ContentEditable) */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="flex-1 min-h-[600px] outline-none p-8 text-lg leading-relaxed font-serif prose prose-slate max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
                      data-placeholder="Start writing your story..."
                      onInput={(e) => {
                        setValue('content', e.currentTarget.innerHTML, { shouldDirty: true, shouldValidate: true });
                      }}
                      onBlur={() => {
                        if (editorRef.current) {
                          setValue('content', editorRef.current.innerHTML, { shouldDirty: true, shouldValidate: true });
                          saveSelection(); // Save on blur so toolbar clicks might work if we were careful, but popover logic handles it explicitly
                        }
                      }}
                      onKeyDown={(e) => {
                         if (e.key === 'Tab') {
                           e.preventDefault();
                           execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
                         }
                      }}
                    />
                    
                    {/* Status Footer */}
                    <div className="border-t p-2 px-4 bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
                      <span>Visual Editor</span>
                      <div className="flex gap-4">
                        <span>{contentValue.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length} words</span>
                        <span>{contentValue.replace(/<[^>]*>/g, '').length} characters</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Column - Only visible in Edit Mode */}
            {!showPreview && (
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <Tabs defaultValue="settings" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>
                  
                  {/* General Settings Tab */}
                  <TabsContent value="settings" className="space-y-4 mt-4">
                    {/* Publishing Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Publishing
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Status</Label>
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

                    {/* Featured Image Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Featured Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {featuredImage ? (
                          <div className="relative aspect-video rounded-md overflow-hidden border group">
                            <img src={featuredImage} alt="Cover" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="icon" variant="destructive" onClick={() => setValue('featured_image', '', { shouldDirty: true })}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors relative">
                             <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleImageUpload}
                              accept="image/*"
                              disabled={uploading}
                            />
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                              <span className="text-xs">Click to upload cover</span>
                            </div>
                          </div>
                        )}
                        <Input
                          placeholder="Or paste image URL..."
                          className="text-xs h-8"
                          {...register('featured_image')}
                        />
                      </CardContent>
                    </Card>

                    {/* Organization Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <List className="h-4 w-4" />
                          Organization
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Category</Label>
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
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Tags</Label>
                          <Input
                            placeholder="finance, credit, tips"
                            {...register('tags')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Excerpt</Label>
                          <Textarea
                            placeholder="Short summary..."
                            className="h-24 resize-none text-sm"
                            {...register('excerpt')}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SEO Tab */}
                  <TabsContent value="seo" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Search Engine Optimization
                        </CardTitle>
                        <CardDescription>
                          Preview how your post will look in search results.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded border text-sm">
                          <div className="text-blue-600 text-lg truncate">{watch('seo_title') || title || 'Post Title'}</div>
                          <div className="text-green-700 text-xs truncate">https://thescoremachine.com/blog/{watch('slug') || 'post-slug'}</div>
                          <div className="text-slate-600 text-xs mt-1 line-clamp-2">{watch('seo_description') || watch('excerpt') || 'Meta description will appear here...'}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">SEO Title</Label>
                          <Input {...register('seo_title')} placeholder="Custom title..." />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Slug</Label>
                          <Input {...register('slug')} placeholder="url-slug" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Meta Description</Label>
                          <Textarea {...register('seo_description')} className="h-24 resize-none" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Keywords</Label>
                          <Input {...register('seo_keywords')} placeholder="comma, separated, keywords" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </SupportLayout>
  );
};

export default BlogEditor;
