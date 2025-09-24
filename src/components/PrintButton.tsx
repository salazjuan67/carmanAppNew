import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text, Alert, TouchableOpacity } from 'react-native';
import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Printer, Share } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { Vehicle } from '../types/vehicle';

interface PrintButtonProps {
  vehicle: Vehicle;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ vehicle }) => {
  const [loading, setLoading] = useState(false);

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
        <b style="font-size: larger">Recuerde, por favor, dejar las llaves de su vehículo y retirar sus pertenencias.<br> No nos responsabilizamos por robos o daños ocasionados por terceros.</b>
        
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
            <b>Escanee para solicitar el vehículo cuando desee retirarse</b>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=http://admin.carmanparking.com.ar/ticket/${vehicle._id}&amp;size=150x150" alt="qrcode" />   
        </div>
    </div>

</body>
</html>`;
  };

  const print = async () => {
    setLoading(true);
    try {
      await Print.printAsync({
        html: generateHTML(),
      });
    } catch (error) {
      console.error('Failed to print: ', error);
      Alert.alert('Error', 'No se pudo imprimir el documento');
    } finally {
      setLoading(false);
    }
  };

  const sharePDF = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.printButton]} 
        onPress={print}
        disabled={loading}
      >
        <Printer size={20} color={colors.white} />
        <Text style={styles.buttonText}>Imprimir 🖨️</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.shareButton]} 
        onPress={sharePDF}
        disabled={loading}
      >
        <Share size={20} color={colors.white} />
        <Text style={styles.buttonText}>Compartir PDF 📄</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  printButton: {
    backgroundColor: colors.primary[600],
  },
  shareButton: {
    backgroundColor: colors.secondary[600],
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
