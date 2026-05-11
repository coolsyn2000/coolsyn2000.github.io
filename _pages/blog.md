---
layout: blog
permalink: /blog/
title: "Blog"
excerpt: "Notes and essays."
author_profile: false
lang: en
---

# Blog

<nav class="blog-lang-switch" aria-label="Language switch">
  <span>English</span>
  <a href="{{ '/blog/zh/' | relative_url }}">中文</a>
</nav>

{% assign blog_posts = site.blog_en | sort: "date" | reverse %}
{% if blog_posts.size > 0 %}
<div class="blog-list">
  {% for post in blog_posts %}
  {% include blog-card.html post=post %}
  {% endfor %}
</div>
{% else %}
No posts yet.
{% endif %}
