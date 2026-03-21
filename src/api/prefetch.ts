import { QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "./client";
import { query } from "./query";

const languages = ["en", "fr", "es", "cn", "jp", "ar", "ko"];

export async function prefetch(client?: QueryClient) {
    client = client || getQueryClient();
    await Promise.all(languages.map(async (code: string) => await client.prefetchQuery(query.language(code))));
}
