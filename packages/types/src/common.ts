export interface ICommonErrorResponse {
  code: string
  message: string
}

export type WithError<T> = T | ICommonErrorResponse
