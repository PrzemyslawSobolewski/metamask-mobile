/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-color-literals */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getTuliFlowTitle } from '../../../../components/UI/Navbar';
import { useTheme } from '../../../../util/theme';
import { selectSelectedAddress } from '../../../../selectors/preferencesController';
import { getCode } from '../api/codeGenerator';
import ClipboardManager from '../../../../core/ClipboardManager';
import Timer from './Timer';
import { useTuliFLowContext } from '../TuliFlowView.context';
import { IJoinRoom, WS_EVENTS } from '../TuliFlowView.types';
import TuliLogo from '../assets/tuli_logo.svg';
import TuliLogoRadial from '../assets/tuli_logo_radial.svg';
import LinearGradient from 'react-native-linear-gradient';

const createStyles = () =>
  StyleSheet.create({
    container: {
      marginTop: 20,
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      position: 'relative',
    },
    logoWrapper: {
      marginTop: 20,
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    logo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoRadialWrapper: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    code: {
      textAlign: 'center',
      fontSize: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 10,
      marginHorizontal: 80,
      gap: 8,
    },
    mainText: {
      color: '#212B36',
      fontWeight: '700',
      fontSize: 20,
      textAlign: 'center',
    },
    subText: {
      color: '#637381',
      fontWeight: '400',
      fontSize: 15,
      textAlign: 'center',
    },
    codeWrapper: {
      width: '80%',
      height: 56,
      backgroundColor: '#F6F6F6',
      borderRadius: 32,
      borderColor: '#DFE3E8',
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 24,
    },
    bottomWrapper: {
      width: '100%',
      left: 0,
      right: 0,
      bottom: 60,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: 16,
      position: 'absolute',
    },
    refreshWrapper: {
      width: 342,
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonWrapper: {
      width: '90%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      width: 342,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
      height: 48,
    },
    buttonShadow: {
      shadowColor: '#3265FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 1,
      elevation: 2,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    timeToRefresh: {
      color: '#3C405D',
      fontSize: 13,
      fontWeight: '400',
    },
    refreshButton: {
      height: 28,
      borderRadius: 16,
      color: '#36394A',
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: '#C1C7D0',
      width: 84,
      borderWidth: 1,
    },
  });

const GenerateCodeView = () => {
  const [code, setCode] = useState('');
  const [initialMinutes, setInitialMinutes] = useState(30);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { socket, setPaymentId } = useTuliFLowContext();

  const [isTimerRender, setIsTimerRender] = useState(true);

  const { colors } = useTheme();

  const styles = createStyles();
  const navigation = useNavigation();
  const selectedAddress = useSelector(selectSelectedAddress);

  const copyToClipboard = async () => {
    await ClipboardManager.setString(code);
  };

  const handleFetchCode = useCallback(async () => {
    try {
      setErrorMessage('');
      setIsLoading(true);
      const res = await getCode(selectedAddress);

      const millis = res.validity * 1000 - Date.now();

      if (socket) {
        const roomData = {
          paymentId: res.paymentId,
          getLast: false,
        };
        
        socket.emit('join', {
          ...roomData,
          eventType: WS_EVENTS.EXECUTE_EVENT,
        } as IJoinRoom);

        console.log('join room for execute payment', {...roomData, eventType: WS_EVENTS.EXECUTE_EVENT});
        socket.emit('join', {
          ...roomData,
          eventType: WS_EVENTS.EXECUTION_EVENT_STATUS,
        } as IJoinRoom);
        console.log('joined room for payment status', {...roomData, eventType: WS_EVENTS.EXECUTION_EVENT_STATUS});
        setPaymentId(res.paymentId);
      }
      setInitialMinutes(Math.floor(millis / 60000));
      setInitialSeconds(+((millis % 60000) / 1000).toFixed(0));
      setCode(res.code);
      setIsTimerRender(false);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setErrorMessage('could not generate code');
      setIsLoading(false);
    }
  }, [setPaymentId, socket]);

  useEffect(() => {
    setMinutes(initialMinutes);
    setSeconds(initialSeconds);
  }, [initialMinutes, initialSeconds]);

  useEffect(() => {
    !isTimerRender && setIsTimerRender(true);
  }, [isTimerRender]);

  useEffect(() => {
    setIsTimerRender(false);
  }, [selectedAddress]);

  useEffect(() => {
    navigation.setOptions(
      getTuliFlowTitle(
        'tuli.generate_code',
        navigation,
        colors,
        () => undefined,
      ),
    );
  }, [colors, navigation]);

  useEffect(() => {
    if (minutes === 0 && seconds === 1) {
      handleFetchCode();
    }
  }, [handleFetchCode, minutes, seconds]);

  useEffect(() => {
    handleFetchCode();
  }, [handleFetchCode]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <View style={styles.logoRadialWrapper}>
          <TuliLogoRadial name="tuli logo radial" />
          <View style={styles.logo}>
            <TuliLogo name="tuli logo" />
          </View>
        </View>
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.mainText}>Code Generation</Text>
        <Text style={styles.subText}>
          {code
            ? 'Enter your code to complete the transaction'
            : 'Press the button to generate the code'}
        </Text>
      </View>
      {!code && (
        <>
          <View style={styles.codeWrapper}>
            <Text style={styles.code}>--- ---</Text>
          </View>
          <View style={{ opacity: 0.5, width: '100%' }}>
            <Timer
              time={initialMinutes * 60 * 1000 + initialSeconds * 1000}
              minutes={initialMinutes}
              seconds={initialSeconds}
              setMinutes={setMinutes}
              setSeconds={setSeconds}
              disabled
              handleRefresh={handleFetchCode}
            />
          </View>
        </>
      )}

      {code && !isLoading && (
        <>
          <View style={styles.codeWrapper}>
            <TouchableOpacity onPress={() => copyToClipboard()}>
              <Text style={styles.code}>
                {code.substring(0, 3)} {code.substring(3, 6)}
              </Text>
            </TouchableOpacity>
          </View>

          {isTimerRender && (
            <Timer
              time={initialMinutes * 60 * 1000 + initialSeconds * 1000}
              minutes={minutes}
              seconds={seconds}
              setMinutes={setMinutes}
              setSeconds={setSeconds}
              handleRefresh={handleFetchCode}
            />
          )}
        </>
      )}

      <View style={styles.bottomWrapper}>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={() => (code ? copyToClipboard() : handleFetchCode())}
          >
            <LinearGradient
              colors={['#5376f7', '#3366FF']}
              style={[styles.button, styles.buttonShadow]}
            >
              <Text style={styles.buttonText}>
                {code ? 'Copy verification code' : 'Generate code'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={[styles.refreshWrapper, { opacity: code ? 1 : 0.5 }]}>
          <Text style={styles.timeToRefresh}>
            {code ? (
              <>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </>
            ) : (
              <>0:00</>
            )}{' '}
            to generate new code
          </Text>
          <View style={styles.refreshButton}>
            <TouchableOpacity onPress={() => code && handleFetchCode()}>
              <Text>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default GenerateCodeView;
