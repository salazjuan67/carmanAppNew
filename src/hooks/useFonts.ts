import { useFonts } from 'expo-font';

export const useAppFonts = () => {
  const [fontsLoaded] = useFonts({
    Montserrat_300Light: require('../../assets/fonts/Montserrat-Regular.ttf'), // Fallback
    Montserrat_400Regular: require('../../assets/fonts/Montserrat-Regular.ttf'),
    Montserrat_600SemiBold: require('../../assets/fonts/Montserrat-Bold.ttf'), // Fallback
  });

  return fontsLoaded;
};
