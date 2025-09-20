import { TULI_BASE_URL } from '../../../../constants/urls';
import axios from 'axios';
import { PaymentStatus } from '../TuliFlowView.types';

interface NewCodeResponse {
  code: string;
  paymentId: string;
  validity: number;
  paymentStatus: PaymentStatus;
}

// eslint-disable-next-line import/prefer-default-export
export const getCode = async (address: string) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  try {
    const res = await axios.post<NewCodeResponse>(
      `${TULI_BASE_URL}/v1/generator/newCode`,
      {address},
      { 
        withCredentials: true, 
        headers 
      }
    );
    if(res.status !== 200) {
      console.log('Error occurred while generating code:', res);
      throw new Error(`Failed to generate code, status code: ${res.status}`);
    }
    return res.data;
  } catch (error: any) {
    console.log('Error occurred while generating code:', error);
    console.error(error);
    throw new Error(error.message as string);
  }
};
