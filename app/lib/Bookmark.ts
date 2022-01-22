export interface BookmarkSite {
    screenshot: string;
    bookmarks: Bookmark[];
    requested_url: string;
    url: string;
    related: Related[];
    eid: string;
    title: string;
    count: number;
    entry_url: string;
}

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

export const fetchHatenaBookmark = (url: string): Promise<BookmarkSite> => {
    return fetch(`https://b.hatena.ne.jp/entry/json/?url=${encodeURIComponent(url)}`).then((res) => {
        if (!res.ok) {
            return Promise.reject(new Error("response error"));
        }
        return res.json();
    });
};
