import { Contract } from '@ethersproject/contracts';
import { ethers } from 'ethers';
import {
  useContractWrite as useContractWriteWagmi,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import {
  UseContractWriteConfig,
  UseContractWriteMutationArgs,
} from 'wagmi/dist/declarations/src/hooks/contracts/useContractWrite';
import { UsePrepareContractWriteArgs } from 'wagmi/dist/declarations/src/hooks/contracts/usePrepareContractWrite';
import { UseWaitForTransactionArgs } from 'wagmi/dist/declarations/src/hooks/transactions/useWaitForTransaction';

import {
  ContractFactory,
  ContractFunctions,
  ContractInstance,
  MessageCallback,
} from './types';
import { useContext } from 'react';
import { LFGContext } from './LFGProvider';
import useAddress from './useAddress';

function useContractWrite<
  T extends ContractInstance = Contract,
  TFunctionName extends string & keyof ContractFunctions<T> = string
>(
  typechainFactory: ContractFactory<T>,
  method: TFunctionName,
  options?: Omit<
    UseContractWriteConfig,
    'addressOrName' | 'functionName' | 'contractInterface' | 'args'
  > & {
    args?: Parameters<ContractFunctions<T>[TFunctionName]>;
    enabled?: boolean;
    address?: string;
    reckless?: boolean;
    usePrepareContractWriteOptions?: UsePrepareContractWriteArgs;
    useContractWriteOptions?: UseContractWriteMutationArgs;
    useWaitForTransactionOptions?: UseWaitForTransactionArgs;
    onSuccess?: (result: ethers.providers.TransactionReceipt) => void;
    onError?: (error: Error) => void;
    onErrorMessage?: string | MessageCallback;
    onSuccessMessage?: string | MessageCallback;
  }
): {
  isLoading: boolean;
  waitForTxResult: ReturnType<typeof useWaitForTransaction>;
  writeResult: ReturnType<typeof useContractWriteWagmi>;
  write: (config?: {
    args?: Parameters<ContractFunctions<T>[TFunctionName]>;
    overrides?: ethers.CallOverrides;
  }) => Promise<void>;
} {
  const { notice } = useContext(LFGContext);
  const predefinedAddress = useAddress<T>(typechainFactory);
  const args = options?.args || [];
  const address = options?.address || predefinedAddress;
  const enabled = (options?.enabled ?? true) && Boolean(address);
  const usePrepareContractWriteOptions =
    options?.usePrepareContractWriteOptions || {};

  const _onError = (err: Error) => {
    if (options?.onError && err) {
      options.onError(err);
    }

    if (options?.onErrorMessage && notice) {
      notice({
        status: 'error',
        message:
          typeof options.onErrorMessage === 'string'
            ? options.onErrorMessage
            : options.onErrorMessage(err),
      });
    }
  };
  const { config } = usePrepareContractWrite({
    addressOrName: address,
    contractInterface: typechainFactory.abi,
    functionName: method as string,
    args,
    enabled,
    ...usePrepareContractWriteOptions,
  });

  const useContractWriteOptions = options?.useContractWriteOptions || {};
  const writeResult = useContractWriteWagmi({
    ...useContractWriteOptions,
    ...config,
    mode: options?.reckless ? 'recklesslyUnprepared' : 'prepared',
    request: config.request as any,
    onError: _onError,
  });

  const useWaitForTransactionOptions =
    options?.useWaitForTransactionOptions || {};

  const waitForTxResult = useWaitForTransaction({
    hash: writeResult?.data?.hash,
    onError: _onError,
    onSuccess: data => {
      if (options?.onSuccess && data) {
        options.onSuccess(data);
      }

      if (notice && options?.onSuccessMessage) {
        notice({
          status: 'success',
          message:
            typeof options?.onSuccessMessage === 'string'
              ? options?.onSuccessMessage
              : options?.onSuccessMessage(data),
        });
      }
    },
    ...useWaitForTransactionOptions,
  });

  const _write = async (config?: {
    args?: Parameters<ContractFunctions<T>[TFunctionName]>;
    overrides?: ethers.CallOverrides;
  }) => {
    if (!writeResult.write) {
      return;
    }
    const args = config?.args || [];
    const writeOptions: UseContractWriteMutationArgs = {};

    if (args.length > 0) {
      writeOptions.recklesslySetUnpreparedArgs = args;
    }
    if (config?.overrides) {
      writeOptions.recklesslySetUnpreparedOverrides = config.overrides;
    }
    await writeResult.write(writeOptions);
  };

  return {
    waitForTxResult,
    writeResult,
    write: _write,
    isLoading: Boolean(waitForTxResult?.isLoading || writeResult?.isLoading),
  };
}

export default useContractWrite;
