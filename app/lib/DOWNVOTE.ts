declare const DOWNVOTE: KVNamespace;
import { createLocalStorage } from "./LocalKVS";

const _DOWNVOTE = typeof DOWNVOTE !== "undefined" ? DOWNVOTE : createLocalStorage();
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
export const getDownVotes = async (): Promise<DownVote> => {
    const res = await _DOWNVOTE.get("DOWNVOTE", {
        type: "json"
    });
    if (res) {
        return res as DownVote;
    }
    return {};
};
export const createId = (req: KVRequest) => `${req.type}::${req.id}`;
export const downVote = async (req: KVRequest) => {
    const prevVotes = await getDownVotes();
    const key = createId(req);
    const newVotes: DownVote = {
        ...prevVotes,
        [key]: {
            unixTimeStamp: Date.now()
        }
    };
    return _DOWNVOTE.put("DOWNVOTE", JSON.stringify(newVotes));
};
