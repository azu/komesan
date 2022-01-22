export type Tweets = {
    data: Tweet[];
};
export type Tweet = {
    author_id: string;
    id: string;
    text: string;
    name: string;
    username: string; // id
    created_at: string;
    profile_image_url: string;
};

interface SearchResponse {
    data: Datum[];
    includes: Includes;
    meta: Meta;
}

interface Datum {
    author_id: string;
    id: string;
    text: string;
}

interface Includes {
    users: User[];
}

interface User {
    id: string;
    name: string;
    profile_image_url: string;
    created_at: Date;
    username: string;
    description: string;
}

interface Meta {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token: string;
}

export const fetchTwitter = (url: string, { TWITTER_TOKEN }: { TWITTER_TOKEN: string }) => {
    const query = new URLSearchParams([
        ["query", "url:" + url.replace(/^https?:\/\//, "")],
        ["tweet.fields", "text,created_at"],
        ["user.fields", "profile_image_url,created_at,description,id,name"],
        ["expansions", "author_id"] // relation
    ]).toString();
    return fetch("https://api.twitter.com/2/tweets/search/recent?" + query, {
        headers: {
            Authorization: `Bearer ${TWITTER_TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((json) => {
            const res = json as SearchResponse;
            return res.data.map((tweet) => {
                const user = res.includes.users.find((user) => user.id === tweet.author_id);
                if (!user) {
                    throw new Error("Not found user");
                }
                return {
                    ...tweet,
                    name: user.name,
                    username: user.username,
                    profile_image_url: user.profile_image_url
                } as Tweet;
            });
        });
};
