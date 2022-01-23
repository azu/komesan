export type KVRequest = {
    id: string;
    type: string;
};
export type DownVote = {
    // { `${type}::${username}`: {} }`
    [typeId: string]: {
        unixTimeStamp: number;
    };
};
export const createId = (req: KVRequest) => `${req.type}::${req.id}`;
export const createStorage = (env: { DOWNVOTE: KVNamespace }) => {
    const getDownVotes = async (): Promise<DownVote> => {
        const res = await env.DOWNVOTE.get("DOWNVOTE", {
            type: "json"
        });
        if (res) {
            return res as DownVote;
        }
        return {};
    };
    const downVote = async (req: KVRequest) => {
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

    return { getDownVotes, downVote };
};
