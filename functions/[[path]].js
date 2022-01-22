import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";

// @ts-ignore
import * as build from "../build";

const handleRequest = createPagesFunctionHandler({
    build,
    getLoadContext({ env }) {
        return env; // https://github.com/remix-run/remix/issues/1186
    }
});

export function onRequest(context) {
    return handleRequest(context);
}
