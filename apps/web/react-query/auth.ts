'use client'

import { apiUrls } from '@/lib/apiUrls'
import { QUERY_KEYS } from '@/lib/constants'
import { instance } from '@/lib/instance'
import type {
  ICreateOrUpdateUserPayload,
  IUserLoginPayload,
  TCreateOrUpdateUserResponse,
} from '@repo/types/auth'
import { useMutation } from '@tanstack/react-query'

export function useLogin(
  options?: TMutationOptions<TCreateOrUpdateUserResponse, IUserLoginPayload>,
) {
  return useMutation({
    mutationKey: [QUERY_KEYS.LOGIN],
    mutationFn: async (payload) => {
      const { data } = await instance.post<TCreateOrUpdateUserResponse>(apiUrls.auth.login, payload)
      return data
    },
    ...options,
  })
}

export function useRegister(
  options?: TMutationOptions<TCreateOrUpdateUserResponse, ICreateOrUpdateUserPayload>,
) {
  return useMutation({
    mutationKey: [QUERY_KEYS.REGISTER],
    mutationFn: async (payload) => {
      const { data } = await instance.post<TCreateOrUpdateUserResponse>(
        apiUrls.auth.register,
        payload,
      )
      return data
    },
    ...options,
  })
}
