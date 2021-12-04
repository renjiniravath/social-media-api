import Joi from 'joi'

//newPostSchema for validating "posts" post request object
export const newPostSchema = Joi.object({
    title: Joi.string().required(),
    username: Joi.string()
        .min(3)
        .max(30)
        .alphanum()
        .required(),
    content: Joi.string().required(),
    media: Joi.object({
        file: Joi.string(),
        type: Joi.any().allow('image/gif', 'image/jpeg', 'image/png'),
    }),
})

//commentSchema for validating "comment" post request object
export const commentSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .alphanum()
        .required(),
    comment: Joi.string().required(),
})

//voteSchema for validating "vote" post request object
export const voteSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .alphanum()
        .required(),
    vote: Joi.number()
        .min(-1)
        .max(1),
})
