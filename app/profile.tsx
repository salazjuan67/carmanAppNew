import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { AuthGuard } from '../src/components/AuthGuard';

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileScreenContent />
    </AuthGuard>
  );
}

function ProfileScreenContent() {
  const menuItems = [
    {
      id: 'profile',
      title: 'Mi Perfil',
      icon: <User size={20} color="#64748b" />,
      onPress: () => console.log('Mi Perfil'),
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: <Bell size={20} color="#64748b" />,
      onPress: () => console.log('Notificaciones'),
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: <Shield size={20} color="#64748b" />,
      onPress: () => console.log('Seguridad'),
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: <HelpCircle size={20} color="#64748b" />,
      onPress: () => console.log('Ayuda'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => router.push('/')
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white font-montserrat">
            Perfil
          </Text>
        </View>

        {/* User Info */}
        <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20">
          <View className="items-center mb-6">
            <View className="bg-white/20 rounded-full p-4 mb-4">
              <User size={32} color="white" />
            </View>
            <Text className="text-white text-xl font-bold font-montserrat">
              Usuario Demo
            </Text>
            <Text className="text-primary-200 font-montserrat">
              usuario@demo.com
            </Text>
          </View>

          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold font-montserrat">
                24
              </Text>
              <Text className="text-primary-200 text-sm font-montserrat">
                Vehículos
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold font-montserrat">
                3
              </Text>
              <Text className="text-primary-200 text-sm font-montserrat">
                Establecimientos
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold font-montserrat">
                156
              </Text>
              <Text className="text-primary-200 text-sm font-montserrat">
                Operaciones
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mb-8">
          <Text className="text-white text-lg font-semibold mb-4 font-montserrat">
            Configuración
          </Text>
          <View className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                className={`flex-row items-center justify-between p-4 ${
                  index !== menuItems.length - 1 ? 'border-b border-white/10' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="mr-3">
                    {item.icon}
                  </View>
                  <Text className="text-white font-medium font-montserrat">
                    {item.title}
                  </Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View className="mb-8">
          <Text className="text-white text-lg font-semibold mb-4 font-montserrat">
            Información de la App
          </Text>
          <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-medium font-montserrat">
                Versión
              </Text>
              <Text className="text-primary-200 font-montserrat">
                1.0.0
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white font-medium font-montserrat">
                SDK
              </Text>
              <Text className="text-primary-200 font-montserrat">
                54.0.0
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-medium font-montserrat">
                Arquitectura
              </Text>
              <Text className="text-primary-200 font-montserrat">
                Nueva
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-error-500 rounded-2xl py-4 mb-8"
        >
          <View className="flex-row items-center justify-center">
            <LogOut size={20} color="white" className="mr-2" />
            <Text className="text-white text-lg font-semibold font-montserrat">
              Cerrar Sesión
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
