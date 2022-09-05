import * as React from 'react';
import { createContext, PropsWithChildren } from 'react';

type Props = {
  resolveAddress: (contractName: string, chainId: number) => string;
  fallbackChain: number;
  notice?: (options: { status: string; message: string }) => void;
};

type IContext = Props;

export const LFGContext = createContext<IContext>({
  resolveAddress: () => '',
  fallbackChain: 1,
});

const LFGProvider = ({ children, ...props }: PropsWithChildren<Props>) => (
  <LFGContext.Provider value={props}>{children}</LFGContext.Provider>
);

export default LFGProvider;
