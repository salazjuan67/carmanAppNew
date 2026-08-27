import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const useRefreshOnFocus = (refetch: () => void) => {
  const onFocus = useCallback(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(onFocus);
};















