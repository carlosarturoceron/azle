import { Server } from './abstractions';

export default Server((app) => {
    app.get('/', (_req, res) => {
        res.send('the main route of course');
    });

    app.get('/user/get', (_req, res) => {
        res.send('This is a user of course');
    });

    app.get('/friend/get', (_req, res) => {
        res.send('This is a friend of course');
    });
});
