import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../src/config/theme';
import { AuthGuard } from '../src/components/AuthGuard';

export default function NotificationsScreen() {
  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            Esta funcionalidad estará disponible próximamente
          </Text>
        </View>
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.primary[200],
    textAlign: 'center',
  },
});
