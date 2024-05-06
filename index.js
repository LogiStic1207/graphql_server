import { ServerResponse, createServer } from 'node:http'
import { createSchema, createYoga } from 'graphql-yoga'
import { readFileSync } from 'node:fs';
const typeDefs = readFileSync('./graphql/schema.graphql', 'utf8');
import resolvers from "./graphql/resolvers";
const endPoint = 'http://192.168.219.101:3000/'; //엔드포인트 경로: http://IP주소:포트번호/
const yoga = createYoga({
    //landingPage: True,
    graphqlEndpoint: endPoint,
    schema: createSchema({
        typeDefs,
        resolvers
    })
});

const server = createServer(yoga)

server.listen(3000, () => {

    
    console.info('Server is running on '+ endPoint)
})