---
permalink: /blog/
title: "Blog"
excerpt: "Notes and essays."
author_profile: true
---

# Blog

{% if site.posts.size > 0 %}
<div class="blog-list">
  {% for post in site.posts %}
  <article class="blog-list__item">
    <h2 class="archive__item-title">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h2>
    <p class="page__meta">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %-d, %Y" }}</time>
      {% if post.tags and post.tags.size > 0 %}
      <span class="blog-post__tags">
        {% for tag in post.tags %}
        <span>{{ tag }}</span>
        {% endfor %}
      </span>
      {% endif %}
    </p>
    {% if post.excerpt %}
    <div class="archive__item-excerpt">
      {{ post.excerpt | strip_html | truncatewords: 40 }}
    </div>
    {% endif %}
  </article>
  {% endfor %}
</div>
{% else %}
No posts yet.
{% endif %}
