const Redis = require('ioredis');
const { PubSub } = require('graphql-subscriptions');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const publisher = new Redis(redisUrl);
const subscriber = new Redis(redisUrl);

publisher.on('connect', () => {
    console.log('✅ Redis publisher connected');
});

subscriber.on('connect', () => {
    console.log('✅ Redis subscriber connected');
});

// GraphQL PubSub for subscriptions
const pubsub = new PubSub();

// Events
const EVENTS = {
    BUDGET_ALERT: 'BUDGET_ALERT',
    TRANSACTION_ADDED: 'TRANSACTION_ADDED',
    DASHBOARD_UPDATED: 'DASHBOARD_UPDATED',
};

module.exports = {
    publisher,
    subscriber,
    pubsub,
    EVENTS,
};
