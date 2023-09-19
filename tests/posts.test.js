require('dotenv').config();
const {
    INVALID_ID,
    INVALID_QUERY,
    DOES_NOT_EXIST,
} = require('../dist/controllers/posts_controller');

const localhost = `http://localhost:${process.env.PORT || 3000}`;

describe('Test GET routes for handling posts', () => {
    async function getAllPosts() {
        const res = await fetch(`${localhost}/posts`);
        return await res.json();
    }

    async function getSpecificPost(postID) {
        try {
            const res = await fetch(`${localhost}/posts/${postID}`);
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    it('Returns an array of 2 posts at the time of testing', async () => {
        expect(await getAllPosts()).toHaveLength(2);
    });

    it('Sorts results by date - latest post first', async () => {
        expect((await getAllPosts())[0]).toHaveProperty('title', 'Latest post test');
        expect((await getAllPosts())[0].text).toEqual(['postB1', 'postB2']);
    });

    it('Returns the earlier-created post second', async () => {
        expect((await getAllPosts())[1]).toHaveProperty('title', 'Earliest post test');
        expect((await getAllPosts())[1].text).toEqual(['postA1', 'postA2']);
    });

    it('Fetches a post with the ObjectID "650694ce8d33ac7cc559e27e', async () => {
        expect(await getSpecificPost('650694ce8d33ac7cc559e27e')).toMatchObject({
            title: 'Latest post test',
            category: 'javascript',
            isPublished: true,
        });
    });

    it('Returns a 404 error if the searched postID (valid ObjectID) is not in the collection', async () => {
        expect(await getSpecificPost('650394ce8d31ac7cc359e26a')).toMatchObject(DOES_NOT_EXIST);
        expect(await getSpecificPost('620324ce8d31ac7cc351d24a')).toMatchObject(DOES_NOT_EXIST);
    });

    it('Returns a 400 error if the searched postID is not a valid ObjectID pattern', async () => {
        expect(await getSpecificPost('650694ce8d33ac7ccsa2e26f')).toMatchObject(INVALID_ID);
        expect(await getSpecificPost('foobar')).toMatchObject(INVALID_ID);
    });
});

describe('Test POST route for handling posts', () => {
    // - Test POST route
    async function submitNewPost(post) {
        const formData = new FormData();

        for (const field in post) {
            formData.append(field, post[field]);
        }

        try {
            const res = await fetch(`${localhost}/posts`, {
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
        text: '\n\n\ntest\n\r\r\r\r\n\ntest2\n',
        isPublished: 'no',
    };

    const formWithInvalidCategory = {
        title: 'Test title',
        timestamp: new Date(),
        category: 'htmls',
        text: '\n\n\ntest\n\r\r\r\r\n\ntest2\n',
        isPublished: 'no',
    };

    const validForm = {
        title: 'Test title',
        timestamp: new Date(),
        category: 'html',
        text: '\n\n\ntest\n\r\r\r\r\n\ntest2\n',
        isPublished: 'no',
    };

    it('Errors upon submitting a new post with an empty title', async () => {
        expect(await submitNewPost(formWithEmptyTitle)).toHaveProperty('errors');
    });

    it('Errors upon submitting a new post with an invalid category', async () => {
        expect(await submitNewPost(formWithInvalidCategory)).toHaveProperty('errors');
    });

    test('The same valid form has a title "Test title", category "html", and is not published', async () => {
        expect(await submitNewPost(validForm)).toMatchObject({
            title: 'Test title',
            category: 'html',
            isPublished: false,
        });
    });
});

describe('Test PUT routes for handling posts', () => {
    async function editPost(id, editedFields) {
        const formData = new FormData();

        for (const field in editedFields) {
            formData.append(field, editedFields[field]);
        }

        try {
            const res = await fetch(`${localhost}/posts/${id}`, {
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
        const res = await fetch(`${localhost}/posts`);
        return await res.json();
    }

    const titleToEdit = { title: 'Latest post edit' };

    const furtherEditFields = {
        text: 'First line\n\n\nSecond line\n\r\n\n\n\n',
        isPublished: 'yes',
    };

    const invalidCategory = { category: 'foobar' };

    const originalData = {
        title: 'Latest post test',
        category: 'javascript',
        text: 'postB1\npostB2',
        isPublished: 'yes',
    };

    test('Collection starts off containing only 2 documents', async () => {
        await expect(getAllPosts()).resolves.toHaveLength(3);
    });

    it("Should change the latest post's title from 'Latest post' to 'Latest post edit'", async () => {
        await expect(editPost('650694ce8d33ac7cc559e27e', titleToEdit)).resolves.toMatchObject(
            titleToEdit
        );
    });

    it('Should edit the isPublished field to true and the text field to a 2-long string array', async () => {
        await expect(
            editPost('650694ce8d33ac7cc559e27e', furtherEditFields)
        ).resolves.toMatchObject({
            text: ['First line', 'Second line'],
            isPublished: true,
        });
    });

    it('Should reject a PUT request involving an invalid category value', async () => {
        await expect(editPost('650694ce8d33ac7cc559e27e', invalidCategory)).resolves.toHaveProperty(
            'errors'
        );
    });

    it('Should maintain document count in collection upon successful edit', async () => {
        await expect(getAllPosts()).resolves.toHaveLength(3);
    });

    it('Resets to base document data after PUT tests', async () => {
        await expect(editPost('650694ce8d33ac7cc559e27e', originalData)).resolves.toMatchObject({
            author: '65068c32be2fd5ade9800662',
            title: 'Latest post test',
            category: 'javascript',
            text: ['postB1', 'postB2'],
            isPublished: true,
        });
    });
});

describe('Test PATCH for publishing a post', () => {
    async function patchPost(postID, isToBePublished) {
        const res = await fetch(`${localhost}/posts/${postID}?publish=${isToBePublished}`, {
            method: 'PATCH',
        });
        return await res.json();
    }

    async function getPost(postID) {
        try {
            const res = await fetch(`${localhost}/posts/${postID}`);
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    test('Test post starts unpublished', async () => {
        await expect(getPost('65068b879df45e6e50921c78')).resolves.toMatchObject({
            isPublished: false,
        });
    });

    it('Returns a 404 error if the searched postID (valid ObjectID) is not in the collection', async () => {
        await expect(patchPost('650394ce8d31ac7cc359e26a', true)).resolves.toMatchObject(
            DOES_NOT_EXIST
        );
    });

    it('Returns a 400 error (invalid ID) if the searched postID is not a valid ObjectID pattern', async () => {
        await expect(patchPost('foobar', true)).resolves.toMatchObject(INVALID_ID);
    });

    it('Returns a 400 error (invalid query) if the request query is not "true" or "false"', async () => {
        await expect(patchPost('65068b879df45e6e50921c78', 'foo')).resolves.toMatchObject(
            INVALID_QUERY
        );
    });

    it('Publishes an unpublished post when a "?publish=true" query is sent', async () => {
        await expect(patchPost('65068b879df45e6e50921c78', true)).resolves.toMatchObject({
            isPublished: true,
        });
    });

    it('Unpublishes a published post when a "?publish=false" query is sent', async () => {
        await expect(patchPost('65068b879df45e6e50921c78', false)).resolves.toMatchObject({
            isPublished: false,
        });
    });

    it("Does not change a post's published status if the publish query matches the current status", async () => {
        await expect(patchPost('65068b879df45e6e50921c78', false)).resolves.toMatchObject({
            isPublished: false,
        });
        await expect(patchPost('650694ce8d33ac7cc559e27e', true)).resolves.toMatchObject({
            isPublished: true,
        });
    });
});

describe('Test DELETE routes for handling posts', () => {
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
            const res = await fetch(`${localhost}/posts`, {
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
            const res = await fetch(`${localhost}/posts/${postID}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    // At the time of testing, the posts collection has 2 documents in it
    // The test should add then delete that same post via a POST followed by DELETE request
    it('Deletes a specified post via DELETE request', async () => {
        await expect(deletePost()).resolves.toMatchObject({
            title: 'Deleted',
            category: 'html',
            isPublished: false,
        });
    });

    it('Returns a 404 error upon trying to delete a post with a nonexistant ObjectID', async () => {
        await expect(deletePost('650694ce8d33ac7cc559e26e')).resolves.toMatchObject(DOES_NOT_EXIST);
    });

    it('Returns a 400 error upon trying to delete a post via an invalid ObjectID pattern', async () => {
        await expect(deletePost('650694ce8d33ac7cc559e26k')).resolves.toMatchObject(INVALID_ID);
    });
});
