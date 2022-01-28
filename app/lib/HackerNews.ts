import { createId, DownVote } from "./DOWNVOTE";
import { decode } from "he";

export interface HackerNewsSeachResult {
    hits: Hit[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
    exhaustiveNbHits: boolean;
    exhaustiveTypo: boolean;
    query: string;
    params: string;
    processingTimeMS: number;
}

export interface Hit {
    created_at: Date;
    title: null | string;
    url: null | string;
    author: string;
    points: number | null;
    story_text: null;
    comment_text: null | string;
    num_comments: number | null;
    story_id: number | null;
    story_title: null | string;
    story_url: null | string;
    parent_id: number | null;
    created_at_i: number;
    _tags: string[];
    objectID: string;
    _highlightResult: HighlightResult;
}

export interface HighlightResult {
    author: Author;
    comment_text?: Author;
    story_title?: Author;
    story_url?: Author;
    title?: Author;
    url?: Author;
}

export interface Author {
    value: string;
    matchLevel: MatchLevel;
    matchedWords: MatchedWord[];
    fullyHighlighted?: boolean;
}

export enum MatchLevel {
    Full = "full",
    None = "none"
}

export enum MatchedWord {
    COM = "com",
    Cloudflare = "cloudflare",
    Empty = ".",
    HTTPS = "https",
    Pages = "pages"
}

// retult
export type HackerNewsStory = {
    title: string;
    url: string;
    comments: HackerNewsComment[];
};
export type HackerNewsComment = {
    author: string;
    commentUrl: string;
    text: string;
};
export type HackerNewsResult =
    | {
          count: number; // total hit
          url: string; // https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=%22https%3A%2F%2Fpages.cloudflare.com%22&sort=byPopularity&type=all
          stories: HackerNewsStory[];
      }
    | undefined;

const createStories = (result: HackerNewsSeachResult): HackerNewsStory[] => {
    const stories: HackerNewsStory[] = [];
    const isStory = (hit: Hit): hit is Hit & { title: string; url: string } => {
        return hit.title !== null && hit.url !== null;
    };
    const isComment = (hit: Hit): hit is Hit & { comment_text: string; story_id: string; story_title: string } => {
        return hit.comment_text !== null && hit.story_id !== null && hit.story_title !== null && hit.author !== null;
    };
    const createStoryUrl = (id: string) => {
        return `https://news.ycombinator.com/item?id=${id}`;
    };
    for (const hit of result.hits) {
        if (isStory(hit)) {
            stories.push({
                title: hit.title,
                url: createStoryUrl(hit.objectID),
                comments: []
            });
        } else if (isComment(hit)) {
            const storyUrl = createStoryUrl(hit.story_id);
            const matchedStory = stories.find((s) => s.url === storyUrl);
            if (matchedStory) {
                matchedStory.comments.push({
                    author: hit.author,
                    commentUrl: createStoryUrl(hit.objectID),
                    text: decode(hit.comment_text)
                });
            } else {
                stories.push({
                    title: hit.story_title,
                    url: storyUrl,
                    comments: [
                        {
                            author: hit.author,
                            commentUrl: createStoryUrl(hit.objectID),
                            text: decode(hit.comment_text)
                        }
                    ]
                });
            }
        }
    }
    return stories;
};
export const fetchHackerNews = (url: string, { downVotes }: { downVotes: DownVote }): Promise<HackerNewsResult> => {
    const query = encodeURIComponent(`"${url}"`);
    return fetch(`http://hn.algolia.com/api/v1/search_by_date?query=${query}`, {
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
            const result = json as HackerNewsSeachResult;
            return {
                count: result.nbHits,
                stories: createStories(result),
                url: `https://hn.algolia.com/?dateRange=all&page=0&prefix=false&query=${query}&sort=byDate&type=all`
            };
        });
};
