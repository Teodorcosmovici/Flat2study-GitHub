import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhotosStepProps {
  data: {
    images: string[];
  };
  updateData: (newData: any) => void;
}

export const PhotosStep: React.FC<PhotosStepProps> = ({ data, updateData }) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if user is authenticated
    if (!user) {
      toast({
        title: t('photos.authRequired'),
        description: t('photos.signInToUpload'),
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const userId = user.id;

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const random = Math.random().toString(36).slice(2, 8);
        const fileName = `${Date.now()}-${random}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      updateData({ images: [...data.images, ...uploadedUrls] });
      toast({
        title: t('photos.uploadSuccess'),
        description: `${uploadedUrls.length} ${t('photos.photosAdded')}`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: t('photos.uploadFailed'),
        description: t('photos.uploadFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = data.images.filter((_, i) => i !== index);
    updateData({ images: newImages });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>{t('photos.propertyPhotos')} *</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {t('photos.uploadDescription')}
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <Label htmlFor="photo-upload" className="cursor-pointer">
            <Button variant="outline" disabled={uploading} asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? t('photos.uploading') : t('photos.choosePhotos')}
              </span>
            </Button>
          </Label>
          <Input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground mt-2">
            {t('photos.formatSupport')}
          </p>
        </div>
      </div>

      {data.images.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">
              {t('photos.uploadedPhotos')} ({data.images.length}/{t('photos.minimum')} 4)
            </h4>
            <span className={`text-sm ${data.images.length >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
              {data.images.length >= 4 ? t('photos.minimumMet') : `${4 - data.images.length} ${t('photos.moreNeeded')}`}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.images.map((image, index) => (
              <Card key={index} className="relative group overflow-hidden">
                 <img
                   src={image}
                   alt={`${t('photos.propertyPhoto')} ${index + 1}`}
                   className="w-full h-32 object-cover"
                 />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {index === 0 && (
                   <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                     {t('photos.mainPhoto')}
                   </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};