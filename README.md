# Social Media API

This API is used by the Social Media Application to add/list posts, vote and comment posts. The router used is [`itty-router`](https://github.com/kwhitley/itty-router). Data is stored in [`KV`](https://developers.cloudflare.com/workers/runtime-apis/kv), a key-value database provided by [`Cloudflare`](https://developers.cloudflare.com/). Refer [`Workers documentation`](https://developers.cloudflare.com/workers/) to get an idea of how workers work.

The APIs accepts data in JSON.

## Setting Up

You have to set up a file named `wrangler.toml` in the root of your file to start the API. It should contain keys as listed below.

```toml
name = "social-media-api"
type = "webpack"

account_id = "***YOUR_ACCOUNT_ID"
workers_dev = true
route = ""
zone_id = ""
compatibility_date = "**compatibility_date**"
kv_namespaces = [
    { binding = "POSTS_KV", preview_id = "**kv_preview_id**", id = "**kv_id**" }
]

[env.production]
kv_namespaces = [
    { binding = "POSTS_KV", id = "**kv_id_for_production**"}
]
```

## Endpoints

### General Error Response

```json
{
    "status": 404,
    "error": "Post not found"
}
```

### `GET /posts`

#### Success Response Body

```json
[
    {
        "id": "Slash-1637743242549",
        "title": "Post Title",
        "username": "Slash",
        "content": "Post description",
        "comments": [
            {
                "id": "Slash-1637743258827",
                "text": "Inspirational post!",
                "username": "Slash"
            }
        ],
        "votes": {
            "count": 1,
            "map": {
                "Slash": 1
            }
        },
        "media": {}
    }
]
```

### `POST /posts`

#### Request Body

```json
{
    "title": "My first post",
    "content": "Post content",
    "username": "Slash"
}
```

#### Success Response Body

```json
{
    "status": 200,
    "message": "Success"
}
```

### `POST /posts/:id/comment`

#### Request Body

```json
{
    "username": "Slash",
    "comment": "Great post!!"
}
```

#### Success Response Body

```json
{
    "status": 200,
    "message": "Success"
}
```

### `POST /posts/:id/vote`

#### Request Body

```json
{
    "username": "Slash",
    "vote": 1
}
```

#### Success Response Body

```json
{
    "status": 200,
    "message": "Success"
}
```

## Running Development

Run the below command to start your development server.

`wrangler dev`

The API will be server in `http://127.0.0.1:8787`

## Deploying Production

Run the below command to start your development server.

`wrangler publish --env production`
