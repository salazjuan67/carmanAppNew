import { useWindowDimensions } from 'react-native';

/** Anchos típicos: phone < 768, iPad portrait ~834–1024, iPad Pro landscape ~1366 */
export const TABLET_MIN_WIDTH = 768;
export const LARGE_TABLET_MIN_WIDTH = 1024;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const isLargeTablet = width >= LARGE_TABLET_MIN_WIDTH;

  const vehicleColumns = isLargeTablet ? 5 : isTablet ? 4 : 3;
  const vehicleCardWidth = isLargeTablet ? 150 : isTablet ? 132 : 108;
  const contentMaxWidth = isTablet ? 980 : undefined;
  const pagePaddingHorizontal = isLargeTablet ? 32 : isTablet ? 24 : 20;
  const headerPaddingTop = isTablet ? 28 : 50;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    vehicleColumns,
    vehicleCardWidth,
    contentMaxWidth,
    pagePaddingHorizontal,
    headerPaddingTop,
  };
}
