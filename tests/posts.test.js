// Connect to MongoDB
require('dotenv').config();

const mongoose = require('mongoose');
const main = async () => await mongoose.connect(process.env.CONNECTION_STRING);
main().catch((err) => console.error(err));

const { Post } = require('../dist/models/Post');

describe.skip('Test POST route for "/posts" endpoint', () => {
    // - Test POST route
    async function submitNewPost(post) {
        const formData = new FormData();

        for (const field in post) {
            formData.append(field, post[field]);
        }

        try {
            const res = await fetch('http://localhost:5000/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData),
            });

            return await res.json();
        } catch (err) {
            return err;
        }
    }

    const formWithEmptyTitle = {
        title: '',
        timestamp: new Date(),
        category: 'html',
        text: ['test', 'test2'],
        isPublished: 'no',
    };

    const formWithInvalidCategory = {
        title: 'Test title',
        timestamp: new Date(),
        category: 'htmls',
        text: ['test', 'test2'],
        isPublished: 'no',
    };

    const validForm = {
        title: 'Test title',
        timestamp: new Date(),
        category: 'html',
        text: ['test', 'test2'],
        isPublished: 'no',
    };

    it('Should reject and show errors upon submitting a new post with an empty title', async () => {
        expect(await submitNewPost(formWithEmptyTitle)).toHaveProperty('errors');
    });

    it('Should reject and show errors upon submitting a new post with an invalid category', async () => {
        expect(await submitNewPost(formWithInvalidCategory)).toHaveProperty('errors');
    });

    test('Valid form should not return an error object', async () => {
        expect(await submitNewPost(validForm)).not.toHaveProperty('errors');
        expect(await submitNewPost(validForm)).toHaveProperty('title', 'Test title');
    });

    test('Same valid form should have a title "Test title", category "html", and isPublished false (boolean)', async () => {
        expect(await submitNewPost(validForm)).toHaveProperty('title', 'Test title');
        expect(await submitNewPost(validForm)).toHaveProperty('category', 'html');
        expect(await submitNewPost(validForm)).toHaveProperty('isPublished', false);
    });
});

describe.skip('Test GET routes for "/posts" endpoints', () => {
    async function getAllPosts() {
        const res = await fetch('http://localhost:5000/posts');
        return await res.json();
    }

    async function getSpecificPost(postID) {
        try {
            const res = await fetch(`http://localhost:5000/posts/${postID}`);
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    it('Should return an array of 2 posts at the time of testing', async () => {
        expect(await getAllPosts()).toHaveLength(2);
    });

    it('Should sort by latest first - first document to have a title "Latest post", category "javascript" and 4-long text array', async () => {
        expect((await getAllPosts())[0]).toHaveProperty('title', 'Latest post');
        expect((await getAllPosts())[0].text).toHaveLength(4);
    });

    it('Second document to have a title "Earliest post", category "html" and 3-long text array', async () => {
        expect((await getAllPosts())[1]).toHaveProperty('title', 'Earliest post');
        expect((await getAllPosts())[1].text).toHaveLength(3);
    });

    it('Should succeed in fetching a post with the ObjectID "650694ce8d33ac7cc559e27e', async () => {
        expect(await getSpecificPost('650694ce8d33ac7cc559e27e')).toHaveProperty(
            'title',
            'Latest post'
        );
    });

    it('Should return null if the searched postID (valid ObjectID) is not in the collection', async () => {
        expect(await getSpecificPost('650694ce8d33ac7cc559e26e')).toHaveProperty(
            'message',
            'No post with that ID'
        );
        expect(await getSpecificPost('650694ce8d33ac7cc559e26f')).toHaveProperty('status', 404);
    });

    it('Should return an error if the searched postID is not a valid ObjectID pattern', async () => {
        expect(await getSpecificPost('650694ce8d33ac7ccsa2e26f')).toHaveProperty(
            'message',
            'Failed to fetch - invalid ID format'
        );
        expect(await getSpecificPost('650694ce8d33ac7ccsa2e26f')).toHaveProperty('status', 400);
        expect(await getSpecificPost('foobar')).toHaveProperty('status', 400);
    });
});

describe.skip('Test DELETE routes for "/posts/:postID" endpoint', () => {
    async function submitNewPost() {
        const dummyForm = {
            title: 'Deleted',
            timestamp: new Date(),
            category: 'html',
            text: ['delete'],
            isPublished: 'no',
        };

        const formData = new FormData();

        for (const field in dummyForm) {
            formData.append(field, dummyForm[field]);
        }

        try {
            const res = await fetch('http://localhost:5000/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData),
            });

            return await res.json();
        } catch (err) {
            return err;
        }
    }

    async function deletePost(id) {
        const postID = id ?? (await submitNewPost())._id;

        try {
            const res = await fetch(`http://localhost:5000/posts/${postID}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    async function getAllPosts() {
        return await Post.find().exec();
    }

    // At the time of testing, the posts collection has 2 documents in it
    // The test should add then delete that same post via a POST followed by DELETE request
    it('Should successfully delete the specified post via DELETE request - final collection size should be 2 documents', async () => {
        expect(await deletePost()).toHaveProperty('title', 'Deleted');
        expect(await getAllPosts()).toHaveLength(2);
    });

    it('Should return 404 error upon trying to delete a post with a nonexistant ObjectID', async () => {
        expect(await deletePost('650694ce8d33ac7cc559e26e')).toHaveProperty('status', 404);
    });

    it('Should return 400 error upon trying to delete a post via an invalid ObjectID pattern', async () => {
        expect(await deletePost('650694ce8d33ac7cc559e26k')).toHaveProperty('status', 400);
    });
});

describe.skip('Test PUT routes for "/posts/:postID" endpoint', () => {
    async function editPost(id, editedFields) {
        const formData = new FormData();

        for (const field in editedFields) {
            formData.append(field, editedFields[field]);
        }

        try {
            const res = await fetch(`http://localhost:5000/posts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(formData),
            });

            return await res.json();
        } catch (err) {
            return err;
        }
    }

    async function getAllPosts() {
        const res = await fetch('http://localhost:5000/posts');
        return await res.json();
    }

    const titleToEdit = { title: 'Latest post edit' };

    const furtherEditFields = {
        text: 'First line\n\n\nSecond line\n\r\n\n\n\n',
        isPublished: 'yes',
    };

    const invalidCategory = { category: 'foobar' };

    async function setBaseDocumentData() {
        return await Post.findByIdAndUpdate(
            '650694ce8d33ac7cc559e27e',
            {
                author: 'Mao',
                title: 'Latest post',
                timestamp: new Date('2023-09-17T05:55:26.273+00:00'),
                category: 'javascript',
                text: ['Test', 'post', 'on', 'javascript category'],
                isPublished: false,
            },
            { new: true }
        );
    }

    test('Sets base document data for subsequent PUT tests', async () => {
        expect(await setBaseDocumentData()).toMatchObject({
            author: 'Mao',
            title: 'Latest post',
            timestamp: new Date('2023-09-17T05:55:26.273+00:00'),
            category: 'javascript',
            text: ['Test', 'post', 'on', 'javascript category'],
            isPublished: false,
        });
    });

    test('Collection starts off containing only 2 documents', async () => {
        expect(await getAllPosts()).toHaveLength(2);
    });

    it("Should change the latest post's title from 'Latest post' to 'Latest post edit'", async () => {
        expect(await editPost('650694ce8d33ac7cc559e27e', titleToEdit)).toMatchObject(titleToEdit);
    });

    it('Should edit the isPublished field to true and the text field to a 2-long string array', async () => {
        expect(await editPost('650694ce8d33ac7cc559e27e', furtherEditFields)).toMatchObject({
            text: ['First line', 'Second line'],
            isPublished: true,
        });
    });

    it('Should reject a PUT request involving an invalid category value', async () => {
        expect(await editPost('650694ce8d33ac7cc559e27e', invalidCategory)).toHaveProperty(
            'errors'
        );
    });

    it('Should maintain document count in collection upon successful edit', async () => {
        expect(await getAllPosts()).toHaveLength(2);
    });
});
