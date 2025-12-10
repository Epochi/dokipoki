source "https://rubygems.org"

ruby RUBY_VERSION

# Čia valdai, kokia Jekyll versija naudojama
gem "jekyll", "4.3.1"

# Default tema
gem "minima", "~> 2.5.1"

# BŪTINA Ruby 3.x + Jekyll kombinacijai (kad veiktų jekyll serve)
gem "webrick"
gem "rexml"
gem "csv"
gem "base64"
gem "bigdecimal"

# Jei kada nors norėsi naudoti GitHub Pages gemą:
# gem "github-pages", group: :jekyll_plugins

# Jekyll pluginai
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.16.0"
  gem "jekyll-sitemap", "~> 1.4.0"
end

# Windows neturi timezone failų – būtina ant Windows
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]
