# komesan

View comments about the site.

Supported Web Services:

- はてなブックマーク
- Twitter
- HackerNews
    - `&services=hackerNews`
## Usage

1. Visit https://komesan.pages.dev/
2. Input URL to view comments

```
https://komesan.pages.dev/?url=<encoded url>
```

## Tips

### min mode

minimal display mode. It is useful to embed to webpage;

```
https://komesan.pages.dev/?url=<encoded url>&min
```

### Add services

Add Hacker News

```
https://komesan.pages.dev/?url=<encoded url>&services=hackerNews
```

## Develop

    yarn install
    yarn dev

    # Open http://localhost:8080?url=https://example.com

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
