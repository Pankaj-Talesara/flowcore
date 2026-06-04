import { WithError } from './common.js'

export interface ICreateOrUpdateUserPayload {
  email: string
  password: string
  name: string
}

export type TCreateOrUpdateUserResponse = WithError<{
  message: string
  userId: string
}>

export interface IUserLoginPayload {
  email: string
  password: string
}

export type UserJwtPayload = {
  email: string
  userId: string
  name: string
}

export type TRefreshTokenResponse = WithError<{
  message: string
  userId: string
}>
