---
layout: blog
permalink: /blog/zh/
title: "博客"
excerpt: "中文笔记与文章。"
author_profile: false
lang: zh
---

# 博客

<nav class="blog-lang-switch" aria-label="Language switch">
  <a href="{{ '/blog/' | relative_url }}">English</a>
  <span>中文</span>
</nav>

{% assign blog_posts = site.blog_zh | sort: "date" | reverse %}
{% if blog_posts.size > 0 %}
<div class="blog-list">
  {% for post in blog_posts %}
  {% include blog-card.html post=post %}
  {% endfor %}
</div>
{% else %}
暂无文章。
{% endif %}
