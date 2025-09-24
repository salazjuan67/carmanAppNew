import { DetailsScreen } from '../../src/pages/DetailsScreen';
import { useLocalSearchParams } from 'expo-router';

export default () => {
  const { id }: { id: string } = useLocalSearchParams();

  return <DetailsScreen id={id} />;
};
