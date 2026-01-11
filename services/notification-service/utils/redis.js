const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const publisher = new Redis(redisUrl);
const subscriber = new Redis(redisUrl);

publisher.on('connect', () => {
    console.log('✅ Redis publisher connected');
});

publisher.on('error', (err) => {
    console.error('❌ Redis publisher error:', err.message);
});

subscriber.on('connect', () => {
    console.log('✅ Redis subscriber connected');
});

subscriber.on('error', (err) => {
    console.error('❌ Redis subscriber error:', err.message);
});

// Publish notification
const publishNotification = async (channel, data) => {
    try {
        await publisher.publish(channel, JSON.stringify(data));
    } catch (error) {
        console.error('Publish error:', error);
    }
};

// Subscribe to channel
const subscribeToChannel = (channel, callback) => {
    subscriber.subscribe(channel, (err) => {
        if (err) {
            console.error('Subscribe error:', err);
        }
    });

    subscriber.on('message', (ch, message) => {
        if (ch === channel) {
            try {
                const data = JSON.parse(message);
                callback(data);
            } catch (error) {
                console.error('Parse message error:', error);
            }
        }
    });
};

module.exports = {
    publisher,
    subscriber,
    publishNotification,
    subscribeToChannel,
};
