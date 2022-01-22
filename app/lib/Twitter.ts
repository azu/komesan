export type Tweets = Tweet[];
export type Tweet = {
    id: string;
    text: string;
    created_at: string;
};

export const fetchTwitter = (url: string, { TWITTER_TOKEN }: { TWITTER_TOKEN: string }) => {
    const query = new URLSearchParams([
        ["query", "test"],
        ["tweet.fields", "text,created_at"]
    ]).toString();
    console.log(query);
    return fetch("https://api.twitter.com/2/tweets/search/recent?" + query, {
        headers: {
            Authorization: `Bearer ${TWITTER_TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((json) => {
            console.log("json", json);
            return (json as any).data;
        });
};
