import { createServer } from 'node:http'
import { createSchema, createYoga } from 'graphql-yoga'
import { readFileSync } from 'node:fs';
const typeDefs = readFileSync('./graphql/schema.graphql', 'utf8');
import resolvers from "./graphql/resolvers";

const endPoint = "http://218.150.183.164:4000/graphql";
const yoga = createYoga({
    graphqlEndpoint: endPoint,
    schema: createSchema({
        typeDefs,
        resolvers
    })
});

const server = createServer(yoga)

server.listen(4000, () => {
    console.info('Server is running on'+endPoint)
})