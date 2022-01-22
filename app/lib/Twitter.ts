export type Tweet = {
    id: string;
    text: string;
    created_at: string;
};

export const fetchTwitter = (_url: string) => {
    const query = new URLSearchParams([
        ["query", "nyc"],
        ["tweet.fields", "text,created_at"]
    ]).toString();
    console.log(query);
    return fetch("https://api.twitter.com/2/tweets/search/recent?" + query, {
        headers: {
            Authorization: `Bearer ${process.env.TWITTER_TOKEN}`
        }
    })
        .then((res) => res.json())
        .then((json) => {
            return (json as any).data;
        });
};
