import { ICommonErrorResponse } from '@repo/types/common'
import { AxiosError, isAxiosError } from 'axios'

export const isCommonAxiosError = (error: unknown): error is AxiosError<ICommonErrorResponse> => {
  if (!isAxiosError(error)) return false

  const data = error.response?.data as unknown

  if (typeof data !== 'object' || !data) return false

  return (
    'code' in data &&
    'message' in data &&
    typeof data.code === 'string' &&
    typeof data.message === 'string'
  )
}
