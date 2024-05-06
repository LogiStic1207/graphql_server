import { createServer } from 'node:http'
import { createSchema, createYoga } from 'graphql-yoga'
import { readFileSync } from 'node:fs';
const typeDefs = readFileSync('./graphql/schema.graphql', 'utf8');
import resolvers from "./graphql/resolvers";

const yoga = createYoga({
    schema: createSchema({
        typeDefs,
        resolvers
    })
});

const server = createServer(yoga)

server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/graphql')
})