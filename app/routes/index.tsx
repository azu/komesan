import { LoaderFunction, useLoaderData } from "remix";
import { BookmarkSite } from "~/routes/Bookmark";
import { fetchTwitter } from "~/routes/Twitter";

const fetchHatenaBookmark = (_url: string) => {
    return fetch("https://b.hatena.ne.jp/entry/json/http://www.hatena.ne.jp/").then((res) => res.json());
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
