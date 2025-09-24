import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Printer, Share } from 'lucide-react-native';
import { colors, borderRadius, spacing } from '../config/theme';
import { Vehicle } from '../types/vehicle';
import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Alert } from 'react-native';

interface AnimatedQRCodeProps {
  value: string;
  vehicle: Vehicle;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export const AnimatedQRCode: React.FC<AnimatedQRCodeProps> = ({
  value,
  vehicle,
  size = 200,
  backgroundColor = 'white',
  color = 'black'
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.black, colors.primary[600]],
  });

  const borderWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 6],
  });

  const generateHTML = () => {
    const now = new Date();
    const entryTime = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const entryDate = now.toLocaleDateString('es-AR');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Carman - Valet Parking</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            text-align: center;
        }

        :root {
            --primary-color: #1976d2;
            --secondary-color: #f5f5f5;
            --text-color: #333;
            --border-color: #e0e0e0;
            --chip-bg: #e3f2fd;
            --spacing: 1rem;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--secondary-color);
            color: var(--text-color);
        }
        
        .container {
            background-color: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: calc(var(--spacing) * 2);
            max-width: 600px;
            width: 90%;
        }
        
        .logo {
            margin-bottom: var(--spacing);
        }
        
        .logo img {
            transition: transform 0.3s ease;
        }

        h1 {
            color: var(--primary-color);
            margin: var(--spacing) 0;
        }
        
        .vehicle-card {
            background-color: var(--secondary-color);
            border-radius: 12px;
            padding: calc(var(--spacing) * 1.5);
            margin: calc(var(--spacing) * 1.5) 0;
        }
        
        .vehicle-details {
            margin-bottom: var(--spacing);
        }
        
        .plate {
            font-weight: 600;
            font-size: 1.5rem;
            margin-bottom: var(--spacing);
        }
        .info-row {
            display: flex;
            justify-content: space-around;
            margin: calc(var(--spacing) / 2) 0;
            gap: var(--spacing);
        }
        
        .bold {
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .chip {
            background-color: var(--chip-bg);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 1.2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
        }

        #qrcode {
            margin: var(--spacing) auto;
            padding: var(--spacing);
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        #qrcode img {
            display: block;
            padding: 15px;
            margin: 0 auto;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: var(--spacing);
            }
            
            .info-row {
                flex-direction: column;
                align-items: center;
                gap: calc(var(--spacing) / 2);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="http://149.50.128.181:3000/carman.png" width="128" alt="carman_logo">
        </div>
        <header>
            <h1>¡Bienvenido!</h1>
        </header>
        <b style="font-size: larger">Recuerde dejar las llaves y retirar sus pertenencias. No nos responsabilizamos por robos o daños ocasionados por terceros.</b>
        
        <div class="vehicle-card">
            <div class="vehicle-details">
                <span class="plate">${vehicle.patente}</span> <br> 
                <small>Fecha de ingreso: ${entryDate}</small>
                <div class="info-row">
                    <span class="bold">Hora Ingreso</span>
                    <span class="bold">Sector</span>
                    <span class="bold">Llave</span>
                </div>
                <div class="info-row">
                    <span class="chip">${entryTime}</span>
                    <span class="chip">${vehicle.sector}</span>
                    <span class="chip">${vehicle.nroLlave || 0}</span>
                </div>
            </div>
        </div>

        <div id="qrcode">
            <b>Acceda al siguiente enlace para solicitar su vehículo</b>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=http://admin.carmanparking.com.ar/ticket/${vehicle._id}&amp;size=150x150" alt="qrcode" />   
        </div>
    </div>

</body>
</html>`;
  };

  const print = async () => {
    try {
      await Print.printAsync({
        html: generateHTML(),
      });
    } catch (error) {
      console.error('Failed to print: ', error);
      Alert.alert('Error', 'No se pudo imprimir el documento');
    }
  };

  const sharePDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      const isShareable = await isAvailableAsync();
      if (isShareable) {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Error', 'No se puede compartir el archivo en este momento');
      }
    } catch (error) {
      console.error('Failed to print to file: ', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedBorder,
          {
            borderColor,
            borderWidth,
            width: size + 60,
            height: size + 80,
          },
        ]}
      >
        <View style={[styles.qrContainer, { width: size, height: size }]}>
          <QRCode
            value={value}
            size={size - 20}
            backgroundColor={backgroundColor}
            color={color}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={print}>
            <Printer size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={sharePDF}>
            <Share size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animatedBorder: {
    borderRadius: borderRadius.xl,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  qrContainer: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    padding: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.22,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 0,
  },
  iconButton: {
    backgroundColor: colors.primary[600],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});