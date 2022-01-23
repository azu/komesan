import { LoaderFunction, useLoaderData } from "remix";
import { fetchTwitter, Tweets } from "~/lib/Twitter";
import { BookmarkSite, fetchHatenaBookmark } from "~/lib/Bookmark";
import { LinkItUrl } from "react-linkify-it";
import { ChangeEventHandler, useCallback, useState } from "react";

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
        fetchHatenaBookmark(urlParam).catch((error) => {
            console.error("fetchHatenaBookmark", error);
            return [];
        }),
        fetchTwitter(urlParam, {
            TWITTER_TOKEN
        }).catch((error) => {
            console.error("fetchTwitter", error);
            return;
        })
    ]);
    return {
        url: /^https?:/.test(urlParam) ? urlParam : "",
        twitter,
        hatebu
    };
};
export const useIndex = (props: { url: string }) => {
    const [inputUrl, setInputUrl] = useState<string>(props.url);
    const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        return setInputUrl(event.target.value ?? "");
    }, []);
    return [{ inputUrl }, { onChange }] as const;
};
const trimSchema = (url: string) => {
    return url.replace(/^https:\/\//, "");
};
export default function Index() {
    const { twitter, hatebu, url } =
        useLoaderData<{ twitter: Tweets; hatebu: BookmarkSite | undefined; url: string }>();
    const [{ inputUrl }, { onChange }] = useIndex({ url });
    return (
        <div>
            <style>{`
.list-item {
    padding: 0.5em 0;
    border-bottom: 1px solid #ddd;
}
.list-item a {
    word-break: break-all;
}`}</style>
            <h1>Komesan</h1>
            <form
                method="get"
                action="/"
                style={{
                    display: "flex",
                    alignItems: "flex-end"
                }}
            >
                <input
                    name="url"
                    value={inputUrl}
                    type="text"
                    onChange={onChange}
                    placeholder={"https://example.com"}
                    style={{ flex: 1 }}
                />
                <button type="submit">View</button>
            </form>
            <h2>
                <a href={`https://b.hatena.ne.jp/entry/s/${trimSchema(url)}`}>
                    はてなブックマーク({hatebu?.bookmarks.length ?? 0}/{hatebu?.count ?? 0})
                </a>
            </h2>
            <ul style={{ listStyle: "none", padding: "0" }}>
                {hatebu?.bookmarks?.map((bookmark) => {
                    return (
                        <li key={bookmark.user + bookmark.comment} className={"list-item"}>
                            <img
                                width="16"
                                height="16"
                                src={`https://cdn.profile-image.st-hatena.com/users/${bookmark.user}/profile.png`}
                                alt={""}
                                loading={"lazy"}
                                style={{
                                    paddingRight: "4px"
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
            <h2>
                <a href={`https://twitter.com/search?f=realtime&q=${url}`}>Twitter</a>
            </h2>
            <ul style={{ listStyle: "none", padding: "0" }}>
                {twitter?.map((tweet) => {
                    return (
                        <li key={tweet.id} className={"list-item"}>
                            <a
                                href={`https://twitter.com/${tweet.username}`}
                                style={{
                                    paddingRight: "4px"
                                }}
                            >
                                <img
                                    width="16"
                                    height="16"
                                    src={tweet.profile_image_url}
                                    alt={""}
                                    loading={"lazy"}
                                    style={{
                                        paddingRight: "4px"
                                    }}
                                />
                                {tweet.name}
                            </a>
                            <LinkItUrl>{tweet.text}</LinkItUrl>
                            <p style={{ margin: 0 }}>
                                <a
                                    href={`https://twitter.com/${tweet.username}/status/${tweet.id}`}
                                    style={{
                                        marginLeft: "4px"
                                    }}
                                    target={"_blank"}
                                >
                                    {new Date(tweet.created_at).toISOString()}
                                </a>
                            </p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
