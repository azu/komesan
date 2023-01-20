import { ActionArgs, redirect } from "@remix-run/cloudflare";
import { z } from "zod";
import { createStorage } from "../lib/DOWNVOTE";

const formDataToJSON = (data: FormData) => {
    return Object.fromEntries(data.entries());
};

/**
 * fetch("/DOWNVOTE", {
 *     method: "post",
 *     headers: {
 *         "x-komesan-token": "YOUR_TOKEN",
 *         "Content-Type": "application/x-www-form-urlencoded",
 *     },
 *     body: JSON.stringify({ type: "hatebu", users: ["a","b","c"] })
 * });
 * @param request
 */
export async function action({ request, context }: ActionArgs) {
    const token = request.headers.get("x-komesan-token");
    if (token !== context.KOMESAN_TOKEN) {
        console.warn("Invalid token", token);
        return redirect(`/`);
    }
    const body = await request.text();
    const { type, users } = z
        .object({
            type: z.literal("hatenabookmark").or(z.literal("twitter")),
            users: z.array(z.string())
        })
        .parse(JSON.parse(body));

    // @ts-expect-error: no types
    const downvoteStorage = await createStorage(context);
    const requests = users.map((user) => {
        return {
            id: user,
            type: type
        };
    });
    await downvoteStorage.downVotes(requests);
    console.log("DOWNVOTEs ", requests.length);
    return redirect(`/`);
}

export default function Downvote() {
    return <p>Downvote API</p>;
}
