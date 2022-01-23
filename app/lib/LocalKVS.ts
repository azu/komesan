export const createLocalStorage = <V>(): KVNamespace => {
    const map = new Map();
    return {
        /**
         * Returns the value associated to the key.
         * If the key does not exist, returns `undefined`.
         */
        get: async (key: string, options?: Partial<KVNamespaceGetOptions<undefined>>): Promise<V | undefined> => {
            const value = map.get(key);
            if (options?.type === "json" && value) {
                return JSON.parse(value);
            }
            return value;
        },
        /**
         * Sets the value for the key in the storage. Returns the storage.
         */
        put: async (key: string, value: V): Promise<void> => {
            await map.set(String(key), value);
            return;
        },
        /**
         * Returns a boolean asserting whether a value has been associated to the key in the storage.
         */
        has: async (key: string): Promise<boolean> => {
            const value = await map.get(String(key));
            return value !== null;
        },
        list: async ({
            prefix,
            limit
        }: {
            prefix: string;
            limit: number;
        }): Promise<{
            keys: { name: string; expiration?: number; metadata?: unknown }[];
            list_complete: boolean;
            cursor: string;
        }> => {
            const out: { name: string; expiration?: number; metadata?: unknown }[] = [];
            for await (const [key] of map) {
                if (key.startsWith(prefix) && out.length < limit)
                    out.push({
                        name: key
                    });
            }
            return {
                keys: out,
                list_complete: true,
                cursor: ""
            };
        }
    } as any as KVNamespace;
};
