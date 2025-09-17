import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Car, 
  Bell, 
  Settings, 
  Plus, 
  Search, 
  MapPin,
  Clock,
  Users,
  LogOut
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';
import { useAuth } from '../src/hooks/useAuth';
import { AuthGuard } from '../src/components/AuthGuard';

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
  const quickActions = [
    {
      id: 'new-vehicle',
      title: 'Nuevo Vehículo',
      icon: <Plus size={24} color="white" />,
      backgroundColor: colors.success[500],
      onPress: () => console.log('Nuevo vehículo'),
    },
    {
      id: 'search-vehicle',
      title: 'Buscar Vehículo',
      icon: <Search size={24} color="white" />,
      backgroundColor: colors.primary[500],
      onPress: () => console.log('Buscar vehículo'),
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: <Bell size={24} color="white" />,
      backgroundColor: colors.warning[500],
      onPress: () => console.log('Notificaciones'),
    },
    {
      id: 'settings',
      title: 'Configuración',
      icon: <Settings size={24} color="white" />,
      backgroundColor: colors.secondary[500],
      onPress: () => router.push('/profile'),
    },
  ];

  const stats = [
    { label: 'Vehículos Activos', value: '24', icon: <Car size={20} color={colors.primary[500]} /> },
    { label: 'Establecimientos', value: '3', icon: <MapPin size={20} color={colors.success[500]} /> },
    { label: 'Turnos Hoy', value: '8', icon: <Clock size={20} color={colors.warning[500]} /> },
    { label: 'Usuarios', value: '12', icon: <Users size={20} color={colors.secondary[500]} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola! 👋</Text>
            <Text style={styles.subtitle}>
              Bienvenido{user?.nombre ? `, ${user.nombre}` : ''} a Carman
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={styles.headerButton}
            >
              <Settings size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.headerButton}
            >
              <LogOut size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Día</Text>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statHeader}>
                  {stat.icon}
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={action.onPress}
                style={[styles.actionCard, { backgroundColor: action.backgroundColor }]}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionIcon}>
                    {action.icon}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.success[500] }]}>
                <Car size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Vehículo ABC123 ingresó</Text>
                <Text style={styles.activityTime}>Hace 5 minutos</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.warning[500] }]}>
                <Bell size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nueva notificación</Text>
                <Text style={styles.activityTime}>Hace 15 minutos</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary[500] }]}>
                <Users size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Usuario conectado</Text>
                <Text style={styles.activityTime}>Hace 30 minutos</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  subtitle: {
    color: colors.primary[200],
    fontSize: typography.sizes.base,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  statLabel: {
    color: colors.primary[200],
    fontSize: typography.sizes.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    width: '48%',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: spacing.md,
  },
  actionTitle: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityIcon: {
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  activityTime: {
    color: colors.primary[200],
    fontSize: typography.sizes.sm,
  },
});
