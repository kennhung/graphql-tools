const { diff } = require('@graphql-inspector/core');
const { loadSchema } = require('@graphql-tools/load');
const { UrlLoader } = require('@graphql-tools/url-loader');
const { express: voyagerMiddleware } = require('graphql-voyager/middleware');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const app = express();

app.get('/', (req, res) => {
    res.send(fs.readFileSync('./index.html').toString());
});

const oldURL = process.argv.slice(2)[0];
const newURL = process.argv.slice(2)[1];

app.get('/diff', async (req, res) => {
    const oldSchema = await loadSchema(oldURL, {
        loaders: [
            new UrlLoader(),
        ],
    });

    const newSchema = await loadSchema(newURL, {
        loaders: [
            new UrlLoader(),
        ],
    });
    const difference = diff(oldSchema, newSchema);
    difference.sort((a, b) => {
        if (a.path < b.path) {
            return -1;
        }
        if (a.path > b.path) {
            return 1;
        }
        return 0;
    });

    res.send(difference);
});

app.use('/graphql/old', createProxyMiddleware({
    target: oldURL
}));

app.use('/graphql/new', createProxyMiddleware({
    target: newURL
}));

app.use('/voyager/old', voyagerMiddleware({ endpointUrl: '/graphql/old' }));
app.use('/voyager/new', voyagerMiddleware({ endpointUrl: '/graphql/new' }));

const port = 5000;
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});