import { queryOptions, useQuery } from '@tanstack/react-query';
import { URLS } from 'api';

export function GetLanguage(code?: string) {
    return useQuery(
        queryOptions({
            queryKey: ['language', code],
            queryFn: async () => {
                const response = await fetch(
                    `${URLS.PROXY.LANGUAGE}/${code || 'en'}`,
                    { next: { tags: [code || 'en'], revalidate: 3600 } },
                );
                if (response.ok) return response.json();
            },
            staleTime: 86400 * 1000,
        }));
}
