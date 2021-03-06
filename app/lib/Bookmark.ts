import { createId, DownVote } from "./DOWNVOTE";

export type BookmarkSite = {
    screenshot: string;
    bookmarks: Bookmark[]; // comment only
    requested_url: string;
    url: string;
    related: Related[];
    eid: string;
    title: string;
    count: number;
    entry_url: string;
} | null;

export interface Bookmark {
    user: string;
    tags: string[];
    timestamp: string;
    comment: string;
}

export interface Related {
    entry_url: string;
    count: number;
    eid: string;
    title: string;
}

export const fetchHatenaBookmark = (url: string, { downVotes }: { downVotes: DownVote }): Promise<BookmarkSite> => {
    return fetch(`https://b.hatena.ne.jp/entry/json/?url=${url}`, {
        headers: {
            "User-Agent": "komesan.pages.dev"
        }
    })
        .then((res) => {
            if (!res.ok) {
                return Promise.reject(new Error("response error"));
            }
            return res.json();
        })
        .then((json) => {
            const result = json as BookmarkSite;
            if (!result) {
                return null;
            }
            return {
                ...result,
                bookmarks: result?.bookmarks
                    ?.filter((bookmark) => bookmark.comment.trim().length > 0)
                    ?.filter((bookmark) => {
                        const key = createId({
                            id: bookmark.user,
                            type: "hatenabookmark"
                        });
                        return !Object.prototype.hasOwnProperty.call(downVotes, key);
                    })
            };
        });
};
