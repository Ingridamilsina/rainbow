import { NonceManager } from '../../entities';
import { getGlobal, saveGlobal } from './common';

export const NONCE_MANAGER = 'nonceManager';

export const getNonceManager = async (): Promise<NonceManager> => {
  const nonceManager = await getGlobal(NONCE_MANAGER, {});

  return nonceManager;
};

export const saveNonceManager = (nonceManager: NonceManager) =>
  saveGlobal(NONCE_MANAGER, nonceManager);