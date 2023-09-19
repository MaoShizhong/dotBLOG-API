import { Router } from 'express';
import * as postsController from '../controllers/posts_controller';
import * as commentsController from '../controllers/comments_controller';

export const router = Router();

/*
    - Handle posts
*/
router.get('/posts/', postsController.getAllPosts);

router.get('/posts/:postID', postsController.getSpecificPost);

router.post('/posts/', postsController.postNewPost);

router.put('/posts/:postID', postsController.editPost);

// For setting an unpublished post to published only
router.patch('/posts/:postID', postsController.publishPost);

router.delete('/posts/:postID', postsController.deletePost);

/*
    - Handle comments
*/
router.get('/posts/:postID/comments', commentsController.getAllComments);

router.get('/readers/:readerID/comments', commentsController.getAllComments);

router.post('/posts/:postID/comments', commentsController.postNewComment);

router.get('/comments/:commentID', commentsController.getSpecificComment);

router.put('/comments/:commentID', commentsController.editComment);

router.delete('/comments/:commentID', commentsController.deleteComment);

/*
    - Handle readers
*/
