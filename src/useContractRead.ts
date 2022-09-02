import { Contract } from '@ethersproject/contracts';
import { useContext, useEffect, useState } from 'react';
import { useContractRead as useContractReadWagmi } from 'wagmi';
import { UseContractReadConfig } from 'wagmi/dist/declarations/src/hooks/contracts/useContractRead';

import {
  _Awaited,
  ContractFactory,
  ContractFunctions,
  ContractInstance,
  MessageCallback,
  QueryResult,
} from './types';
import { LFGContext } from './LFGProvider';
import useAddress from './useAddress';

export function useContractRead<
  T extends ContractInstance = Contract,
  TFunctionName extends string & keyof ContractFunctions<T> = string
>(
  typechainFactory: ContractFactory<T>,
  method: TFunctionName,
  options?: Omit<
    UseContractReadConfig,
    'addressOrName' | 'functionName' | 'contractInterface' | 'args'
  > & {
    args?: Parameters<ContractFunctions<T>[TFunctionName]>;
    enabled?: boolean;
    address?: string;
    onErrorMessage?: string | MessageCallback;
    watch?: boolean;
  }
): QueryResult<_Awaited<ReturnType<ContractFunctions<T>[TFunctionName]>>> {
  const { notice } = useContext(LFGContext);
  const predefinedAddress = useAddress(typechainFactory);
  const args = options?.args || [];
  const address = options?.address || predefinedAddress;
  const enabled = (options?.enabled ?? true) && Boolean(address);
  const watch = options?.watch ?? true;
  //https://github.com/wagmi-dev/wagmi/issues/542#issuecomment-1144178142
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const result = useContractReadWagmi({
    ...options,
    addressOrName: address,
    functionName: method,
    contractInterface: typechainFactory.abi,
    args,
    enabled,
    watch,
    onError: err => {
      if (options?.onErrorMessage && notice) {
        notice({
          status: 'error',
          message:
            typeof options.onErrorMessage === 'string'
              ? options.onErrorMessage
              : options.onErrorMessage(err),
        });
      }
    },
  });

  return {
    ...result,
    // @ts-ignore
    data: isMounted ? result.data : undefined, //https://github.com/wagmi-dev/wagmi/issues/542#issuecomment-1144178142
  };
}

export default useContractRead;
