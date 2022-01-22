export type Tweets = Tweet[];
export type Tweet = {
    id: string;
    text: string;
    created_at: string;
    profile_image_url: string;
    name: string;
};

export const fetchTwitter = (url: string, { TWITTER_TOKEN }: { TWITTER_TOKEN: string }) => {
    const query = new URLSearchParams([
        ["query", "url:" + url.replace(/^https?:\/\//, "")],
        ["tweet.fields", "text,created_at"],
        ["user.fields", "profile_image_url,name,id"]
    ]).toString();
    return fetch("https://api.twitter.com/2/tweets/search/recent?" + query, {
        headers: {
            Authorization: `Bearer ${TWITTER_TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((json) => {
            return (json as any).data;
        });
};
