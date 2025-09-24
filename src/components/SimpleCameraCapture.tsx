import React, { useState } from 'react'
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  Dimensions
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, X, Image as ImageIcon, RotateCcw } from 'lucide-react-native'
import { colors, spacing, borderRadius, typography } from '../config/theme'
import { useLanguage } from '../contexts/LanguageContext'

interface SimpleCameraCaptureProps {
  visible: boolean
  onClose: () => void
  onImageCaptured: (imageUri: string) => void
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const SimpleCameraCapture: React.FC<SimpleCameraCaptureProps> = ({
  visible,
  onClose,
  onImageCaptured
}) => {
  const { t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        t('galleryPermission'),
        t('galleryPermissionMessage'),
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error)
      Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería.')
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        t('cameraPermission'),
        t('cameraPermissionMessage'),
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'No se pudo tomar la foto.')
    }
  }

  const handleUseImage = () => {
    if (selectedImage) {
      onImageCaptured(selectedImage)
      setSelectedImage(null)
      onClose()
    }
  }

  const handleRetake = () => {
    setSelectedImage(null)
  }

  const handleClose = () => {
    setSelectedImage(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Capturar Imagen</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color={colors.white} size={24} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {selectedImage ? (
            // Preview de imagen seleccionada
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              
              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.retakeButton]} 
                  onPress={handleRetake}
                >
                  <RotateCcw color={colors.white} size={20} />
                  <Text style={styles.actionButtonText}>Tomar otra</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.useButton]} 
                  onPress={handleUseImage}
                >
                  <Text style={styles.actionButtonText}>Usar imagen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Opciones de captura
            <View style={styles.optionsContainer}>
              <Text style={styles.instructionText}>
                {t('selectFromGallery')}:
              </Text>
              
              <View style={styles.options}>
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={takePhoto}
                >
                  <Camera color={colors.white} size={32} />
                  <Text style={styles.optionButtonText}>{t('takePhoto')}</Text>
                  <Text style={styles.optionButtonSubtext}>{t('takePhoto')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={pickImageFromGallery}
                >
                  <ImageIcon color={colors.white} size={32} />
                  <Text style={styles.optionButtonText}>{t('selectFromGallery')}</Text>
                  <Text style={styles.optionButtonSubtext}>{t('selectFromGallery')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Consejos para mejor reconocimiento:</Text>
                <Text style={styles.tipText}>• Asegúrate de que la patente esté bien iluminada</Text>
                <Text style={styles.tipText}>• Mantén la cámara perpendicular a la patente</Text>
                <Text style={styles.tipText}>• Evita sombras y reflejos</Text>
                <Text style={styles.tipText}>• La patente debe ocupar la mayor parte de la imagen</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.darkBlue,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.white,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: screenWidth - (spacing.lg * 2),
    height: (screenWidth - (spacing.lg * 2)) * 0.75,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  retakeButton: {
    backgroundColor: colors.darkGrey,
  },
  useButton: {
    backgroundColor: colors.darkBlue,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: typography.sizes.lg,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.darkBlue,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  optionButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  optionButtonSubtext: {
    color: colors.ligthGrey,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tipsTitle: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  tipText: {
    color: colors.ligthGrey,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
})
