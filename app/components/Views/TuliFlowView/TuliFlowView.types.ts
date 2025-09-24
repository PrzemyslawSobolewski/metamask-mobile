export enum PaymentStatus {
  Unknown = 'unknown',
  Created = 'created',
  InProgress = 'inProgress',
  Settled = 'settled',
  Timeout = 'timeout',
}

export interface ExecutionInfo {
  payloads: OnChainPayload[];
  chainId: number;
  type: PaymentType;
}
export interface PaymentStatusResponse {
  paymentId: string;
  code: string;
  status: PaymentStatus;
  executionInfo: ExecutionInfo;
}

export enum PaymentType {
  Deposit = 'Deposit',
  Custom = 'Custom',
}

export interface OnChainPayload {
  data: string;
  value?: string;
  to: string;
  type?: string;
}
export interface ExecutePaymentResponse {
  paymentId: string;
  code: string;
  paymentType: PaymentType;
  executionInfo: ExecutionInfo;
  chainId: number;
}

export enum WS_EVENTS {
  EXECUTE_EVENT = 'ExecuteEvent',
  EXECUTION_EVENT_STATUS = 'ExecutionEventStatus',
}

export interface IJoinRoom {
  eventType: WS_EVENTS;
  paymentId: string;
  getLast?: boolean;
}

export interface IDemoNotify {
  paymentId: string;
  paymentStatus: PaymentStatus;
}
