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

{% if site.posts.size > 0 %}
<div class="blog-list">
  {% for post in site.posts %}
  {% assign post_lang = post.lang | default: 'en' %}
  {% if post_lang == 'zh' %}
    {% include blog-card.html post=post %}
  {% endif %}
  {% endfor %}
</div>
{% else %}
暂无文章。
{% endif %}
