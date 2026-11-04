Windows:
	run locally
		bundle exec jekyll serve
Windows WSM
	run locally
		bundle exec jekyll serve --force_polling --livereload

Instagram feed sync:
	add GitHub secret `INSTAGRAM_ACCESS_TOKEN`
	add GitHub secret `INSTAGRAM_USER_ID`: the Instagram professional account ID (not the Facebook Page, business or system user ID)
	the workflow uses Facebook Graph API v25.0 with a Meta Business system user token generated with expiration set to Never
	the token needs `instagram_basic`, `pages_read_engagement` and `pages_show_list`; assign the linked Page and Instagram account to the system user
	Meta can still revoke the token if permissions or account access change
	for local runs, also set `INSTAGRAM_API_BASE=https://graph.facebook.com/v25.0` (the script otherwise defaults to Instagram Login)
	run the `Instagram Feed Sync` workflow once after setup, or wait for the scheduled sync
	the workflow writes the last-known feed manifest to `_data/instagram_feed.json`
	the workflow caches gallery posters in `img/instagram-cache`
	video files are not cached locally; only their preview posters are cached
