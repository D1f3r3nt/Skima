const operatingSystemNames = Object.freeze({ win32: 'Windows', darwin: 'macOS', linux: 'Linux' })

const describeAnalyticsEnvironment = ({ platform, osRelease, appVersion }) => ({
  operatingSystem: operatingSystemNames[platform] ?? platform,
  osVersion: osRelease,
  appVersion
})

module.exports = { describeAnalyticsEnvironment }
