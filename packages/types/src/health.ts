import { WithError } from './common.js'

export type THealthCheckSuccessResponse = WithError<{
  status: 'ok'
  timestamp: Date
}>
