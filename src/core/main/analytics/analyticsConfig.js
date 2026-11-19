const measurementProtocolApiSecret = 'nbV7QbQ7TiKxkpNqWfPBiw'

const analyticsConfig = Object.freeze({
  measurementId: 'G-F9T3C6DQL4',
  apiSecret: process.env.SKIMA_ANALYTICS_API_SECRET || measurementProtocolApiSecret,
  collectUrl: 'https://www.google-analytics.com/mp/collect'
})

module.exports = { analyticsConfig }
