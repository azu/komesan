import { LoaderFunction, useLoaderData } from "remix";
import { BookmarkSite } from "~/routes/Bookmark";

const fetchHatenaBookmark = (_url: string) => {
    return fetch("https://b.hatena.ne.jp/entry/json/http://www.hatena.ne.jp/").then((res) => res.json());
};
const fetchTwitter = (_url: string) => {
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
export let loader: LoaderFunction = () => {
    return fetchTwitter("");
};
export default function Index() {
    const products = useLoaderData();
    console.log("products", products);
    return (
        <div>
            <ul>
                {products.map((bookmark: any) => {
                    return <li>{bookmark.text}</li>;
                })}
            </ul>
        </div>
    );
}
