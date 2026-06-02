export interface ICreateOrUpdateUserPayload {
  email: string
  password: string
}

export interface ICreateOrUpdateUserResponse {
  accessToken: string
  refreshToken: string
  userId: string
}
