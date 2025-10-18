import { useCallback, useEffect, useRef } from 'react';
import userInteractionService from '../services/userInteractionService';

export interface InteractionTrackingOptions {
  trackComponentView?: boolean;
  trackClicks?: boolean;
  trackFormSubmissions?: boolean;
  componentName?: string;
  componentPath?: string;
}

export const useUserInteraction = (options: InteractionTrackingOptions = {}) => {
  const {
    trackComponentView = true,
    trackClicks = true,
    trackFormSubmissions = true,
    componentName,
    componentPath
  } = options;

  const componentRef = useRef<HTMLElement>(null);
  const hasTrackedView = useRef(false);

  // Track component view when it mounts
  useEffect(() => {
    if (trackComponentView && componentName && !hasTrackedView.current) {
      userInteractionService.trackComponentView(
        componentName,
        componentPath || window.location.pathname,
        { 
          timestamp: new Date().toISOString(),
          componentMounted: true 
        }
      );
      hasTrackedView.current = true;
    }
  }, [trackComponentView, componentName, componentPath]);

  // Track button clicks within the component
  const trackButtonClick = useCallback(async (buttonElement: HTMLElement, additionalMetadata?: any) => {
    if (!trackClicks) return;
    
    await userInteractionService.trackButtonClick(buttonElement, {
      componentName,
      componentPath,
      ...additionalMetadata
    });
  }, [trackClicks, componentName, componentPath]);

  // Track form interactions
  const trackFormInteraction = useCallback(async (
    action: string, 
    formName?: string, 
    fieldName?: string, 
    additionalMetadata?: any
  ) => {
    if (!trackFormSubmissions) return;
    
    await userInteractionService.trackFormInteraction(
      action,
      formName || componentName,
      fieldName,
      {
        componentName,
        componentPath,
        ...additionalMetadata
      }
    );
  }, [trackFormSubmissions, componentName, componentPath]);

  // Track user actions
  const trackUserAction = useCallback(async (
    action: string, 
    target?: string, 
    additionalMetadata?: any
  ) => {
    await userInteractionService.trackUserAction(
      action,
      target,
      {
        componentName,
        componentPath,
        ...additionalMetadata
      }
    );
  }, [componentName, componentPath]);

  // Enhanced button click handler that can be used with onClick
  const handleButtonClick = useCallback(async (
    originalHandler?: () => void | Promise<void>,
    buttonText?: string,
    additionalMetadata?: any
  ) => {
    return async (event: React.MouseEvent<HTMLElement>) => {
      // Track the interaction
      const buttonElement = event.currentTarget;
      await trackButtonClick(buttonElement, {
        buttonText,
        originalHandler: originalHandler ? 'present' : 'none',
        ...additionalMetadata
      });

      // Call the original handler if provided
      if (originalHandler) {
        await originalHandler();
      }
    };
  }, [trackButtonClick]);

  return {
    trackButtonClick,
    trackFormInteraction,
    trackUserAction,
    handleButtonClick,
    componentRef
  };
};

// Specific hooks for common patterns
export const useButtonTracking = (buttonName: string, componentName?: string) => {
  const { handleButtonClick } = useUserInteraction({ 
    componentName, 
    trackComponentView: false 
  });

  return useCallback((originalHandler?: () => void | Promise<void>, additionalMetadata?: any) => {
    return handleButtonClick(originalHandler, buttonName, additionalMetadata);
  }, [handleButtonClick, buttonName]);
};

export const useFormTracking = (formName: string, componentName?: string) => {
  const { trackFormInteraction } = useUserInteraction({ 
    componentName, 
    trackComponentView: false 
  });

  return useCallback(async (
    action: string,
    fieldName?: string,
    additionalMetadata?: any
  ) => {
    await trackFormInteraction(action, formName, fieldName, additionalMetadata);
  }, [trackFormInteraction, formName]);
};
