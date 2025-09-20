/* eslint-disable @typescript-eslint/prefer-optional-chain */
import { TULI_WS_BASE_URL } from '../../../constants/urls';
import React, {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Socket, io } from 'socket.io-client';
import {
  ExecutePaymentResponse,
  PaymentStatusResponse,
  WS_EVENTS,
} from './TuliFlowView.types';
import Engine from '../../../core/Engine';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { useSelector } from 'react-redux';
import {
  selectNetworkConfigurations,
  selectProviderConfig,
  ProviderConfig
} from '../../../selectors/networkController';
import { estimateGas } from '../../../util/transaction-controller';
import { getGlobalNetworkClientId } from '../../../util/networks/global-network';
import { toHex } from '@metamask/controller-utils';
import { TransactionParams } from '@metamask/transaction-controller';

interface ITuliFlowContext {
  socket: Socket | null;
  transaction: TransactionParams | undefined;
  setTransaction: Dispatch<SetStateAction<TransactionParams | undefined>>;
  paymentId: string;
  setPaymentId: Dispatch<SetStateAction<string>>;
  setPaymentData: Dispatch<SetStateAction<ExecutePaymentResponse | undefined>>;
  setIsPaymentReady: Dispatch<SetStateAction<boolean>>;
}

const TuliFlowContext = createContext<ITuliFlowContext>({
  socket: null,
  transaction: undefined,
  setTransaction: () => undefined,
  paymentId: '',
  setPaymentId: () => undefined,
  setPaymentData: () => undefined,
  setIsPaymentReady: () => undefined,
});

export const useTuliFLowContext = () => useContext(TuliFlowContext);

interface TuliFlowContextProps {
  children: React.ReactNode;
}

export const TuliFlowContextProvider = ({ children }: TuliFlowContextProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isListeningOnPaymentStatus, setIsListeningOnPaymentStatus] =
    useState(false);
  const [isListeningOnPaymentExecute, setIsListeningOnPaymentExecute] =
    useState(false);
  const [paymentData, setPaymentData] = useState<ExecutePaymentResponse>();
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [transaction, setTransaction] = useState<TransactionParams | undefined>();
  const [paymentId, setPaymentId] = useState('');

  const providerConfig: ProviderConfig = useSelector(selectProviderConfig);
  const selectedAddress = useSelector(selectSelectedInternalAccountFormattedAddress);
  const networkConfigurations = useSelector(selectNetworkConfigurations);
  const selectedNetworkClientId = getGlobalNetworkClientId();

  const generateGas = () =>
    Math.floor(Math.random() * (12000000 - 8000000 + 1)) + 8000000;

  const changeNetwork = (targetChainId: number) => {
    const { NetworkController, CurrencyRateController } = Engine.context;

    const entry = Object.entries(networkConfigurations).find(
      ([, { chainId }]) => +chainId === targetChainId,
    );

    if (entry) {
      const [networkConfigurationId, networkConfiguration] = entry;
      const { nativeCurrency } = networkConfiguration;

      CurrencyRateController.setCurrentCurrency(nativeCurrency);

      NetworkController.setActiveNetwork(networkConfigurationId);
    }
  };

  /*const estimateGas = async () => {
    const { TransactionController } = Engine.context;
    const estimation = await TransactionController.estimateGas({
      amount: paymentData?.executionInfo.payloads[0].value,
      from: selectedAddress,
      data: paymentData?.executionInfo.payloads[0].data,
      to: paymentData?.executionInfo.payloads[0].to,
      chainId: paymentData?.executionInfo.chainId,
    });

    return estimation;
  };*/

  const createTransaction = async () => {
    console.log('createTransaction', paymentData);
    if (paymentData?.executionInfo) {
      const estimation = await estimateGas({
      value: paymentData?.executionInfo.payloads[0].value,
      from: selectedAddress as string,
      data: paymentData?.executionInfo.payloads[0].data,
      to: paymentData?.executionInfo.payloads[0].to,
      chainId: toHex(paymentData.executionInfo.chainId),
    }, selectedNetworkClientId);
      // TODO: estimate gas
      const transactionObject: TransactionParams = {
        data: paymentData?.executionInfo.payloads[0].data,
        chainId: toHex(paymentData?.executionInfo.chainId),
        value: paymentData?.executionInfo.payloads[0].value,
        from: selectedAddress as string,
        to: paymentData?.executionInfo.payloads[0].to,
        gas: estimation.gas || `0x${generateGas().toString(16)}`,
        //gasPrice: estimation.gasPrice,
        estimateGasError: estimation.simulationFails?.errorKey || undefined,
      };
      setTransaction(transactionObject);
    }
  };

  useEffect(() => {
    const wsSocket = io(TULI_WS_BASE_URL, {
      path: '/ws',
      transports: ['websocket'],
    });

    setSocket(wsSocket);

    return () => {
      wsSocket.close();
    };
  }, []);

  useEffect(() => {
    console.log('paymentData, isPaymentReady, providerConfig.chainId', paymentData, isPaymentReady, providerConfig.chainId);
    if (paymentData && isPaymentReady && paymentData.executionInfo) {
      if (+providerConfig.chainId !== paymentData.executionInfo.chainId) {
        changeNetwork(paymentData.executionInfo.chainId);
        return;
      }
      createTransaction();
    }
  }, [paymentData, isPaymentReady, providerConfig.chainId]);

  useEffect(() => {
    const paymentStatusReceiveCallback = (payload: PaymentStatusResponse) => {
      console.log('status', payload);

      setIsListeningOnPaymentStatus(false);
    };

    if (socket?.connected) {
      if (isListeningOnPaymentStatus) {
        socket.off(WS_EVENTS.PAYMENT_STATUS, ({ payload }) =>
          paymentStatusReceiveCallback(payload),
        );
      } else {
        setIsListeningOnPaymentStatus(true);
      }
      socket.on(WS_EVENTS.PAYMENT_STATUS, ({ payload }) =>
        paymentStatusReceiveCallback(payload),
      );
    }

    return () => {
      socket?.off(WS_EVENTS.PAYMENT_STATUS, ({ payload }) =>
        paymentStatusReceiveCallback(payload),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    const paymentExecuteCallback = (payload: ExecutePaymentResponse) => {
      setPaymentData(payload);
      setIsListeningOnPaymentExecute(false);
      setIsPaymentReady(true);
    };

    console.log('useEffect paymentExecuteCallback', paymentId, isListeningOnPaymentExecute);
    if (socket && paymentId) {
      if (isListeningOnPaymentExecute) {
        socket.off(WS_EVENTS.EXECUTE_PAYMENT, ({ payload }) =>
          paymentExecuteCallback(payload),
        );
      } else {
        setIsListeningOnPaymentExecute(true);
      }

      socket.on(WS_EVENTS.EXECUTE_PAYMENT, ({ payload }) => {
        console.log('WS_EVENTS.EXECUTE_PAYMENT', payload);
        paymentExecuteCallback(payload);
      });
    }

    return () => {
      socket?.off(WS_EVENTS.EXECUTE_PAYMENT, ({ payload }) =>
        paymentExecuteCallback(payload),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, paymentId]);

  return (
    <TuliFlowContext.Provider
      value={{
        socket,
        transaction,
        setTransaction,
        setPaymentId,
        paymentId,
        setIsPaymentReady,
        setPaymentData,
      }}
    >
      {children}
    </TuliFlowContext.Provider>
  );
};

export default TuliFlowContextProvider;
