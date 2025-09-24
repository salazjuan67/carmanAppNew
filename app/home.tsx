import { View, Text, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
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
import { useVehiclesWithPolling } from '../src/hooks/useVehiclesWithPolling';
import { AuthGuard } from '../src/components/AuthGuard';
import { VehicleList } from '../src/components/VehicleList';
import { EstablishmentSelector } from '../src/components/EstablishmentSelector';
import { ShiftButtonSimple } from '../src/components/ShiftButtonSimple';
import { useShiftStore } from '../src/store/shiftStore';
import { useEstablishmentStore } from '../src/store/establishmentStore';
import { LanguageSelector } from '../src/components/LanguageSelector';
import { useLanguage } from '../src/contexts/LanguageContext';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
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
  const { t } = useLanguage();
  // Use establishments hook
  const { 
    establishments, 
    selectedEstablishment, 
    setSelectedEstablishment, 
    loading: establishmentsLoading 
  } = useEstablishments();
  
  // Use the selected establishment ID or fallback to user's establishment
  const establishmentId = selectedEstablishment?._id || user?.establecimiento || '666236d2b6316ac455e22509';
  
  // Get current shift from store
  const shift = useShiftStore((state) => state.shift);
  
  // Use vehicles hook with polling
  const { vehicles, loading, refetch } = useVehiclesWithPolling(establishmentId);

  const setSelectedEstablishmentInStore = useEstablishmentStore((state) => state.setSelectedEstablishment);

  const handleNewVehicle = () => {
    // Asegurar que el establecimiento seleccionado esté en el store
    if (selectedEstablishment) {
      setSelectedEstablishmentInStore(selectedEstablishment);
    }
    router.push('/vehicle/new');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        tintColor={colors.white}
        resizeMode="stretch"
        style={styles.headerSection}
        source={require('../assets/bg/mask-group.png')}
      >
          <View style={styles.headerContent}>
            {/* Top Header */}
            <View style={styles.topHeader}>
              <View>
                <Text style={styles.greeting}>{t('hello')}</Text>
                <Text style={styles.subtitle}>
                  {t('welcome')}{user?.nombre ? `, ${user.nombre}` : ''} {t('toCarman')}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  style={styles.headerButton}
                >
                  <Bell size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.languageButtonContainer}>
                  <LanguageSelector />
                </View>
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
              onSelect={(establishment) => {
                setSelectedEstablishment(establishment);
                setSelectedEstablishmentInStore(establishment);
              }}
              loading={establishmentsLoading}
            />
          </View>
        </ImageBackground>

      {/* Main Content - Área blanca con bordes redondeados como la app vieja */}
      <View style={styles.mainContent}>
        {/* Vehicle List */}
        <View style={styles.vehicleSection}>
            <VehicleList 
              vehicles={vehicles} 
              loading={loading}
              onRefresh={refetch}
              activeShift={shift}
            />
        </View>

        {/* New Vehicle Button - Color darkBlue como la app vieja */}
        <TouchableOpacity
          style={styles.newVehicleButton}
          onPress={handleNewVehicle}
        >
          <Plus size={24} color="white" />
          <Text style={styles.newVehicleButtonText}>{t('newVehicle')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround, // #161B25 como la app vieja
  },
  headerSection: {
    flex: 0.25, // 25% como la app vieja
    width: '100%',
    paddingTop: 50, // Padding para evitar el notch del iPhone
    paddingHorizontal: 16, // padding horizontal como la app vieja
    paddingBottom: 16, // padding bottom como la app vieja
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly', // space-evenly como la app vieja
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
    color: colors.white, // Texto blanco como la app vieja
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    backgroundColor: colors.darkGrey,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonContainer: {
    backgroundColor: colors.darkGrey,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 0.75, // 75% como la app vieja
    width: '100%',
    backgroundColor: colors.white, // Fondo blanco como la app vieja
    borderTopLeftRadius: 38, // 38px como la app vieja
    borderTopRightRadius: 38,
    paddingHorizontal: 20, // 20px como la app vieja
    paddingVertical: 16, // 16px como la app vieja
    justifyContent: 'space-between',
  },
  vehicleSection: {
    flex: 1,
  },
  newVehicleButton: {
    backgroundColor: colors.darkBlue, // #130F26 como la app vieja
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 13, // 13px como la app vieja
    marginTop: spacing.md,
    gap: spacing.sm,
    height: 50, // Altura fija como la app vieja
  },
  newVehicleButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
});