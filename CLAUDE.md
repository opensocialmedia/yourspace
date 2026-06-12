# Application Overview

This app is designed to look just like a social media feed (similar to X/twitter or early Facebook) but for my personal website domain. It acts as a blog where I can post and anyone can come view my feed just by visiting the site.

The crucial thing about this app, is that the repo will be open sourced. Anyone should be able to clone this repo, easily input their own info, and quickly launch on cloudflare. 

# Comments

as this will be an open source repo where people just change a few variables and upload to cloudflare, use the generic persona "Venya Sneekers" for the build and add clear comments and corresponding directions in the README of where people should replace variables

# Features and main page elements

## Top of page
- Profile Picture
- Header Photo
- Name under Profile Photo
- Bio
- Places under bio to place as many links as I want
- Follower/Subscriber Count

## Main content

- Posts
    - Types of post templates:
        - Text posts
        - Image posts
        - Video posts
        - Shared link/outside source preview posts
    - Post features
        - Comments (any subscriber/follower can leave a comment on a post)
        - Like AND dislike buttons
        - Share button (when people share a post, the link should go right to the post and have a preview of the post/site in whatever format they're sharing it)

At the top of the main feed/posts section, have a tab selector where they can view All Posts, Videos, Photos, or Media (shared links/outside projects)

## Layout and notes

Layout is similar to X. Top of page content is always visible at the top and all posts are displayed chronilogically below, just like X. Posts all stay hidden unless someone follows/subscribe. Clicking the Follow button brings up a capture email box and once they share their email they can view anything on the page.

They can like dislike or share anything on the page, or share anything. They can also leave comments on any post and when commenting they are randomly assigned a username mixed of random words and numbers from a word bank. They can also choose their own username while leaving a comment.

Email capture form should verify email is legit by a formatting check, and making sure the address is deliverable.

Subscription flow uses double opt-in email confirmation:
1. User submits email → saved as `pending` subscriber in D1 with a random token
2. Confirmation email sent via Resend with a link containing the token
3. User clicks link → token validated, subscriber flipped to `confirmed`
4. Only `confirmed` subscribers can view posts

Confirmation emails are built with React Email (custom branded templates matching the site aesthetic) and rendered server-side before being passed to Resend.

# Admin page

There also needs to be a completely secure and password protected admin page accessible at <server>/admin, which is basically a CRUD app for me where i can create, read, edit, and delete any prior posts or comments or update any of the profile fields (picture, links, header, bio, etc.)

The admin page also includes an email list management section:
- View all subscribers (confirmed and pending)
- See signup dates
- Delete or unsubscribe individual emails
- Export subscriber list as CSV

# TECH STACK

- Framework: Next.js (with `@cloudflare/next-on-pages` adapter for edge runtime)
- Hosting: Cloudflare Pages + Workers
- Database: Cloudflare D1 (SQLite) — stores posts, comments, subscribers, bio, profile data, etc.
- Object storage: Cloudflare R2 — stores photos, videos, etc.
- Email: Resend — transactional email (subscription confirmations, etc.)
- Email templates: React Email — custom branded templates built as React components
- Human authentication - should have human authentication on subscribing to prevent bots


# Architecture

src/
  lib/                       # All the "brain" of the app — no UI here
    domain/                  # Pure business rules ("a post must have a title", "emails must be valid")
    validation/              # The shapes/rules that incoming data must match before we trust it
    repositories/            # The only place that talks to the database or file storage
    services/                # Connects the dots — calls repositories and domain functions to get things done
    config/                  # Reads environment variables and makes them available safely
    errors/                  # Defines what an error looks like so every part of the app speaks the same language
    constants/               # Any hardcoded value (max file size, word bank, etc.) lives here, named and explained

  app/
    api/                     # The locked door — every request from the browser must go through here
      posts/                 # Endpoints for creating, reading, updating, deleting posts
      comments/              # Endpoints for comments
      subscribers/           # Endpoints for email capture, confirmation, and follow logic
      admin/                 # Admin-only endpoints, extra auth required
    (public)/                # The pages anyone can see (or the gate page before they follow)
    admin/                   # The admin UI — password protected

  emails/                    # React Email templates (confirmation email, etc.)

  components/                # Everything you see on screen — no logic, just display
  hooks/                     # How the UI asks the API for data — one hook per concern
  types/                     # TypeScript definitions shared across the whole app


