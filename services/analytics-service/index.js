require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const express = require('express');
const cors = require('cors');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');

const PORT = process.env.PORT || 4000;

async function startServer() {
    const app = express();
    const httpServer = createServer(app);

    // Create schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    // WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    const serverCleanup = useServer({ schema }, wsServer);

    // Apollo Server
    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    await server.start();

    app.use(cors());
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', service: 'analytics-service' });
    });

    // GraphQL endpoint
    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }) => {
                // Add authentication context if needed
                return { token: req.headers.authorization };
            },
        })
    );

    httpServer.listen(PORT, () => {
        console.log(`🚀 Analytics Service running on port ${PORT}`);
        console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
        console.log(`🔌 WebSocket subscriptions: ws://localhost:${PORT}/graphql`);
    });
}

startServer().catch(console.error);
