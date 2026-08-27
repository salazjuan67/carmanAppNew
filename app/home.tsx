import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { 
  Plus, 
  LogOut
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../src/hooks/useAuth';
import { useEstablishments } from '../src/hooks/useVehicles';
import { useVehiclesWithPolling } from '../src/hooks/useVehiclesWithPolling';
import { getEstablishmentShift } from '../src/services/shiftServiceNew';
import { AuthGuard } from '../src/components/AuthGuard';
import { VehicleList } from '../src/components/VehicleList';
import { EstablishmentSelector } from '../src/components/EstablishmentSelector';
import { ShiftButtonSimple } from '../src/components/ShiftButtonSimple';
import { useShiftStore } from '../src/store/shiftStore';
import { useEstablishmentStore } from '../src/store/establishmentStore';
import { LanguageSelector } from '../src/components/LanguageSelector';
import { NotificationBell } from '../src/components/NotificationBell';
import { useLanguage } from '../src/contexts/LanguageContext';
import { isSessionExpiredVehicleError } from '../src/services/sessionExpired';
import { isIngresosEstado, isSolicitadosEstado } from '../src/utils/vehicleEstado';
import { useResponsiveLayout } from '../src/hooks/useResponsiveLayout';
import { useNotifications } from '../src/hooks/useNotifications';
import { PermissionPrompt } from '../src/components/PermissionPrompt';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  const runLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout:', e);
    }
    // La redirección a /auth la hace AuthGuard (web: location.assign; nativo: router.replace).
  };

  const handleLogout = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm(`${t('logout')}\n\n${t('logoutConfirm')}`);
      if (ok) void runLogout();
      return;
    }

    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => void runLogout(),
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

const HomeScreenContent = React.memo(function HomeScreenContent({ logout, user, handleLogout }: {
  logout: () => Promise<void>;
  user: any;
  handleLogout: () => void;
}) {
  const { t } = useLanguage();
  const { requestPermission, shouldShowPermissionPrompt } = useNotifications();
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const {
    isTablet,
    contentMaxWidth,
    pagePaddingHorizontal,
    headerPaddingTop,
  } = useResponsiveLayout();
  // Use establishments hook
  const { 
    establishments, 
    selectedEstablishment, 
    setSelectedEstablishment, 
    loading: establishmentsLoading 
  } = useEstablishments();
  
  // ID establecimiento: el usuario puede traer `establecimiento` como string o como objeto { _id, ... }
  const userEstablishmentId =
    typeof user?.establecimiento === 'string'
      ? user.establecimiento
      : user?.establecimiento?._id;
  // Priorizar siempre el selector; ?? evita saltar a user cuando _id existe pero otros campos no
  const establishmentId = selectedEstablishment?._id ?? userEstablishmentId;

  // Misma query que ShiftButtonSimple (queryKey compartido) para que la lista use el mismo turno que el candado
  const shiftFromStore = useShiftStore((state) => state.shift);
  const { data: shiftFromQuery, isLoading: shiftLoading } = useQuery({
    queryKey: ['shift', establishmentId],
    queryFn: () => getEstablishmentShift(establishmentId!),
    enabled: !!establishmentId,
    staleTime: 0,
  });
  const activeShift =
    (shiftFromQuery?._id ? shiftFromQuery : null) ??
    (shiftFromStore?._id && shiftFromStore.establecimiento === establishmentId
      ? shiftFromStore
      : null);
  const canAddVehicle = Boolean(activeShift?._id);

  // Use vehicles hook with polling
  const { vehicles, loading, refetch, error: vehiclesError } =
    useVehiclesWithPolling(establishmentId);

  const vehiclesErrorMessage = useMemo(() => {
    if (vehiclesError == null) return '';
    return vehiclesError instanceof Error
      ? vehiclesError.message
      : String(vehiclesError);
  }, [vehiclesError]);

  const activeVehicleCount = useMemo(
    () =>
      vehicles.filter((v) => isIngresosEstado(v.estado) || isSolicitadosEstado(v.estado)).length,
    [vehicles]
  );

  const setSelectedEstablishmentInStore = useEstablishmentStore((state) => state.setSelectedEstablishment);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowPermissionPrompt()) {
        setShowPermissionPrompt(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [shouldShowPermissionPrompt]);

  const handleNewVehicle = () => {
    if (shiftLoading) return;

    if (!canAddVehicle) {
      Alert.alert(t('noActiveShiftTitle'), t('noActiveShiftMessage'));
      return;
    }

    if (selectedEstablishment) {
      setSelectedEstablishmentInStore(selectedEstablishment);
    }
    router.push('/vehicle/new');
  };

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View
        style={[
          styles.shell,
          contentMaxWidth != null && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
        ]}
      >
      <ImageBackground
        tintColor={colors.white}
        resizeMode="stretch"
        style={[
          styles.headerSection,
          { paddingTop: headerPaddingTop, paddingHorizontal: pagePaddingHorizontal },
          isTablet && styles.headerSectionTablet,
        ]}
        source={require('../assets/bg/mask-group.png')}
      >
          <View style={styles.headerContent}>
            {/* Top Header */}
            <View style={styles.topHeader}>
              <View style={styles.headerTitleBlock}>
                <Text style={styles.greeting}>
                  {t('hello')}, {user?.nombre || user?.username}!
                </Text>
                <Text style={styles.shiftStatus}>
                  {activeShift
                    ? `🟢 Turno ${activeShift.turno} activo`
                    : '🔴 Sin turno activo'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <NotificationBell
                  onPress={() => router.push('/notifications')}
                  size={24}
                  color="white"
                  establishmentId={establishmentId}
                />
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
              activeVehicleCount={activeVehicleCount}
            />
          </View>
        </ImageBackground>

      {/* Main Content - Área blanca con bordes redondeados como la app vieja */}
      <View
        style={[
          styles.mainContent,
          { paddingHorizontal: pagePaddingHorizontal },
          isTablet && styles.mainContentTablet,
        ]}
      >
        {vehiclesErrorMessage.length > 0 ? (
          <View style={styles.sessionExpiredBanner}>
            <Text style={styles.sessionExpiredText}>{vehiclesErrorMessage}</Text>
          </View>
        ) : null}
        {/* Vehicle List */}
        <View style={styles.vehicleSection}>
            <VehicleList 
              vehicles={vehicles} 
              loading={loading}
              onRefresh={refetch}
              activeShift={activeShift}
              listFetchError={
                !isSessionExpiredVehicleError(vehiclesError) &&
                vehicles.length === 0 &&
                vehiclesErrorMessage.trim()
                  ? vehiclesErrorMessage
                  : undefined
              }
            />
        </View>

        {/* New Vehicle Button - Color darkBlue como la app vieja */}
        <TouchableOpacity
          style={[
            styles.newVehicleButton,
            (!canAddVehicle || shiftLoading) && styles.newVehicleButtonDisabled,
          ]}
          onPress={handleNewVehicle}
          activeOpacity={canAddVehicle && !shiftLoading ? 0.85 : 1}
        >
          <Plus size={24} color="white" />
          <Text style={styles.newVehicleButtonText}>{t('newVehicle')}</Text>
        </TouchableOpacity>
      </View>
      </View>

      {showPermissionPrompt ? (
        <PermissionPrompt
          onRequestPermission={requestPermission}
          onDismiss={() => setShowPermissionPrompt(false)}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround, // #161B25 como la app vieja
  },
  containerTablet: {
    backgroundColor: '#0c1220',
  },
  shell: {
    flex: 1,
    width: '100%',
  },
  headerSection: {
    flex: 0.25, // 25% como la app vieja
    width: '100%',
    paddingTop: 50, // Padding para evitar el notch del iPhone
    paddingHorizontal: 16, // padding horizontal como la app vieja
    paddingBottom: 16, // padding bottom como la app vieja
  },
  headerSectionTablet: {
    flex: 0,
    minHeight: 160,
    maxHeight: 220,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly', // space-evenly como la app vieja
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTitleBlock: {
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 0,
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  shiftStatus: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.88)',
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
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
    paddingBottom: 40, // Extra padding para evitar superposición con barra de navegación
    justifyContent: 'space-between',
  },
  mainContentTablet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  sessionExpiredBanner: {
    backgroundColor: colors.lightRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sessionExpiredText: {
    fontSize: typography.sizes.sm,
    color: colors.darkGrey,
    textAlign: 'center',
  },
  vehicleSection: {
    flex: 1,
  },
  newVehicleButton: {
    backgroundColor: colors.darkBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    marginTop: spacing.md,
    marginBottom: 20,
    gap: spacing.sm,
    minHeight: 56,
    minWidth: 200,
    alignSelf: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  newVehicleButtonDisabled: {
    backgroundColor: colors.secondary[400],
    shadowOpacity: 0.1,
    elevation: 2,
  },
  newVehicleButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: Math.round(typography.sizes.lg * 1.35),
    flexShrink: 1,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
});