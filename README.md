Windows:
	run locally
		bundle exec jekyll serve
Windows WSM
	run locally
		bundle exec jekyll serve --force_polling --livereload

Instagram feed sync:
	add GitHub secret `INSTAGRAM_ACCESS_TOKEN`
	optionally add GitHub secret `INSTAGRAM_USER_ID`
	run the `Instagram Feed Sync` workflow once after setup, or wait for the scheduled sync
	the workflow writes the last-known feed manifest to `_data/instagram_feed.json`
	the workflow caches gallery posters in `img/instagram-cache`
	video files are not cached locally; only their preview posters are cached
