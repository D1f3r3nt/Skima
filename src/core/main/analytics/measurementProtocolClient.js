class MeasurementProtocolClient {
  constructor({ measurementId, apiSecret, collectUrl, fetchImplementation }) {
    this.measurementId = measurementId
    this.apiSecret = apiSecret
    this.collectUrl = collectUrl
    this.fetchImplementation = fetchImplementation
  }

  get isConfigured() {
    return Boolean(this.measurementId && this.apiSecret)
  }

  async send({ clientId, userProperties, events }) {
    const url = new URL(this.collectUrl)
    url.searchParams.set('measurement_id', this.measurementId)
    url.searchParams.set('api_secret', this.apiSecret)
    const response = await this.fetchImplementation(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        user_properties: Object.fromEntries(Object.entries(userProperties).map(([name, value]) => [name, { value }])),
        events
      })
    })
    if (!response.ok) {
      throw new Error(`Measurement Protocol respondió ${response.status}`)
    }
    return response
  }
}

module.exports = { MeasurementProtocolClient }
