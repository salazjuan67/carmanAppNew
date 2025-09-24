import { useRouter } from 'expo-router';

export const useNavigation = () => {
  const router = useRouter();

  const goBack = (fallbackRoute: string = '/home') => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    } catch (error) {
      console.warn('Navigation error:', error);
      router.push(fallbackRoute);
    }
  };

  const goToHome = () => {
    router.push('/home');
  };

  const goToAuth = () => {
    router.push('/auth');
  };

  const goToWelcome = () => {
    router.push('/');
  };

  const goToNewVehicle = () => {
    router.push('/vehicle/new');
  };

  return {
    goBack,
    goToHome,
    goToAuth,
    goToWelcome,
    goToNewVehicle,
    router,
  };
};
