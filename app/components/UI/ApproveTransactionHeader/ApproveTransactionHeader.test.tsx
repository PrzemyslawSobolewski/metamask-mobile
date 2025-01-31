import React from 'react';

import renderWithProvider from '../../../util/test/renderWithProvider';
import ApproveTransactionHeader from './';
import initialBackgroundState from '../../../util/test/initial-background-state.json';
import { APPROVE_TRANSACTION_ORIGIN_PILL } from './ApproveTransactionHeader.constants';

jest.mock('../../../core/Engine', () => ({
  context: {
    TokensController: {
      addToken: () => undefined,
    },
  },
}));

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  renderAccountName: () => 'ABC',
}));

const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...initialBackgroundState,
      AccountTrackerController: {
        accounts: {
          '0x0': {
            balance: '200',
          },
          '0x1': {
            balance: '200',
          },
        },
      },
      PreferencesController: {
        selectedAddress: '0x0',
        identities: {
          '0x0': {
            address: '0x0',
            name: 'Account 1',
          },
          '0x1': {
            address: '0x1',
            name: 'Account 2',
          },
        },
      },
      NetworkController: {
        providerConfig: {
          chainId: '0xaa36a7',
          type: 'sepolia',
          nickname: 'Sepolia',
        },
      },
    },
  },
};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest
    .fn()
    .mockImplementation((callback) => callback(mockInitialState)),
}));

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  renderAccountName: jest.fn(),
}));

describe('ApproveTransactionHeader', () => {
  it('should render correctly', () => {
    const wrapper = renderWithProvider(
      <ApproveTransactionHeader
        from="0x0"
        origin="http://metamask.github.io"
        url="http://metamask.github.io"
        asset={{ address: '0x0', symbol: 'ERC', decimals: 4 }}
      />,
      { state: mockInitialState },
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should render with domain title', () => {
    const { getByText } = renderWithProvider(
      <ApproveTransactionHeader
        from="0x0"
        origin="http://metamask.github.io"
        url="http://metamask.github.io"
        asset={{ address: '0x0', symbol: 'ERC', decimals: 4 }}
      />,
      { state: mockInitialState },
    );
    expect(getByText('http://metamask.github.io')).toBeDefined();
  });

  it('should get origin when present', () => {
    const { getByText } = renderWithProvider(
      <ApproveTransactionHeader
        from="0x0"
        origin="http://metamask.github.io"
        url="http://metamask.github.io"
        asset={{
          address: '0x0',
          symbol: 'RAN',
          decimals: 18,
        }}
      />,
      { state: mockInitialState },
    );
    expect(getByText('http://metamask.github.io')).toBeDefined();
  });

  it('should return origin to be null when not present', () => {
    const container = renderWithProvider(
      <ApproveTransactionHeader
        from="0x0"
        origin={undefined}
        url="http://metamask.github.io"
        asset={{
          address: '0x0',
          symbol: 'RAN',
          decimals: 18,
        }}
      />,
      { state: mockInitialState },
    );
    expect(container).toMatchSnapshot();
  });

  it('should not show an origin pill if origin is deeplink', () => {
    const { queryByTestId } = renderWithProvider(
      <ApproveTransactionHeader
        from="0x0"
        origin="qr-code"
        url="http://metamask.github.io"
        asset={{
          address: '0x0',
          symbol: 'RAN',
          decimals: 18,
        }}
      />,
      { state: mockInitialState },
    );

    const originPill = queryByTestId(APPROVE_TRANSACTION_ORIGIN_PILL);
    expect(originPill).toBeNull();
  });
});
