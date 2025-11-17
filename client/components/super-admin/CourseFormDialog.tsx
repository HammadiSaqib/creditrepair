import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface FormData {
  title: string;
  description: string;
  category_id: string;
  instructor_name: string;
  duration_hours: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  is_featured: boolean;
  is_published: boolean;
  thumbnail_url: string;
  thumbnail_file?: File | null;
}

interface CourseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  isEdit?: boolean;
  formData: FormData;
  categories: Category[];
  handleFormChange: (field: string, value: any) => void;
}

const CourseFormDialog: React.FC<CourseFormDialogProps> = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  title,
  isEdit = false,
  formData,
  categories,
  handleFormChange
}) => {
  // Debug logging
  console.log('CourseFormDialog - categories prop:', categories);
  console.log('CourseFormDialog - categories type:', typeof categories);
  console.log('CourseFormDialog - categories isArray:', Array.isArray(categories));
  console.log('CourseFormDialog - categories length:', categories?.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update course information' : 'Create a new course for the school management system'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Enter course title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name *</Label>
              <Input
                id="instructor"
                value={formData.instructor_name}
                onChange={(e) => handleFormChange('instructor_name', e.target.value)}
                placeholder="Enter instructor name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter course description"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => handleFormChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) ? categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select 
                value={formData.difficulty_level} 
                onValueChange={(value) => 
                  handleFormChange('difficulty_level', value)
                }
              >
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
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_hours}
                onChange={(e) => handleFormChange('duration_hours', parseFloat(e.target.value) || 0)}
                placeholder="Enter duration"
                min="0"
                step="0.5"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                placeholder="Enter price"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <div className="space-y-2">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFormChange('thumbnail_file', file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a thumbnail image (JPG, PNG, GIF - Max 5MB)
                </p>
                {formData.thumbnail_url && (
                  <div className="text-xs text-muted-foreground">
                    Current: {formData.thumbnail_url}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.is_featured}
                onChange={(e) => handleFormChange('is_featured', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="featured">Featured Course</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.is_published}
                onChange={(e) => handleFormChange('is_published', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="published">Publish Course</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isEdit ? 'Update Course' : 'Create Course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CourseFormDialog.displayName = 'CourseFormDialog';

export default CourseFormDialog;