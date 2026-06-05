import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_ORIGIN ?? ''

export const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})
