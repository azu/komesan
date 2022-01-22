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
