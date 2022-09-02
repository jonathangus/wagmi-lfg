import { useContext } from 'react';
import { Contract } from '@ethersproject/contracts';
import { LFGContext } from './LFGProvider';
import { ContractFactory, ContractInstance } from './types';
import { useNetwork } from 'wagmi';

function useAddress<T extends ContractInstance = Contract>(
  factory: ContractFactory<T>
): string {
  const { resolveAddress, fallbackChain } = useContext(LFGContext);
  const { chain: activeChain } = useNetwork();

  let currentChainId = fallbackChain;
  if (
    typeof activeChain?.unsupported === 'boolean' &&
    !activeChain.unsupported
  ) {
    currentChainId = activeChain.id;
  }

  return resolveAddress(new (factory as any)().contractName, currentChainId);
}

export default useAddress;
