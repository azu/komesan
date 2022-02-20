import {
    ActionFunction,
    Form,
    HeadersFunction,
    Link,
    LoaderFunction,
    redirect,
    useActionData,
    useLoaderData,
    useTransition
} from "remix";
import { fetchTwitter, Tweets } from "../lib/Twitter";
import { BookmarkSite, fetchHatenaBookmark } from "../lib/Bookmark";
import { LinkItUrl } from "react-linkify-it";
import { ChangeEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createStorage } from "../lib/DOWNVOTE";
import styles from "../styles/simple.css";
import { fetchHackerNews, HackerNewsResult } from "../lib/HackerNews";

export function links() {
    return [{ rel: "stylesheet", href: styles }];
}

export const headers: HeadersFunction = () => {
    return {
        "Cache-Control": "max-age=0, s-maxage=30, stale-while-revalidate=30"
    };
};

export let loader: LoaderFunction = async ({ context, request, params }) => {
    const url = new URL(request.url);
    const urlParam = url.searchParams.get("url");
    const enableMinMode = url.searchParams.has("min");
    const services = url.searchParams.getAll("service");
    const enableServices = {
        hatebu: true, // enable by default
        twitter: true,
        hackerNews: services.includes("hackerNews") ?? false
    };
    const isUrl = urlParam?.startsWith("http") || urlParam?.startsWith("https");
    if (!urlParam || !isUrl) {
        return {
            url: "",
            min: enableMinMode,
            twitter: [],
            hatebu: undefined,
            hackerNews: undefined
        };
    }
    const TWITTER_TOKEN = context.TWITTER_TOKEN as string;
    const storage = createStorage(context);
    const downVotes = await storage.getDownVotes();
    const startTime = Date.now();
    const [hatebu, twitter, hackerNews] = await Promise.all([
        enableServices.hatebu
            ? fetchHatenaBookmark(urlParam, {
                  downVotes
              })
                  .catch((error) => {
                      console.error("fetchHatenaBookmark", error);
                      return [];
                  })
                  .finally(() => {
                      console.log(`HatenaBookMark: ${Date.now() - startTime}ms`);
                  })
            : undefined,
        enableServices.twitter
            ? fetchTwitter(urlParam, {
                  downVotes,
                  TWITTER_TOKEN
              })
                  .catch((error) => {
                      console.error("fetchTwitter", error);
                      return;
                  })
                  .finally(() => {
                      console.log(`Twitter: ${Date.now() - startTime}ms`);
                  })
            : [],
        enableServices.hackerNews
            ? fetchHackerNews(urlParam, {
                  downVotes
              })
                  .catch((error) => {
                      console.error("fetchTwitter", error);
                      return;
                  })
                  .finally(() => {
                      console.log(`HackerNews: ${Date.now() - startTime}ms`);
                  })
            : undefined
    ]);
    return {
        url: /^https?:/.test(urlParam) ? urlParam : "",
        min: enableMinMode,
        twitter,
        hatebu,
        hackerNews
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
        id: formData.get("id"),
        min: formData.has("min")
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
    const param = new URLSearchParams([["url", form.url as string]].concat(form.min ? [["min", "1"]] : []));
    return redirect("/?" + param);
};
const DownVote = ({
    type,
    url,
    id,
    min
}: {
    type: "hatenabookmark" | "twitter";
    url: string;
    id: string;
    min: boolean;
}) => {
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
                    <input name="min" checked={min} type="hidden" readOnly={true} />
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
export type IndexProps = {
    // enable min mode
    min?: boolean;
};
export default function Index(props: IndexProps) {
    const { twitter, hatebu, hackerNews, url, min } = useLoaderData<{
        twitter: Tweets;
        hatebu: BookmarkSite;
        hackerNews: HackerNewsResult;
        url: string;
        min: boolean;
    }>();
    const [{ inputUrl, showController, noResult }, { onChange, onToggleShowController }] = useIndex({ url });
    return (
        <div className={min ? "min" : ""}>
            <style>{`
[hidden] {
    display: none !important;
}
/* min mode */
.min h2 {
    font-size: 14px;
    font-weight: bold;
    margin: 1em 0;
}
.min {
    font-size: 14px;
}
/* normal */
.list-item {
    padding: 0.5em 0;
    border-bottom: 1px solid #ddd;
}
.list-item a {
    word-break: break-all;
}
.list-item pre {
    padding: 1rem 0;
    max-width: 100%;
    overflow: auto;
    overflow-x: auto;
    color: var(--preformatted);
    background: var(--accent-bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding-left: 0;
}
`}</style>
            <h1 hidden={min}>
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
                hidden={min}
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
            <div hidden={!noResult}>
                <p>
                    Example:{" "}
                    <Link to={"/?url=https://pages.cloudflare.com"}>
                        https://komesan.pages.dev/?url=https://pages.cloudflare.com/
                    </Link>
                </p>
            </div>
            <div hidden={noResult}>
                <h2>
                    <a
                        href={`https://b.hatena.ne.jp/entry/s/${trimSchema(url)}`}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                    >
                        はてなブックマーク({hatebu?.bookmarks?.length ?? 0}/{hatebu?.count ?? 0})
                    </a>
                </h2>
                <ul style={{ listStyle: "none", padding: "0" }}>
                    {hatebu?.bookmarks?.map((bookmark) => {
                        return (
                            <li key={bookmark.user + bookmark.comment} className={"list-item"} tabIndex={-1}>
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
                                <a
                                    href={`https://b.hatena.ne.jp/${bookmark.user}/`}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    {bookmark.user}
                                </a>
                                : <LinkItUrl>{bookmark.comment}</LinkItUrl>
                                <div hidden={!showController}>
                                    <DownVote type={"hatenabookmark"} id={bookmark.user} url={url} min={min} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div hidden={noResult}>
                <h2>
                    <a
                        href={`https://twitter.com/search?f=live&q=${url}`}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                    >
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
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
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
                                    <DownVote type={"twitter"} id={tweet.username} url={url} min={min} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div hidden={noResult || !hackerNews}>
                <h2>
                    <a href={hackerNews?.url} target={"_blank"} rel={"noopener noreferrer"}>
                        HackerNews
                    </a>
                </h2>
                <ul style={{ listStyle: "none", padding: "0" }}>
                    {hackerNews?.stories?.map((story) => {
                        return (
                            <li key={story.url} className={"list-item"} tabIndex={-1}>
                                <a
                                    href={story.url}
                                    style={{
                                        paddingRight: "4px"
                                    }}
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                >
                                    {story.title}
                                </a>
                                {story.comments.map((comment, index) => {
                                    return (
                                        <div>
                                            <a
                                                href={comment.commentUrl}
                                                style={{ color: "#828282" }}
                                                target={"_blank"}
                                                rel={"noopener noreferrer"}
                                            >
                                                {comment.author}
                                            </a>
                                            :
                                            <div
                                                key={comment.commentUrl}
                                                dangerouslySetInnerHTML={{
                                                    __html: comment.text
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <p hidden={!min}>
                <a href={url} target={"_blank"} rel={"noopener noreferrer"}>
                    🔗 WebSite
                </a>
            </p>
            <footer>
                <p>Komesanは指定したURLのはてなブックマークとTwitterのコメントを表示するサイトです。</p>
                <p>
                    Bookmarklet:{" "}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: `<a href='javascript:void(window.open("https://komesan.pages.dev/?url="+encodeURIComponent(location.href)))'>Komesan</a>`
                        }}
                    />
                </p>
                <p>
                    <a href={"https://github.com/sponsors/azu"} target={"_blank"} rel={"noopener noreferrer"}>
                        ❤️GitHub Sponsors️
                    </a>
                    でサイトを支援できます
                </p>
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
