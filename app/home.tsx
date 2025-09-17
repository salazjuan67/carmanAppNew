import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  LogOut,
  Bell
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';
import { useAuth } from '../src/hooks/useAuth';
import { useVehicles, useEstablishments } from '../src/hooks/useVehicles';
import { AuthGuard } from '../src/components/AuthGuard';
import { VehicleList } from '../src/components/VehicleList';
import { EstablishmentSelector } from '../src/components/EstablishmentSelector';
import { ShiftButtonSimple } from '../src/components/ShiftButtonSimple';

export default function HomeScreen() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <AuthGuard>
      <HomeScreenContent 
        logout={logout} 
        user={user} 
        handleLogout={handleLogout} 
      />
    </AuthGuard>
  );
}

function HomeScreenContent({ logout, user, handleLogout }: {
  logout: () => Promise<void>;
  user: any;
  handleLogout: () => void;
}) {
  // Use establishments hook
  const { 
    establishments, 
    selectedEstablishment, 
    setSelectedEstablishment, 
    loading: establishmentsLoading 
  } = useEstablishments();
  
      // Use the selected establishment ID or fallback to user's establishment
      const establishmentId = selectedEstablishment?._id || user?.establecimiento || '666236d2b6316ac455e22509';
      
      // Use vehicles hook
      const { vehicles, loading, refetch } = useVehicles(establishmentId);

  const handleNewVehicle = () => {
    router.push('/vehicle/new');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.greeting}>¡Hola! 👋</Text>
              <Text style={styles.subtitle}>
                Bienvenido{user?.nombre ? `, ${user.nombre}` : ''} a Carman
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={styles.headerButton}
              >
                <Bell size={24} color="white" />
              </TouchableOpacity>
              {establishmentId && (
                <ShiftButtonSimple 
                  establishmentId={establishmentId}
                  establishmentName={selectedEstablishment?.nombre}
                />
              )}
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.headerButton}
              >
                <LogOut size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Establishment Selector */}
          <EstablishmentSelector
            establishments={establishments}
            selectedEstablishment={selectedEstablishment}
            onSelect={setSelectedEstablishment}
            loading={establishmentsLoading}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Vehicle List */}
        <View style={styles.vehicleSection}>
            <VehicleList 
              vehicles={vehicles} 
              loading={loading}
              onRefresh={refetch}
            />
        </View>

        {/* New Vehicle Button */}
        <TouchableOpacity
          style={styles.newVehicleButton}
          onPress={handleNewVehicle}
        >
          <Plus size={24} color="white" />
          <Text style={styles.newVehicleButtonText}>Nuevo Vehículo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  headerSection: {
    flex: 0.2,
    width: '100%',
    backgroundColor: colors.primary[800],
    padding: spacing.lg,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.primary[200],
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    backgroundColor: colors.primary[700],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  mainContent: {
    flex: 0.8,
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'space-between',
  },
  vehicleSection: {
    flex: 1,
  },
  newVehicleButton: {
    backgroundColor: colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  newVehicleButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
});
