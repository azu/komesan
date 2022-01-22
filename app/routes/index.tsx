import { LoaderFunction, useLoaderData } from "remix";
import { fetchTwitter, Tweets } from "~/lib/Twitter";
import { BookmarkSite, fetchHatenaBookmark } from "~/lib/Bookmark";
import { LinkItUrl } from "react-linkify-it";

export let loader: LoaderFunction = async ({ context, request }) => {
    const url = new URL(request.url);
    const urlParam = url.searchParams.get("url");
    if (!urlParam) {
        return {
            url: "",
            twitter: [],
            hatebu: undefined
        };
    }
    const TWITTER_TOKEN = context.TWITTER_TOKEN as string;
    const [hatebu, twitter] = await Promise.all([
        fetchHatenaBookmark(urlParam),
        fetchTwitter(urlParam, {
            TWITTER_TOKEN
        })
    ]);
    return {
        url: /^https?:/.test(urlParam) ? urlParam : "",
        twitter,
        hatebu
    };
};
export default function Index() {
    const { twitter, hatebu, url } =
        useLoaderData<{ twitter: Tweets; hatebu: BookmarkSite | undefined; url: string }>();
    console.log({ twitter, hatebu, url });
    return (
        <div>
            <h1>Komesan</h1>
            <p>
                <a href={url}>{url}</a>
            </p>
            <h2>
                はてなブックマーク({hatebu?.bookmarks.length}/{hatebu?.count})
            </h2>
            <ul style={{ listStyle: "none" }}>
                {hatebu?.bookmarks.map((bookmark) => {
                    return (
                        <li key={bookmark.user + bookmark.comment}>
                            <img
                                width="16"
                                height="16"
                                src={`https://cdn.profile-image.st-hatena.com/users/${bookmark.user}/profile.png`}
                                alt={""}
                                loading={"lazy"}
                                style={{
                                    paddingRight: "2px"
                                }}
                            />
                            <span
                                style={{
                                    color: "#4B4B4B"
                                }}
                            >
                                {bookmark.user}
                            </span>
                            : <LinkItUrl>{bookmark.comment}</LinkItUrl>
                        </li>
                    );
                })}
            </ul>
            <h2>Twitter</h2>
            <ul style={{ listStyle: "none" }}>
                {twitter?.data?.map((tweet) => {
                    return (
                        <li key={tweet.id}>
                            <LinkItUrl>{tweet.text}</LinkItUrl>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
