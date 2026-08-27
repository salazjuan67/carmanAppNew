import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Clock, ChevronLeft, Ban, Repeat, Edit, User, Car, Crown, RotateCcw, X, CreditCard, Smartphone } from 'lucide-react-native';
import {
  View,
  ImageBackground,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { IconButton } from '../components/IconButton';
import { WideButton } from '../components/WideButton';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarmanIcon } from '../components/CarmanIcon';
import { Vehicle, VehicleState } from '../types/vehicle';
import { useUpdateState } from '../hooks/useUpdateState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { Dialog } from '../components/Dialog';
import { useUpdateInfo } from '../hooks/useUpdateInfo';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { normalizeSectorList, generateWhatsAppQR } from '../utils/formatters';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomSelect, SelectItem } from '../components/CustomSelect';
import QRCode from 'react-native-qrcode-svg';
import { API_ENDPOINTS } from '../config/constants';
import { AnimatedQRCode } from '../components/AnimatedQRCode';
import {
  ESTADO_EN_LA_PUERTA,
  isIngresosEstado,
  isSolicitadosEstado,
  normalizeEstado,
  parseVehicleStateChangeError,
} from '../utils/vehicleEstado';
export const DetailsScreen = ({ id }: { id: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [showVehicleInfoModal, setShowVehicleInfoModal] = useState(false);
  const [showPersonInfoModal, setShowPersonInfoModal] = useState(false);
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  const shineAnimation = useRef(new Animated.Value(0)).current;
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const backTop = (insets.top > 0 ? insets.top : 50) + 8;

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const {
    data: vehicle,
    error: vehicleErr,
    isError: vehicleHasErr,
    refetch: refetchVehicle,
    isFetching: gettingVehicle,
  } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getEntryById(id),
    staleTime: Infinity,
    gcTime: 0,
    refetchInterval: 1000 * 60,
  });

  const queryClient = useQueryClient();
  const { error, isPending, mutateAsync: updateState } = useUpdateState();
  const { mutateAsync: updateInfoAsync } = useUpdateInfo();

  useRefreshOnFocus(refetchVehicle);

  // Estados para el modal de edición
  const [newPlateText, setNewPlateText] = useState('');
  const [newSectorText, setNewSectorText] = useState('');
  const [sectores, setSectores] = useState<SelectItem[]>([]);

  // Inicializar estados cuando cambia el vehículo
  useEffect(() => {
    if (vehicle) {
      setNewPlateText(vehicle.patente || '');
      setNewSectorText(vehicle.sector || '');
    }
  }, [vehicle]);

  useEffect(() => {
    if (vehicle?.vip) {
      const startShineAnimation = () => {
        Animated.sequence([
          Animated.timing(shineAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(startShineAnimation, 2000); // Esperar 2 segundos antes de repetir
        });
      };
      startShineAnimation();
    }
  }, [vehicle?.vip, shineAnimation]);

  const estadoNorm = normalizeEstado(vehicle?.estado);

  const bgPath = isIngresosEstado(estadoNorm)
    ? require('../../assets/bg/red-parking.png')
    : require('../../assets/bg/yellow-parking.png');

  const handleChangeState = (state: VehicleState) => () => {
    const body = {
      estado: state,
      ingresoId: vehicle?._id!,
      horaEgreso: state === 'ENTREGADO' ? format(new Date(), 'HH:mm') : undefined,
      patente: vehicle?.patente,
      establecimiento: vehicle?.establecimiento?._id,
      estadoAnterior: vehicle?.estado,
    };
    updateState(body)
      .then((response) => {
        if (state === 'ENTREGADO') {
          Alert.alert('Vehiculo egresado', response?.message || 'El vehiculo ha sido egresado con exito', [
            {
              text: 'OK',
              onPress: handleGoBack,
            },
          ]);
        }
      })
      .catch((err) => {
        Alert.alert('Error', parseVehicleStateChangeError(err));
      })
      .finally(() => {
        refetchVehicle();
      });
  };

  const handleChangeInfo = async () => {
    const body = {
      patente: newPlateText || vehicle?.patente!,
      sector: newSectorText || vehicle?.sector!,
      establecimiento: vehicle?.establecimiento._id!,
      horaIngreso: vehicle?.horaIngreso!,
      nombreConductor: vehicle?.nombreConductor,
      telefono: vehicle?.telefono,
      marca: vehicle?.marca?._id,
      modelo: vehicle?.modelo,
      color: vehicle?.color,
      active: vehicle?.active,
    };

    console.log('🔄 Starting vehicle info update...');
    console.log('🔄 Body:', body);
    console.log('🔄 Vehicle ID:', vehicle?._id);

    try {
      await updateInfoAsync({ idVehicle: vehicle._id, body });
      console.log('✅ Vehicle info updated successfully');

      const nextPatente = body.patente;
      const nextSector = body.sector;
      queryClient.setQueryData<Vehicle>(['vehicle', id], (prev) =>
        prev ? { ...prev, patente: nextPatente, sector: nextSector } : prev
      );

      await refetchVehicle();

      setShowModal(false);
      Alert.alert('Éxito', 'Información del vehículo actualizada correctamente');
    } catch (e) {
      console.error('❌ Error actualizando info', e);
      Alert.alert('Error', 'No se pudo actualizar la información del vehículo');
      setShowModal(false);
    }
  };

  const openEditModal = async () => {
    if (!vehicle) return;

    setNewPlateText(vehicle.patente || '');
    setNewSectorText(vehicle.sector || '');

    const rawSectores = vehicle.establecimiento?.sectores;
    if (rawSectores && rawSectores.length > 0) {
      setSectores(normalizeSectorList(rawSectores));
    } else if (vehicle.establecimiento?._id) {
      try {
        const est = await vehicleService.getEstablishment(vehicle.establecimiento._id);
        if (est?.sectores && est.sectores.length > 0) {
          setSectores(normalizeSectorList(est.sectores));
        } else {
          setSectores([]);
        }
      } catch {
        setSectores([]);
      }
    } else {
      setSectores([]);
    }

    setShowModal(true);
  };

  const closeEditModal = () => {
    setShowModal(false);
  };

  if (vehicleErr) {
    console.error(vehicleErr);
    return (
      <Dialog
        message={t('errorLoadingVehicle')}
        title={t('unexpectedError')}
        btnAccept={handleGoBack}
        showDialog={vehicleHasErr}
      />
    );
  }

  if (error) console.error('-- Error en DetailsScreen --', error.message);

  if (vehicle) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={bgPath}
          resizeMode="stretch"
          style={styles.headerContainer}
        >
          {/* Botón de regreso */}
          <View style={[styles.backButtonContainer, { top: backTop }]}>
            <IconButton icon={<ChevronLeft size={25} color="black" />} onPress={handleGoBack} />
          </View>

          {/* Información principal */}
          <View style={styles.mainInfoContainer} pointerEvents="box-none">
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('plate')}</Text>
                <Text style={styles.infoValue}>{vehicle?.patente}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('key')}</Text>
                <Text style={styles.infoValue}>{vehicle?.nroLlave}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('sector')}</Text>
                <Text style={styles.infoValue}>{vehicle?.sector}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('schedule')}</Text>
                <Text style={styles.infoValue}>{vehicle?.horaIngreso}</Text>
              </View>
            </View>
          </View>

          {/* Iconos de información */}
          <View style={styles.iconsContainer}>
            {vehicle?.vip && (
              <Pressable style={styles.vipButton} onPress={() => setShowVehicleInfoModal(true)}>
                <Animated.View
                  style={[
                    styles.vipContainer,
                    {
                      transform: [
                        {
                          scale: shineAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.05],
                          }),
                        },
                      ],
                      opacity: shineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.8],
                      }),
                    },
                  ]}
                >
                  <Crown size={16} color="black" />
                  <Text style={styles.vipText}>{t('vip')}</Text>
                </Animated.View>
              </Pressable>
            )}
            <Pressable style={styles.iconButton} onPress={openEditModal}>
              <Edit size={20} color="black" />
            </Pressable>
            {vehicle?.recurrente && (
              <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
                <RotateCcw size={20} color="black" />
              </Pressable>
            )}
            {vehicle?.inhabilitado && (
              <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
                <X size={20} color="black" />
              </Pressable>
            )}
            <Pressable style={styles.iconButton} onPress={() => setShowVehicleInfoModal(true)}>
              <Car size={20} color="black" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setShowPersonInfoModal(true)}>
              <User size={20} color="black" />
            </Pressable>
            {(vehicle?.physicalCardNumber || vehicle?.noPhysicalCard) && (
              <Pressable style={styles.cardIconButton} onPress={() => setShowCardInfoModal(true)}>
                {vehicle?.physicalCardNumber ? (
                  <CreditCard size={20} color="white" />
                ) : (
                  <Smartphone size={20} color="white" />
                )}
              </Pressable>
            )}
          </View>
          </ImageBackground>
        
        <View style={styles.scrollContainer}>
          {/* Sección del QR - Separada y centrada */}
          <View style={styles.qrSection}>
            <AnimatedQRCode 
            value={vehicle.qrCode
                ? `${API_ENDPOINTS.QR_ENDPOINT}/${vehicle.qrCode}`
                : generateWhatsAppQR(vehicle)
              }
              vehicle={vehicle}
              size={200} 
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Sección de botones - Separada del QR */}
          <View style={styles.buttonsSection}>
            {isPending || gettingVehicle ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.black} size="large" />
              </View>
            ) : (
              <View style={styles.stateButtonsContainer}>
                <WideButton
                  onPress={handleChangeState('EN CAMINO')}
                  title={t('onWay')}
                  primary={estadoNorm === 'EN CAMINO'}
                />
                <WideButton
                  onPress={handleChangeState(ESTADO_EN_LA_PUERTA)}
                  title={t('atTheDoor')}
                  primary={estadoNorm === ESTADO_EN_LA_PUERTA}
                />
                <WideButton
                  onPress={handleChangeState('ENTREGADO')}
                  title={t('exit')}
                  primary={estadoNorm === 'ENTREGADO'}
                />
                {isSolicitadosEstado(estadoNorm) ? (
                  <WideButton
                    onPress={handleChangeState('ESTACIONADO')}
                    title={t('backToParked')}
                    primary
                  />
                ) : (
                  <WideButton
                    onPress={handleChangeState('INGRESADO')}
                    title={t('enter')}
                    primary={isIngresosEstado(estadoNorm)}
                  />
                )}
              </View>
            )}
          </View>

        </View>

        {/* Modal de edición - Solo patente y sector */}
        <Modal transparent animationType="fade" visible={showModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('newPlate')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPlateText}
                  onChangeText={setNewPlateText}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('newSector')}</Text>
                <CustomSelect
                  title={newSectorText || vehicle?.sector || t('selectSector')}
                  items={sectores}
                  onValueChange={(val) => setNewSectorText(val)}
                  selectedValue={newSectorText}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <WideButton title={t('accept')} onPress={handleChangeInfo} medium primary />
                <WideButton title={t('cancel')} onPress={closeEditModal} medium />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de información del vehículo */}
        <Modal transparent animationType="fade" visible={showVehicleInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('vehicleInformation')}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('plate')}</Text>
                <Text style={styles.modalValue}>{vehicle?.patente}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('brand')}</Text>
                <Text style={styles.modalValue}>{vehicle?.marca?.descripcion || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('color')}</Text>
                <Text style={styles.modalValue}>{vehicle?.color || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('model')}</Text>
                <Text style={styles.modalValue}>{vehicle?.modelo || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('driverName')}</Text>
                <Text style={styles.modalValue}>{vehicle?.nombreConductor?.trim() || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('phone')}</Text>
                <Text style={styles.modalValue}>{vehicle?.telefono?.trim() || t('notLoaded')}</Text>
              </View>

              {/* Información de tarjeta física en el modal */}
              {vehicle?.physicalCardNumber && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Tarjeta Física</Text>
                  <View style={styles.cardInfoModal}>
                    <CreditCard size={16} color={colors.primary[600]} />
                    <Text style={styles.modalValue}>{vehicle.physicalCardNumber}</Text>
                  </View>
                </View>
              )}

              {vehicle?.noPhysicalCard && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Método de Solicitud</Text>
                  <View style={styles.qrInfoModal}>
                    <Smartphone size={16} color={colors.primary[600]} />
                    <Text style={styles.modalValue}>QR Digital</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <WideButton title={t('close')} onPress={() => setShowVehicleInfoModal(false)} medium primary />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de información de tarjeta física */}
        <Modal transparent animationType="fade" visible={showCardInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tarjeta Física</Text>
              
              {vehicle?.physicalCardNumber ? (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Número de Tarjeta</Text>
                    <View style={styles.cardInfoModal}>
                      <CreditCard size={16} color={colors.primary[600]} />
                      <Text style={styles.modalValue}>{vehicle.physicalCardNumber}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Instrucciones</Text>
                    <Text style={styles.modalValue}>
                      El cliente debe entregar esta tarjeta física para solicitar su vehículo
                    </Text>
                  </View>
                </>
              ) : vehicle?.noPhysicalCard ? (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Método de Solicitud</Text>
                    <View style={styles.qrInfoModal}>
                      <Smartphone size={16} color={colors.primary[600]} />
                      <Text style={styles.modalValue}>Solo QR Digital</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Instrucciones</Text>
                    <Text style={styles.modalValue}>
                      El cliente debe escanear el QR que le mostró el valet para solicitar su vehículo
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.modalSection}>
                  <Text style={styles.modalValue}>{t('notSpecified')}</Text>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <WideButton title={t('close')} onPress={() => setShowCardInfoModal(false)} medium primary />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de información de la persona */}
        <Modal transparent animationType="fade" visible={showPersonInfoModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('personInformation')}</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('whoTakesVehicle')}</Text>
                <Text style={styles.modalValue}>{vehicle?.quienSeLleva || t('notSpecified')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('driverName')}</Text>
                <Text style={styles.modalValue}>{vehicle?.nombreConductor?.trim() || t('notLoaded')}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('phone')}</Text>
                <Text style={styles.modalValue}>{vehicle?.telefono?.trim() || t('notLoaded')}</Text>
              </View>
              
              <View style={styles.modalButtons}>
                <WideButton title={t('close')} onPress={() => setShowPersonInfoModal(false)} medium primary />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.white} size="large" />
    </View>
  );
};

const IconContainer = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.iconContainer}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground,
  },
  headerContainer: {
    flex: 0.175,
    width: '100%',
    marginTop: 0, // Sin margin para que llegue hasta arriba
    paddingTop: 50, // Padding para evitar el notch del iPhone
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 3,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  editButton: {
    position: 'absolute',
    left: 4,
    top: 10, // Ajustar para el nuevo marginTop
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: colors.white,
    padding: 8,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    elevation: 20,
  },
  mainInfoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  vehicleInfoContainer: {
    flex: 2,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  infoLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },
  infoValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  badgesContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  iconButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.black,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.primary[600],
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipButton: {
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.black,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  vipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'black',
  },
  bottomInfoContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: colors.white,
    width: 109,
    height: 32,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.black,
  },
  scrollContainer: {
    flex: 0.825,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  qrSection: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  buttonsSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stateButtonsContainer: {
    gap: 12,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '75%',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalSection: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 16,
  },
  modalLabel: {
    marginVertical: 8,
    fontWeight: '600',
  },
  modalInput: {
    width: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
  },
  modalValue: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    padding: spacing.sm,
    backgroundColor: colors.greyBackground,
    borderRadius: borderRadius.md,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    backgroundColor: colors.white,
    padding: 5,
    borderRadius: 5,
    borderColor: colors.black,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueBackGround,
  },
  cardInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  qrInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
});
