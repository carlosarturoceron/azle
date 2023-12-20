import { StableBTreeMap } from 'azle';
import { writeFileSync, readFileSync } from 'fs';

import { Server } from './abstractions';

let db = StableBTreeMap<string, User>(0);

type User = {
    id: string;
    username: string;
};

export default Server((app) => {
    app.get('/', (_req, res) => {
        res.send(`<html><body>This is the app</body></html>`);
    });

    app.get('/user/get/:id', (req, res) => {
        const user = db.get(req.params.id);

        if (user.Some !== undefined) {
            res.json(user.Some);
        } else {
            res.send('Not found\n');
        }
    });

    app.post('/user/create', (req, res) => {
        const id: string = req.query.id as string;
        const username: string = req.query.username as string;

        const user: User = {
            id,
            username
        };

        db.insert(id, user);

        res.send('Saved\n');
    });

    app.get('/read', (req, res) => {
        const contents = readFileSync('test.txt');

        res.send(contents.toString());
    });

    app.post('/write/:contents', (req, res) => {
        writeFileSync('test.txt', req.params.contents);

        res.send('Written');
    });
});
