import { Form, HeadersFunction, Link, LoaderFunction, useActionData, useLoaderData, useTransition } from "remix";
import { fetchTwitter, Tweets } from "../lib/Twitter";
import { ActionFunction, redirect } from "remix";
import { BookmarkSite, fetchHatenaBookmark } from "../lib/Bookmark";
import { LinkItUrl } from "react-linkify-it";
import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createStorage } from "../lib/DOWNVOTE";
import styles from "../styles/simple.css";

export function links() {
    return [{ rel: "stylesheet", href: styles }];
}

export const headers: HeadersFunction = () => {
    return {
        "Cache-Control": "max-age=0, s-maxage=30, stale-while-revalidate=30"
    };
};

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
    const storage = createStorage(context);
    const downVotes = await storage.getDownVotes();
    const [hatebu, twitter] = await Promise.all([
        fetchHatenaBookmark(urlParam, {
            downVotes
        }).catch((error) => {
            console.error("fetchHatenaBookmark", error);
            return [];
        }),
        fetchTwitter(urlParam, {
            downVotes,
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
type NullableFormValue<T> = {
    [P in keyof T]: T[P] | null | File;
};

type SubmitFormValue = { url: string; type: string; id: string };
export const validate = ({ url, type, id }: NullableFormValue<SubmitFormValue>) => {
    if (typeof url !== "string" || !/https?:\/\//.test(url)) {
        return [new Error("url should start with https://")];
    }
    if (typeof type !== "string" || !["twitter", "hatenabookmark"].includes(type)) {
        return [new Error("does not support type")];
    }
    if (typeof id !== "string") {
        return [new Error("does not support id")];
    }
};
// server
export const action: ActionFunction = async ({ request, context }) => {
    const formData = await request.formData();
    const form = {
        url: formData.get("url"),
        type: formData.get("type"),
        id: formData.get("id")
    };
    const errors = validate(form);
    if (errors) {
        return {
            errors: errors.map((e) => e.message).join(",")
        };
    }
    const storage = createStorage(context);
    await storage.downVote({
        type: form.type as string,
        id: form.id as string
    });
    const param = new URLSearchParams([["url", form.url as string]]);
    return redirect("/?" + param);
};
const DownVote = ({ type, url, id }: { type: "hatenabookmark" | "twitter"; url: string; id: string }) => {
    const actionData = useActionData();
    const inputRef = useRef<HTMLButtonElement>(null);
    const transition = useTransition();
    useEffect(() => {
        if (actionData && actionData?.errors) {
            inputRef?.current?.focus();
        }
    }, [actionData]);
    return (
        <>
            <Form method="post">
                <fieldset disabled={transition.state === "submitting"}>
                    <input type="hidden" value={id} name={"id"} />
                    <input type="hidden" value={type} name={"type"} />
                    <input type="hidden" value={url} name={"url"} />
                    <button type="submit" ref={inputRef}>
                        👎
                    </button>
                </fieldset>
            </Form>
            {actionData && actionData?.errors && <p style={{ color: "red" }}>{actionData?.errors}</p>}
        </>
    );
};

export const useIndex = (props: { url: string }) => {
    const [showController, setShowController] = useState(false);
    const [inputUrl, setInputUrl] = useState<string>(props.url);
    const noResult = useMemo(() => {
        return !props.url.startsWith("http");
    }, [props.url]);
    const onChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        return setInputUrl(event.target.value ?? "");
    }, []);
    const onToggleShowController = useCallback(() => {
        return setShowController((prevState) => !prevState);
    }, []);
    return [
        { inputUrl, showController, noResult },
        { onChange, onToggleShowController }
    ] as const;
};
const trimSchema = (url: string) => {
    return url.replace(/^https:\/\//, "");
};
export default function Index() {
    const { twitter, hatebu, url } =
        useLoaderData<{ twitter: Tweets; hatebu: BookmarkSite | undefined; url: string }>();
    const [{ inputUrl, showController, noResult }, { onChange, onToggleShowController }] = useIndex({ url });
    return (
        <div>
            <style>{`
.list-item {
    padding: 0.5em 0;
    border-bottom: 1px solid #ddd;
}
.list-item a {
    word-break: break-all;
}
`}</style>
            <h1>
                <Link to={"/"}>Komesan</Link>
            </h1>
            <div style={{ position: "fixed", top: 0, right: 0, opacity: 0 }}>
                <button onClick={onToggleShowController} style={{ margin: 0 }}>
                    💬
                </button>
            </div>
            <Form
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
            </Form>
            <div hidden={noResult}>
                <h2>
                    <a href={`https://b.hatena.ne.jp/entry/s/${trimSchema(url)}`} rel={"noopener noreferrer"}>
                        はてなブックマーク({hatebu?.bookmarks.length ?? 0}/{hatebu?.count ?? 0})
                    </a>
                </h2>
                <ul style={{ listStyle: "none", padding: "0" }}>
                    {hatebu?.bookmarks?.map((bookmark) => {
                        return (
                            <li key={bookmark.user + bookmark.comment} className={"list-item"} tabIndex={-1}>
                                <img
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
                                <div hidden={!showController}>
                                    <DownVote type={"hatenabookmark"} id={bookmark.user} url={url} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div hidden={noResult}>
                <h2>
                    <a href={`https://twitter.com/search?f=realtime&q=${url}`} rel={"noopener noreferrer"}>
                        Twitter
                    </a>
                </h2>
                <ul style={{ listStyle: "none", padding: "0" }}>
                    {twitter?.map((tweet) => {
                        return (
                            <li key={tweet.id} className={"list-item"} tabIndex={-1}>
                                <a
                                    href={`https://twitter.com/${tweet.username}`}
                                    style={{
                                        paddingRight: "4px"
                                    }}
                                    rel={"noopener noreferrer"}
                                >
                                    <img
                                        height="16"
                                        src={tweet.profile_image_url}
                                        alt={""}
                                        loading={"lazy"}
                                        style={{
                                            paddingRight: "4px"
                                        }}
                                    />
                                    {tweet.username}
                                </a>
                                <LinkItUrl>{tweet.text}</LinkItUrl>
                                <p style={{ margin: 0 }}>
                                    <a
                                        href={`https://twitter.com/${tweet.username}/status/${tweet.id}`}
                                        style={{
                                            marginLeft: "4px"
                                        }}
                                        target={"_blank"}
                                        rel={"noopener noreferrer"}
                                    >
                                        {new Date(tweet.created_at).toISOString()}
                                    </a>
                                </p>
                                <div hidden={!showController}>
                                    <DownVote type={"twitter"} id={tweet.username} url={url} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <footer>
                <p>指定したURLのはてなブックマークとTwitterのコメントを表示するサイトです。</p>
                <p>
                    <a href={"https://github.com/azu/komesan"} target={"_blank"} rel={"noopener noreferrer"}>
                        Source Code
                    </a>{" "}
                    ©️ azu
                </p>
            </footer>
        </div>
    );
}
