import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large';
export type InterfaceScale = 'compact' | 'standard' | 'comfortable' | 'auto';

export interface DeviceInfo {
  deviceType: DeviceType;
  isTouchDevice: boolean;
  isPortrait: boolean;
  isLandscapePhone: boolean;
  screenWidth: number;
  screenHeight: number;
  interfaceScale: InterfaceScale;
  effectiveScale: 'compact' | 'standard' | 'comfortable';
  setInterfaceScale: (scale: InterfaceScale) => void;
}

const STORAGE_KEY = 'ecogrid_ui_scale_pref';

export function useDeviceType(): DeviceInfo {
  const [scalePref, setScalePref] = useState<InterfaceScale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'compact' || stored === 'standard' || stored === 'comfortable' || stored === 'auto') {
        return stored;
      }
    } catch {
      // Ignore storage errors
    }
    return 'auto';
  });

  const [windowDims, setWindowDims] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const screenWidth = windowDims.width;
  const screenHeight = windowDims.height;
  const isPortrait = screenHeight > screenWidth;
  const isLandscapePhone = screenHeight < 500 && screenWidth >= 500 && screenWidth < 950;

  let deviceType: DeviceType = 'desktop';
  if (screenWidth < 640 || isLandscapePhone) {
    deviceType = 'mobile';
  } else if (screenWidth < 1024) {
    deviceType = 'tablet';
  } else if (screenWidth >= 1800) {
    deviceType = 'large';
  } else {
    deviceType = 'desktop';
  }

  // Calculate effective scale
  let effectiveScale: 'compact' | 'standard' | 'comfortable' = 'standard';
  if (scalePref === 'auto') {
    if (deviceType === 'mobile') {
      effectiveScale = 'compact';
    } else if (deviceType === 'large') {
      effectiveScale = 'comfortable';
    } else {
      effectiveScale = 'standard';
    }
  } else {
    effectiveScale = scalePref;
  }

  const setInterfaceScale = (newScale: InterfaceScale) => {
    setScalePref(newScale);
    try {
      localStorage.setItem(STORAGE_KEY, newScale);
    } catch {
      // Ignore storage errors
    }
  };

  return {
    deviceType,
    isTouchDevice,
    isPortrait,
    isLandscapePhone,
    screenWidth,
    screenHeight,
    interfaceScale: scalePref,
    effectiveScale,
    setInterfaceScale,
  };
}
