import { Router } from 'itty-router'
import { json, error, status } from 'itty-router-extras'
import ErrorWithCode from './error'
import { newPostSchema, commentSchema, voteSchema, mediaSchema } from './schema'
import Joi from 'joi'
import { sortByVotes } from './utils'
import { wrapCorsHeader, handleCors } from './corshelper'

// Create a new router
const router = Router()

router.options('*', handleCors({ methods: '*', maxAge: 86400 }))
/*
Returns an array of posts
*/
router.get('/posts', async () => {
    try {
        let posts = await POSTS_KV.get('posts', { type: 'json' })
        if (!posts) {
            posts = {}
        }
        return wrapCorsHeader(
            json(Object.values(posts).sort(sortByVotes), {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        )
    } catch (exception) {
        console.log(`An error has occured ${exception.message}`)
        return wrapCorsHeader(error(500, 'Internal server error'))
    }
})

/*
Adds a post to `posts` key in kv
*/
router.post('/posts', async request => {
    try {
        const input = await request.json()
        const validatedInput = await newPostSchema.validateAsync(input)
        const newPostId = `${validatedInput.username}-${Date.now()}`
        const newPost = {
            id: newPostId,
            title: validatedInput.title,
            username: validatedInput.username,
            content: validatedInput.content,
            comments: [],
            votes: {
                count: 0,
                map: {},
            },
            media: validatedInput.media || {},
        }
        let posts = await POSTS_KV.get('posts', { type: 'json' })
        if (!posts) {
            posts = {}
        }
        posts[newPostId] = newPost
        await POSTS_KV.put('posts', JSON.stringify(posts))
        return wrapCorsHeader(status(200, 'Success'))
    } catch (exception) {
        if (Joi.isError(exception)) {
            console.log(`A validation error has occured - ${exception.message}`)
            return wrapCorsHeader(
                error(
                    400,
                    `A validation error has occured - ${exception.message.replaceAll(
                        '"',
                        ''
                    )}`
                )
            )
        }
        console.log(`An error has occured ${exception.message}`)
        return wrapCorsHeader(
            error(
                exception.code || 500,
                exception.code ? exception.message : 'Internal server error'
            )
        )
    }
})

/*
Adds a comment to a post
*/
router.post('/posts/:id/comment', async request => {
    try {
        let postId = decodeURIComponent(request.params.id)
        const input = await request.json()
        const validatedInput = await commentSchema.validateAsync(input)
        const postsString = await POSTS_KV.get('posts')
        let posts = JSON.parse(postsString)
        if (!posts || !posts[postId]) {
            throw new ErrorWithCode('Post not found', 404)
        }
        let comments = posts[postId].comments
        const newCommentId = `${validatedInput.username}-${Date.now()}`
        comments.push({
            id: newCommentId,
            text: validatedInput.comment,
            username: validatedInput.username,
        })
        posts[postId] = {
            ...posts[postId],
            comments,
        }
        await POSTS_KV.put('posts', JSON.stringify(posts))
        return wrapCorsHeader(status(200, 'Success'))
    } catch (exception) {
        if (Joi.isError(exception)) {
            console.log(`A validation error has occured - ${exception.message}`)
            return wrapCorsHeader(
                error(
                    400,
                    `A validation error has occured - ${exception.message.replaceAll(
                        '"',
                        ''
                    )}`
                )
            )
        }
        console.log(`An error has occured ${exception.message}`)
        return wrapCorsHeader(
            error(
                exception.code || 500,
                exception.code ? exception.message : 'Internal server error'
            )
        )
    }
})

/*
Stores the vote that a user casts on a post
*/
router.post('/posts/:id/vote', async request => {
    try {
        let postId = decodeURIComponent(request.params.id)
        const input = await request.json()
        const validatedInput = await voteSchema.validateAsync(input)
        const postsString = await POSTS_KV.get('posts')
        let posts = JSON.parse(postsString)
        if (!posts || !posts[postId]) {
            throw new ErrorWithCode('Post not found', 404)
        }
        let votes = posts[postId].votes
        const newVote = validatedInput.vote
        const username = validatedInput.username
        const currentVote = votes.map[username] || 0
        votes.count += newVote - currentVote
        votes.map[username] = newVote
        posts[postId] = {
            ...posts[postId],
            votes,
        }
        await POSTS_KV.put('posts', JSON.stringify(posts))
        return wrapCorsHeader(status(200, 'Success'))
    } catch (exception) {
        if (Joi.isError(exception)) {
            console.log(`A validation error has occured - ${exception.message}`)
            return wrapCorsHeader(
                error(
                    400,
                    `A validation error has occured - ${exception.message.replaceAll(
                        '"',
                        ''
                    )}`
                )
            )
        }
        console.log(`An error has occured ${exception.message}`)
        return wrapCorsHeader(
            error(
                exception.code || 500,
                exception.code ? exception.message : 'Internal server error'
            )
        )
    }
})

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all('*', () => wrapCorsHeader(error(404, 'Endpoint not found')))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', e => {
    e.respondWith(router.handle(e.request))
})
