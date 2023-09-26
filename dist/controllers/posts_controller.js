"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDangerousScriptTags = exports.deletePost = exports.toggleFeaturedPublished = exports.editPost = exports.postNewPost = exports.getSpecificPost = exports.getAllPosts = exports.DOES_NOT_EXIST = exports.INVALID_QUERY = exports.INVALID_ID = void 0;
const express_validator_1 = require("express-validator");
const Post_1 = require("../models/Post");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const auth_controller_1 = require("./auth_controller");
exports.INVALID_ID = { message: 'Failed to fetch - invalid ID format' };
exports.INVALID_QUERY = { message: 'Failed to fetch - invalid query' };
exports.DOES_NOT_EXIST = { message: 'Failed to fetch - no resource with that ID' };
/*
    - GET
*/
exports.getAllPosts = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Show unpublished posts only if viewing from CMS site
    const filter = auth_controller_1.cmsOrigins.includes(req.headers.origin) ? {} : { isPublished: true };
    // Show newest posts first
    const posts = yield Post_1.Post.find(filter)
        .populate('author', '-_id name username')
        .sort({ timestamp: -1 })
        .exec();
    res.json(posts);
}));
// GET INDIVIDUAL POST
exports.getSpecificPost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(exports.INVALID_ID);
        return;
    }
    if (!req.headers.origin) {
        res.status(401).json(auth_controller_1.UNAUTHORIZED);
        return;
    }
    const post = yield Post_1.Post.findById(req.params.postID).populate('author', 'name -_id').exec();
    if (post) {
        // Prevent showing unpublished posts on main client
        if (!post.isPublished && !auth_controller_1.cmsOrigins.includes(req.headers.origin)) {
            res.status(403).json(auth_controller_1.UNAUTHORIZED);
        }
        else {
            res.json(post);
        }
    }
    else {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
}));
/*
    - POST
*/
exports.postNewPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('image', 'Image URL must be a valid URL format').optional({ values: 'falsy' }).isURL(),
    (0, express_validator_1.body)('objectfit', `Image object-fit must be one of: ${Post_1.objectFits.join(', ')}`)
        .optional()
        .isIn(Post_1.objectFits),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(removeDangerousScriptTags)
        .escape(),
    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    (0, express_validator_1.body)('publish')
        .optional({ values: undefined })
        .custom((value) => !!value),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(401).json({
                errors: errors.array(),
            });
        }
        else {
            // Only authorised authors will reach this point
            const author = yield User_1.User.findOne({
                username: req.username,
            }).exec();
            // Very unlikely safeguard
            if (!author) {
                res.status(404).json({ message: 'Author does not exist ' });
                return;
            }
            const post = new Post_1.Post({
                author: new mongoose_1.Types.ObjectId(author._id),
                title: req.body.title,
                imageURL: req.body.image || undefined,
                objectFit: req.body.objectfit || 'object-contain',
                timestamp: new Date(),
                category: req.body.category,
                text: req.body.text,
                commentCount: 0,
                isPublished: !!req.body.publish,
                isFeatured: false,
            });
            yield post.save();
            // So CMS can redirect straight to new post individual page and
            // already have the author name to show
            yield post.populate('author', 'name -_id');
            res.status(201).json(post);
        }
    })),
];
/*
    - PUT
*/
exports.editPost = [
    (0, express_validator_1.body)('title', 'Title must not be empty').trim().notEmpty().escape(),
    (0, express_validator_1.body)('image', 'Image URL must be a valid URL format').optional({ values: 'falsy' }).isURL(),
    (0, express_validator_1.body)('objectfit', `Image object-fit must be one of: ${Post_1.objectFits.join(', ')}`)
        .optional()
        .isIn(Post_1.objectFits),
    (0, express_validator_1.body)('category', 'Category must be one of the listed options').isIn(Post_1.categories),
    (0, express_validator_1.body)('text', 'Article cannot be empty')
        .trim()
        .notEmpty()
        .customSanitizer(removeDangerousScriptTags)
        .escape(),
    /* If not checked, field will not be submitted (undefined) - checking submits a truthy string */
    (0, express_validator_1.body)('publish')
        .optional({ values: undefined })
        .custom((value) => !!value),
    (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
            res.status(400).json(exports.INVALID_ID);
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array(),
            });
        }
        else {
            const existingPost = yield Post_1.Post.findById(req.params.postID).exec();
            if (!existingPost) {
                res.status(404).json(exports.DOES_NOT_EXIST);
            }
            else {
                // Only create and store a new post if no errors
                const editedPost = yield Post_1.Post.findByIdAndUpdate(req.params.postID, new Post_1.Post({
                    _id: existingPost._id,
                    author: existingPost.author,
                    title: req.body.title,
                    imageURL: req.body.image || existingPost.imageURL,
                    objectFit: req.body.objectfit || existingPost.objectFit,
                    timestamp: existingPost.timestamp,
                    category: req.body.category,
                    text: req.body.text,
                    commentCount: existingPost.commentCount,
                    isPublished: !!req.body.publish,
                    isFeatured: existingPost.isFeatured,
                }), {
                    new: true,
                }).populate('author', 'name -_id');
                res.json(editedPost);
            }
        }
    })),
];
/*
    - PATCH
*/
exports.toggleFeaturedPublished = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(exports.INVALID_ID);
        return;
    }
    const [editedPost, existingFeaturedPosts] = req.query.publish
        ? yield togglePublish(req)
        : yield toggleFeature(req);
    if (!editedPost) {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
    else {
        res.json({ editedPost, existingFeaturedPosts });
    }
}));
const togglePublish = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const editedPost = yield Post_1.Post.findByIdAndUpdate(req.params.postID, { isPublished: req.query.publish === 'true' }, { new: true })
        .populate('author', 'name -_id')
        .exec();
    if (editedPost) {
        return [editedPost, null];
    }
    else {
        return [null, null];
    }
});
const toggleFeature = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const [editedPost, existingFeaturedPosts] = yield Promise.all([
        Post_1.Post.findByIdAndUpdate(req.params.postID, { isFeatured: req.query.feature === 'true' }, { new: true })
            .populate('author', 'name -_id')
            .exec(),
        Post_1.Post.find({ _id: { $ne: req.params.postID }, isFeatured: true }).exec(),
    ]);
    if (!editedPost) {
        return [null, null];
    }
    else if (req.query.feature === 'true') {
        return [editedPost, existingFeaturedPosts];
    }
    else {
        return [editedPost, null];
    }
});
/*
    - DELETE
*/
exports.deletePost = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(req.params.postID)) {
        res.status(400).json(exports.INVALID_ID);
        return;
    }
    const deletedPost = yield Post_1.Post.findByIdAndDelete(req.params.postID).exec();
    if (!deletedPost) {
        res.status(404).json(exports.DOES_NOT_EXIST);
    }
    else {
        res.status(204).json(deletedPost);
    }
}));
function removeDangerousScriptTags(text) {
    return text.replaceAll(/(<script>)|(<\/script>)|(?<=<script>)(.|\[^.])*(?=<\/script>)/g, '\n');
}
exports.removeDangerousScriptTags = removeDangerousScriptTags;
