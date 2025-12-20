/**
 * useShare Hook
 *
 * Provides functionality for sharing workout cards as images.
 * Supports Web Share API (mobile) with fallback to download (desktop).
 */

import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

interface UseShareOptions {
  fileName?: string;
  quality?: number;
}

interface ShareResult {
  success: boolean;
  method: 'share' | 'download' | 'clipboard';
  error?: string;
}

export function useShare(options: UseShareOptions = {}) {
  const { fileName = 'workout', quality = 1 } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate an image from a DOM element
   */
  const generateImage = useCallback(async (element: HTMLElement): Promise<Blob | null> => {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#000000',
        scale: 2, // Higher resolution for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/png',
          quality
        );
      });
    } catch (err) {
      console.error('Error generating image:', err);
      return null;
    }
  }, [quality]);

  /**
   * Check if Web Share API is available and supports files
   */
  const canShare = useCallback((): boolean => {
    return typeof navigator !== 'undefined' &&
           'share' in navigator &&
           'canShare' in navigator;
  }, []);

  /**
   * Share the image using Web Share API
   */
  const shareViaAPI = useCallback(async (blob: Blob, title: string): Promise<boolean> => {
    if (!canShare()) return false;

    try {
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      const shareData = {
        title,
        text: 'Check out my workout! 💪 #VoltLift #Fitness',
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
    return false;
  }, [canShare, fileName]);

  /**
   * Download the image as a file
   */
  const downloadImage = useCallback((blob: Blob): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [fileName]);

  /**
   * Copy image to clipboard
   */
  const copyToClipboard = useCallback(async (blob: Blob): Promise<boolean> => {
    try {
      if ('clipboard' in navigator && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        return true;
      }
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
    return false;
  }, []);

  /**
   * Main share function
   * Tries Web Share API first, falls back to download
   */
  const share = useCallback(async (
    element: HTMLElement,
    title: string = 'My Workout'
  ): Promise<ShareResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generateImage(element);
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      // Try native share first (mobile)
      if (canShare()) {
        const shared = await shareViaAPI(blob, title);
        if (shared) {
          setIsGenerating(false);
          return { success: true, method: 'share' };
        }
      }

      // Fallback to download
      downloadImage(blob);
      setIsGenerating(false);
      return { success: true, method: 'download' };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Share failed';
      setError(errorMessage);
      setIsGenerating(false);
      return { success: false, method: 'download', error: errorMessage };
    }
  }, [generateImage, canShare, shareViaAPI, downloadImage]);

  /**
   * Copy image to clipboard
   */
  const copy = useCallback(async (element: HTMLElement): Promise<ShareResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generateImage(element);
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      const copied = await copyToClipboard(blob);
      setIsGenerating(false);

      if (copied) {
        return { success: true, method: 'clipboard' };
      } else {
        // Fallback to download if clipboard fails
        downloadImage(blob);
        return { success: true, method: 'download' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Copy failed';
      setError(errorMessage);
      setIsGenerating(false);
      return { success: false, method: 'clipboard', error: errorMessage };
    }
  }, [generateImage, copyToClipboard, downloadImage]);

  /**
   * Download only (explicit)
   */
  const download = useCallback(async (element: HTMLElement): Promise<ShareResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generateImage(element);
      if (!blob) {
        throw new Error('Failed to generate image');
      }

      downloadImage(blob);
      setIsGenerating(false);
      return { success: true, method: 'download' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      setIsGenerating(false);
      return { success: false, method: 'download', error: errorMessage };
    }
  }, [generateImage, downloadImage]);

  return {
    share,
    copy,
    download,
    isGenerating,
    error,
    canShare: canShare(),
  };
}

export default useShare;
