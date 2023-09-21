require('dotenv').config();
const mongoose = require('mongoose');
const { Post } = require('../dist/models/Post');
const { Comment } = require('../dist/models/Comment');
const { User } = require('../dist/models/User');

module.exports = async () => {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING);

        const author = createTestAuthor();

        const [postA, postB] = await createTestPosts();

        const [comment_postA_readerA, comment_postB_readerA, comment_postB_readerB] =
            await createTestComments();

        const [readerA, readerB] = createTestReaders();

        await Promise.all([
            author.save(),
            postA.save(),
            postB.save(),
            comment_postA_readerA.save(),
            comment_postB_readerA.save(),
            comment_postB_readerB.save(),
            readerA.save(),
            readerB.save(),
        ]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

function createTestAuthor() {
    return new User({
        _id: '65068c32be2fd5ade9800662',
        name: 'Mao',
        username: 'Maomao',
        password: 'Maomao',
        isAuthor: true,
    });
}

async function createTestPosts() {
    const postA = new Post({
        _id: '65068b879df45e6e50921c78',
        author: '65068c32be2fd5ade9800662',
        title: 'Earliest post test',
        timestamp: new Date(),
        category: 'html',
        text: ['postA1', 'postA2'],
        isPublished: false,
    });

    // To prevent same-millisecond timestamps being generated
    await new Promise((resolve) => setTimeout(resolve, 5));

    const postB = new Post({
        _id: '650694ce8d33ac7cc559e27e',
        author: '65068c32be2fd5ade9800662',
        title: 'Latest post test',
        timestamp: new Date(),
        category: 'javascript',
        text: ['postB1', 'postB2'],
        isPublished: true,
    });

    return [postA, postB];
}

async function createTestComments() {
    const comment_postA_readerA = new Comment({
        _id: '650884f8d099ae8404f13ffc',
        post: '65068b879df45e6e50921c78',
        commenter: '650884f8d099ae8404f13ffb',
        timestamp: new Date(),
        text: ['AA1', 'AA2'],
    });

    // To prevent same-millisecond timestamps being generated
    await new Promise((resolve) => setTimeout(resolve, 5));

    const comment_postB_readerA = new Comment({
        _id: '650884f8d099ae8404f13ffd',
        post: '650694ce8d33ac7cc559e27e',
        commenter: '650884f8d099ae8404f13ffb',
        timestamp: new Date(),
        text: ['BA1', 'BA2'],
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    const comment_postB_readerB = new Comment({
        _id: '650884f8d099ae8404f13ffe',
        post: '650694ce8d33ac7cc559e27e',
        commenter: '65089c3cd099ae8404f14052',
        timestamp: new Date(),
        text: ['BB1', 'BB2'],
    });

    return [comment_postA_readerA, comment_postB_readerA, comment_postB_readerB];
}

function createTestReaders() {
    const readerA = new User({
        _id: '650884f8d099ae8404f13ffb',
        username: 'A',
        password: 'A',
        isAuthor: false,
    });

    const readerB = new User({
        _id: '65089c3cd099ae8404f14052',
        username: 'B',
        password: 'B',
        isAuthor: false,
    });

    return [readerA, readerB];
}
