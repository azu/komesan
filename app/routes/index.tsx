import { LoaderFunction, useLoaderData } from "remix";
import { fetchTwitter, Tweets } from "~/lib/Twitter";
import { BookmarkSite, fetchHatenaBookmark } from "~/lib/Bookmark";

export let loader: LoaderFunction = async ({ context, request }) => {
    const url = new URL(request.url);
    const urlParam = url.searchParams.get("url");
    if (!urlParam) {
        return {
            twitter: [],
            hatebu: undefined
        };
    }
    const TWITTER_TOKEN = context.TWITTER_TOKEN as string;
    const [twitter, hatebu] = await Promise.all([
        fetchTwitter(urlParam, {
            TWITTER_TOKEN
        }),
        fetchHatenaBookmark(urlParam)
    ]);
    return {
        twitter,
        hatebu
    };
};
export default function Index() {
    const { twitter, hatebu } = useLoaderData<{ twitter: Tweets; hatebu: BookmarkSite | undefined }>();
    return (
        <div>
            <h2>はてなブックマーク</h2>
            <ul>
                {hatebu?.bookmarks.map((bookmark) => {
                    return (
                        <li key={bookmark.user + bookmark.comment}>
                            {bookmark.user}: {bookmark.comment}
                        </li>
                    );
                })}
            </ul>
            <h2>Twitter</h2>
            <ul>
                {twitter?.map((bookmark) => {
                    return <li key={bookmark.id}>{bookmark.text}</li>;
                })}
            </ul>
        </div>
    );
}
