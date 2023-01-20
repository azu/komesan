# komesan

View comments about the site.

Supported Web Services:

- はてなブックマーク
- Twitter
- HackerNews
    - `&service=hackerNews`
## Usage

1. Visit https://komesan.pages.dev/
2. Input URL to view comments

```
https://komesan.pages.dev/?url=<encoded url>
```

## Tips

### min mode

Minimal display mode. It is useful to embed to webpage by userscript.

:warning: site owner should not use this feature.

```
https://komesan.pages.dev/?url=<encoded url>&min
```

### Add services

Add Hacker News

```
https://komesan.pages.dev/?url=<encoded url>&service=hackerNews
```

## Develop

Create `.dev.vars` file.

    TWITTER_TOKEN=<Twitter API v2 Bearer Token>

For mor details, please see <https://developer.twitter.com/>

Run develop mode.

    yarn install
    yarn dev

    # Open http://localhost:8080?url=https://example.com

## Deployment

Cloudflare Pages + [Remix](https://remix.run/).

See [Deploy a Remix site · Cloudflare Pages docs](https://developers.cloudflare.com/pages/framework-guides/remix)

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
