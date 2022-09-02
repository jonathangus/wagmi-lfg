import '@rainbow-me/rainbowkit/styles.css';
import * as React from 'react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Client, WagmiConfig } from 'wagmi';
import { createContext, PropsWithChildren } from 'react';
import { RainbowKitProviderProps } from '@rainbow-me/rainbowkit/dist/components/RainbowKitProvider/RainbowKitProvider';

type Props = {
  rainbowKit: RainbowKitProviderProps;
  wagmiClient: Client;
  resolveAddress: (contractName: string, chainId: number) => string;
  fallbackChain: number;
  notice?: (options: { status: string; message: string }) => void;
};

type IContext = Pick<Props, 'resolveAddress' | 'fallbackChain' | 'notice'>;

export const LFGContext = createContext<IContext>({
  resolveAddress: () => '',
  fallbackChain: 1,
});

const LFGProvider = ({
  children,
  rainbowKit,
  wagmiClient,
  notice,
  fallbackChain,
  resolveAddress,
}: PropsWithChildren<Props>) => {
  const value = {
    resolveAddress,
    notice,
    fallbackChain,
  };

  return (
    // @ts-ignore
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider {...rainbowKit}>
        <LFGContext.Provider value={value}>{children}</LFGContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default LFGProvider;
