require('dotenv').config();
const { INVALID_ID, DOES_NOT_EXIST } = require('../dist/controllers/posts_controller');

const localhost = `http://localhost:${process.env.PORT || 3000}`;

describe('Test GET routes for handling comments', () => {
    async function getAllCommentsOnPost(postID) {
        const res = await fetch(`${localhost}/posts/${postID}/comments`);
        return await res.json();
    }

    async function getAllCommentsFromReader(readerID) {
        const res = await fetch(`${localhost}/readers/${readerID}/comments`);
        return await res.json();
    }

    async function getSpecificComment(commentID) {
        try {
            const res = await fetch(`${localhost}/comments/${commentID}`);
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    it('Fetches all comments from the post: "650694ce8d33ac7cc559e27e"', async () => {
        await expect(getAllCommentsOnPost('650694ce8d33ac7cc559e27e')).resolves.toHaveLength(2);
        expect((await getAllCommentsOnPost('650694ce8d33ac7cc559e27e'))[0].text).toEqual([
            'BB1',
            'BB2',
        ]);
    });

    it('Sorts results by latest added document first', async () => {
        expect((await getAllCommentsOnPost('650694ce8d33ac7cc559e27e'))[0].text).toEqual([
            'BB1',
            'BB2',
        ]);
        expect((await getAllCommentsOnPost('650694ce8d33ac7cc559e27e'))[1].text).toEqual([
            'BA1',
            'BA2',
        ]);
    });

    it('Fetches all comments from the commenter: "65089c3cd099ae8404f14052"', async () => {
        await expect(getAllCommentsFromReader('65089c3cd099ae8404f14052')).resolves.toHaveLength(1);
        expect((await getAllCommentsFromReader('65089c3cd099ae8404f14052'))[0].text).toEqual([
            'BB1',
            'BB2',
        ]);
    });

    it('Fetches a single comment with the _id "650884f8d099ae8404f13ffc"', async () => {
        await expect(getSpecificComment('650884f8d099ae8404f13ffc')).resolves.toMatchObject({
            text: ['AA1', 'AA2'],
        });
    });

    it('Returns null if the searched postID is not in the collection', async () => {
        await expect(getSpecificComment('650694ce2d33ac7cc559e16e')).resolves.toHaveProperty(
            'message',
            'Failed to fetch - no resource with that ID'
        );
        await expect(getSpecificComment('650694ce2d33ac7cc559e16f')).resolves.toHaveProperty(
            'status',
            404
        );
    });
});

describe('Test POST route for handling comments', () => {
    // - Test POST route
    async function submitNewComment(postID, comment) {
        const formData = new FormData();

        for (const field in comment) {
            formData.append(field, comment[field]);
        }

        try {
            const res = await fetch(`http://localhost:5000/posts/${postID}/comments`, {
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

    // also deletes the comment just added for re-testability
    async function getAllCommentsOnPost(postID) {
        const res = await fetch(`${localhost}/posts/${postID}/comments`);
        return await res.json();
    }

    const commentWithNoText = { text: '' };

    const validComment = { text: 'test\n\rtest2\n\n\n\n' };

    test('Post-to-be-commented-on starts with only 1 comment on it', async () => {
        await expect(getAllCommentsOnPost('65068b879df45e6e50921c78')).resolves.toHaveLength(1);
    });

    it('Rejects and shows errors upon submitting a new comment with no text', async () => {
        expect(
            await submitNewComment('65068b879df45e6e50921c78', commentWithNoText)
        ).toHaveProperty('errors');
    });

    it('Submits valid comment and stores in the database', async () => {
        expect((await submitNewComment('65068b879df45e6e50921c78', validComment)).text).toEqual([
            'test',
            'test2',
        ]);
    });

    test('Commented-on post now has an additional comment on it', async () => {
        await expect(getAllCommentsOnPost('65068b879df45e6e50921c78')).resolves.toHaveLength(2);
    });
});

describe('Test PUT routes for handling comments', () => {
    async function editComment(commentID, editedFields) {
        const formData = new FormData();

        for (const field in editedFields) {
            formData.append(field, editedFields[field]);
        }

        try {
            const res = await fetch(`http://localhost:5000/comments/${commentID}`, {
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

    async function getAllCommentsOnPost(postID) {
        const res = await fetch(`${localhost}/posts/${postID}/comments`);
        return await res.json();
    }

    const editedText = {
        text: '\n\r\n\n\n\r\nedited\n\n\n\nedited\r\nedited\nedited\n\n\n\n\n',
    };

    test('Post which the comment-to-edit is on has 2 comments on it', async () => {
        await expect(getAllCommentsOnPost('65068b879df45e6e50921c78')).resolves.toHaveLength(2);
    });

    it("Edits the only comment on the previous test's post with new text'", async () => {
        expect((await editComment('650884f8d099ae8404f13ffc', editedText)).text).toEqual([
            'edited',
            'edited',
            'edited',
            'edited',
        ]);
    });

    it('Rejects a PUT request if the edited comment text is empty', async () => {
        expect(await editComment('650884f8d099ae8404f13ffc')).toHaveProperty('errors');
    });

    it('Returns a 404 error if route is accessed with an ObjectID that is not a stored comment', async () => {
        await expect(editComment('640694cd8d23ac7cc559e26e', editedText)).resolves.toMatchObject(
            DOES_NOT_EXIST
        );
    });

    it('Returns a 400 error if route is accessed with an invalid ObjectID pattern', async () => {
        await expect(editComment('foobar', editedText)).resolves.toMatchObject(INVALID_ID);
    });

    it('Maintains a count of 2 comments on the test post', async () => {
        await expect(getAllCommentsOnPost('65068b879df45e6e50921c78')).resolves.toHaveLength(2);
    });
});

describe('Test DELETE routes for handling comments', () => {
    async function deleteComment(commentID) {
        try {
            const res = await fetch(`${localhost}/comments/${commentID}`, {
                method: 'DELETE',
            });
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    async function getAllCommentsOnPost(postID) {
        const res = await fetch(`${localhost}/posts/${postID}/comments`);
        return await res.json();
    }

    async function getSpecificComment(commentID) {
        try {
            const res = await fetch(`${localhost}/comments/${commentID}`);
            return await res.json();
        } catch (err) {
            return err;
        }
    }

    test('Test post starts with 2 comments on it', async () => {
        await expect(getAllCommentsOnPost('650694ce8d33ac7cc559e27e')).resolves.toHaveLength(2);
    });

    it('Deletes the specified comment from post "650694ce8d33ac7cc559e27e"', async () => {
        await expect(deleteComment('650884f8d099ae8404f13ffd')).resolves.toMatchObject({
            text: ['BA1', 'BA2'],
        });
    });

    test('Deleted comment no longer exists in the database', async () => {
        await expect(getSpecificComment('650884f8d099ae8404f13ffd')).resolves.toMatchObject(
            DOES_NOT_EXIST
        );
    });

    it('Returns 400 error upon trying to delete a post via an invalid ObjectID pattern', async () => {
        await expect(deleteComment('650694ce8d33ac7cc559e26k')).resolves.toMatchObject(INVALID_ID);
    });

    test('Test post now has 1 comment om it after comment deletion', async () => {
        await expect(getAllCommentsOnPost('650694ce8d33ac7cc559e27e')).resolves.toHaveLength(1);
    });
});
