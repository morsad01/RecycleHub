import { useMutation } from '@tanstack/react-query';
import { AIService } from '../services/aiService';

export function useAiDescription() {
  return useMutation({
    mutationFn: async ({ title, category, condition }: { title: string; category: string; condition: string }) => {
      return AIService.generateDescription(title, category, condition);
    }
  });
}

export function useAiPricing() {
  return useMutation({
    mutationFn: async ({ category, brand, condition }: { category: string; brand: string | null; condition: string | null }) => {
      return AIService.recommendPrice(category, brand, condition);
    }
  });
}

export function useAiFakeDetector() {
  return useMutation({
    mutationFn: async ({ title, description, price, brand }: { title: string; description: string; price: number; brand: string | null }) => {
      return AIService.detectRisk(title, description, price, brand);
    }
  });
}

export function useAiProductRecognition() {
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      return AIService.recognizeProduct(title);
    }
  });
}

export function useAiChatbot() {
  return useMutation({
    mutationFn: async (message: string) => {
      return AIService.askChatbot(message);
    }
  });
}
