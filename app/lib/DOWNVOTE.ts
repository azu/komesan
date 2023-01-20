export type DownvoteRequest = {
    id: string;
    type: "hatenabookmark" | "twitter";
};
export type DownVote = {
    // { `${type}::${username}`: {} }`
    [typeId: string]: {
        unixTimeStamp: number;
    };
};
export const createId = (req: DownvoteRequest) => `${req.type}::${req.id}`;
export const createStorage = (env: { DOWNVOTE: KVNamespace }) => {
    const getDownVotes = async (): Promise<DownVote> => {
        try {
            const res = await env.DOWNVOTE.get("DOWNVOTE", {
                type: "json"
            });
            if (res) {
                return res as DownVote;
            }
            return {};
        } catch (e) {
            return {};
        }
    };
    const downVote = async (req: DownvoteRequest) => {
        const prevVotes = await getDownVotes();
        const key = createId(req);
        const newVotes: DownVote = {
            ...prevVotes,
            [key]: {
                unixTimeStamp: Date.now()
            }
        };
        return env.DOWNVOTE.put("DOWNVOTE", JSON.stringify(newVotes));
    };

    const downVotes = async (requests: DownvoteRequest[]) => {
        const prevVotes = await getDownVotes();
        const newVotes: DownVote = requests.reduce((acc, req) => {
            const key = createId(req);
            return {
                ...acc,
                [key]: {
                    unixTimeStamp: Date.now()
                }
            };
        }, prevVotes);
        return env.DOWNVOTE.put("DOWNVOTE", JSON.stringify(newVotes));
    };

    return { getDownVotes, downVote, downVotes };
};
