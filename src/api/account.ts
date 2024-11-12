import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { query } from './query';

export function GetBalance(rpc?: string, address?: string) {
    return useQuery(query.onchain.balance(rpc, address));
}
