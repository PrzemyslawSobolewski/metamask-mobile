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
import { handleNetworkSwitch } from '../../../util/networks/handleNetworkSwitch';

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
  const [isConnected, setIsConnected] = useState(false);

  const providerConfig: ProviderConfig = useSelector(selectProviderConfig);
  const selectedAddress = useSelector(selectSelectedInternalAccountFormattedAddress);
  const networkConfigurations = useSelector(selectNetworkConfigurations);
  const selectedNetworkClientId = getGlobalNetworkClientId();

  const generateGas = () =>
    Math.floor(Math.random() * (12000000 - 8000000 + 1)) + 8000000;

  const changeNetwork = (targetChainId: number) => {
    handleNetworkSwitch(toHex(targetChainId));
    
    
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
        gas: `0x${generateGas().toString(16)}`,
        //gasPrice: estimation.gasPrice,
        estimateGasError: estimation.simulationFails?.reason || undefined,
      };
      setTransaction(transactionObject);
    }
  };

  useEffect(() => {
    const wsSocket = io(TULI_WS_BASE_URL, {
      path: '/ws',
      transports: ['websocket'],
    });

    wsSocket.on('connect', () => {
      setIsConnected(true);
    });

    setSocket(wsSocket);

    return () => {
      wsSocket.close();
    };
  }, []);

  useEffect(() => {
    if (paymentData && isPaymentReady && paymentData.executionInfo) {
      if (providerConfig.chainId !== toHex(paymentData.executionInfo.chainId)) {
        changeNetwork(paymentData.executionInfo.chainId);
        return;
      }
      createTransaction();
    }
  }, [paymentData, isPaymentReady, providerConfig.chainId]);

  useEffect(() => {
    console.log("INFURE API", "4d74e772b1ad4abc935b28127dfa746f")
     const paymentStatusReceiveCallback = (payload: PaymentStatusResponse) => {
      setIsListeningOnPaymentStatus(false);
    };

    if (isConnected && socket) {
      if (isListeningOnPaymentStatus) {
        socket.off(WS_EVENTS.EXECUTION_EVENT_STATUS, ({ payload }) =>
          paymentStatusReceiveCallback(payload),
        );
      } else {
        setIsListeningOnPaymentStatus(true);
      }
      socket.on(WS_EVENTS.EXECUTION_EVENT_STATUS, ({ payload }) =>
        paymentStatusReceiveCallback(payload),
      );
    }

    return () => {
      socket?.off(WS_EVENTS.EXECUTION_EVENT_STATUS, ({ payload }) =>
        paymentStatusReceiveCallback(payload),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, socket]);

  useEffect(() => {
    const paymentExecuteCallback = (payload: ExecutePaymentResponse) => {
      setPaymentData(payload);
      setIsListeningOnPaymentExecute(false);
      setIsPaymentReady(true);
    };

   
    if (isConnected && paymentId && socket) {
       console.log('listen for WS_EVENTS.EXECUTE_EVENT', paymentId, socket?.connected);
      if (isListeningOnPaymentExecute) {
        socket.off(WS_EVENTS.EXECUTE_EVENT, ({ payload }) =>
          paymentExecuteCallback(payload),
        );
      } else {
        setIsListeningOnPaymentExecute(true);
      }

      socket.on(WS_EVENTS.EXECUTE_EVENT, ({ payload }) => {
        paymentExecuteCallback(payload);
      });
    }

    return () => {
      socket?.off(WS_EVENTS.EXECUTE_EVENT, ({ payload }) =>
        paymentExecuteCallback(payload),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, paymentId]);

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
