import { useState } from 'react';
import { X, Send, Loader2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { basicApiCall } from "@/src/lib/api";
import { IReview } from '../types/review';
import StarRating from './StarRating';
import { useTranslations } from 'next-intl';
import { useToast } from "@/src/hooks/use-toast";

interface ReviewFloatingProps {
  videoId: string;
  onClose: () => void;
}

export const ReviewFloating = ({ videoId, onClose }: ReviewFloatingProps) => {
  const t = useTranslations('edit.review');
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [details, setDetails] = useState("");
  const [isDetailStep, setIsDetailStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (newRating: number) => {
    try {
      setRating(newRating);
      
      if (newRating <= 3) {
        setIsDetailStep(true);
      } else {
        toast({
          title: t('toast.thank-you'),
          description: t('toast.feedback-received'),
          variant: 'confirm',
        });
        onClose();
      }

      const review: IReview = await basicApiCall('/reviews', {
        videoId,
        stars: newRating
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.error-message'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitDetails = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!rating || !details.trim()) return;
    setIsSubmitting(true);

    try {
      await basicApiCall('/reviews/update', {
        videoId,
        stars: rating,
        review: details
      });

      toast({
        title: t('toast.thank-you'),
        description: t('toast.feedback-received'),
        variant: 'confirm',
      });
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.error-message'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitDetails();
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto">
      <div className="bg-white border rounded-lg shadow-lg p-4 m-4 relative animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-gray-600">
            {isDetailStep
              ? t('details-title')
              : t('title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {!isDetailStep ? (
              <StarRating
                rating={rating}
                onRate={handleRating}
                className="animate-in fade-in duration-300"
              />
            ) : (
              <form onSubmit={handleSubmitDetails} className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('placeholder')}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSubmitting || !details.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 