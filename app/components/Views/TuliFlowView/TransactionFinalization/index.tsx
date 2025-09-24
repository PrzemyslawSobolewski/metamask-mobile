/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getTuliFlowTitle } from '../../../UI/Navbar';
import { useTheme } from '../../../../util/theme';
import Button, {
  ButtonVariants,
  ButtonSize,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import Engine from '../../../../core/Engine';
import TransactionTypes from '../../../../core/TransactionTypes';
import { TransactionType, WalletDevice } from '@metamask/transaction-controller';
import NotificationManager from '../../../../core/NotificationManager';
import { stopGasPolling } from '../../../../core/GasPolling/GasPolling';
import { resetTransaction } from '../../../../actions/transaction';
import { KEYSTONE_TX_CANCELED } from '../../../../constants/error';
import { strings } from '../../../../../locales/i18n';
import { useTuliFLowContext } from '../TuliFlowView.context';
import Loader from '../../../../component-library/components-temp/Loader';
import { IDemoNotify, PaymentStatus } from '../TuliFlowView.types';
import TuliLogo from '../assets/tuli_logo.svg';
import TuliLogoRadial from '../assets/tuli_logo_radial.svg';
import LinearGradient from 'react-native-linear-gradient';
import { getGlobalNetworkClientId } from '../../../../util/networks/global-network';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';

const createStyles = (colors: any) =>
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
    textWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 10,
      marginHorizontal: 40,
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
    wrapper: {
      width: 342,
      borderWidth: 1,
      borderColor: '#DFE3E8',
      backgroundColor: '#F4F6F8',
      flexDirection: 'column',
      gap: 12,
      padding: 16,
      borderRadius: 24,
      marginTop: 20,
    },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 2,
    },
    header: {
      fontWeight: '400',
      color: '#637381',
      fontSize: 15,
    },
    value: {
      fontWeight: '400',
      color: '#212B36',
      fontSize: 15,
    },
    loaderWrapper: {
      position: 'relative',
      height: 80,
    },
    bottomWrapper: {
      width: '100%',
      left: 0,
      right: 0,
      bottom: 80,
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
  });

const TransactionFinalization = () => {
  const navigation = useNavigation();
  const {
    socket,
    transaction,
    setTransaction,
    setIsPaymentReady,
    setPaymentData,
    paymentId,
  } = useTuliFLowContext();
  
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const selectedNetworkClientId = getGlobalNetworkClientId();

  const handleTransaction = async () => {
    if (transaction) {
      const { TransactionController, KeyringController, ApprovalController } =
        Engine.context;

      try {
        const { result, transactionMeta } =
          await TransactionController.addTransaction(
            {
              ...transaction,
            },
            {
                deviceConfirmedOn: WalletDevice.MM_MOBILE,
                networkClientId: selectedNetworkClientId,
                origin: ORIGIN_METAMASK,
                type: TransactionType.swap,
            },
          );

          console.log("TX META", transactionMeta);
        await KeyringController.resetQRKeyringState();
        await ApprovalController.accept(transactionMeta.id, undefined, {
          waitForResult: true,
        });

        await new Promise((resolve) => resolve(result));

        if (transactionMeta.error) {
          throw transactionMeta.error;
        }

        InteractionManager.runAfterInteractions(() => {
          NotificationManager.watchSubmittedTransaction(
            {
              ...transactionMeta,
            },
          );

          stopGasPolling();
          resetTransaction();

          navigation && navigation.dangerouslyGetParent()?.pop?.();
        });
      } catch (error: any) {
        console.log('Error while submitting transaction', error);
        if (!error?.message.startsWith(KEYSTONE_TX_CANCELED)) {
          Alert.alert(
            strings('transactions.transaction_error'),
            error && error.message,
            [{ text: 'OK' }],
          );
        }
        setTransaction(undefined);
        socket?.emit('notifyDemo', {
          paymentId,
          paymentStatus: PaymentStatus.Timeout,
        } as IDemoNotify);
        navigation && navigation.dangerouslyGetParent()?.pop?.();
      }
    } else {
      Alert.alert(
        strings('transactions.transaction_error'),
        'No transaction data found',
        [{ text: 'OK' }],
      );
      socket?.emit('notifyDemo', {
        paymentId,
        paymentStatus: PaymentStatus.Timeout,
      } as IDemoNotify);
      navigation && navigation.dangerouslyGetParent()?.pop?.();
    }
    return;
  };

  useEffect(() => {
    navigation.setOptions(
      getTuliFlowTitle(
        'tuli.confirm_transaction',
        navigation,
        colors,
        () => undefined,
      ),
    );
  }, [colors, navigation]);

  useEffect(() => {
    setIsPaymentReady(false);
    setPaymentData(undefined);
  }, [setIsPaymentReady, setPaymentData]);

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
        <Text style={styles.mainText}>Confirm Transaction</Text>
        <Text style={styles.subText}>
          Confirm the transaction to complete it
        </Text>
      </View>
      {transaction ? (
        <>
          <View style={styles.wrapper}>
            <View style={styles.item}>
              <Text style={styles.header}>Transaction Fee:</Text>
              <Text style={styles.value}>
                {transaction.gas && (
                  <>
                    {(
                      Number(BigInt(transaction.gas as string)) / 10000000000
                    ).toFixed(7)}
                  </>
                )}
              </Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.header}>From</Text>
              <Text style={styles.value}>
                {transaction?.from.substring(0, 5)}
                {'...'}
                {transaction?.from.substring(
                  transaction?.from.length - 4,
                  transaction?.from.length,
                )}
              </Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.header}>To:</Text>
              <Text style={styles.value}>
                {' '}
                {transaction?.to?.substring(0, 5)}
                {'...'}
                {transaction?.to?.substring(
                  transaction?.to?.length - 4,
                  transaction?.to?.length,
                )}
              </Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.header}>Chain id:</Text>
              <Text style={styles.value}>{transaction?.chainId}</Text>
            </View>
          </View>

          <View style={styles.bottomWrapper}>
            <View style={styles.buttonWrapper}>
              <TouchableOpacity onPress={() => handleTransaction()}>
                <LinearGradient
                  colors={['#5376f7', '#3366FF']}
                  style={[styles.button, styles.buttonShadow]}
                >
                  <Text style={styles.buttonText}>Confirm transaction</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.loaderWrapper}>
          <Loader size="large" />
        </View>
      )}
    </View>
  );
};

export default TransactionFinalization;
