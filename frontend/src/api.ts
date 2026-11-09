// import type { Analysis, History } from './types'
// const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
// async function request<T>(path: string, init?: RequestInit): Promise<T> {
//   const res = await fetch(`${BASE}${path}`, init)
//   if (!res.ok) {
//     let message = `Request failed (${res.status})`
//     try { const body = await res.json(); message = typeof body.detail === 'string' ? body.detail : message } catch {}
//     throw new Error(message)
//   }
//   return res.json()
// }
// export async function analyze(jd: string, resume: string, file?: File): Promise<Analysis> {
//   const form = new FormData()
//   form.append('job_description', jd)
//   if (resume.trim()) form.append('resume_text', resume)
//   if (file) form.append('resume_file', file)
//   return request('/api/v1/analyses', { method: 'POST', body: form })
// }
// export function history(params: URLSearchParams) { return request<History>(`/api/v1/analyses?${params}`) }
// export function getAnalysis(id: number) { return request<Analysis>(`/api/v1/analyses/${id}`) }
// export function deleteAnalysis(id: number) { return request(`/api/v1/analyses/${id}`, { method: 'DELETE' }) }


import type { Analysis, History } from './types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = typeof body.detail === 'string' ? body.detail : message
    } catch {}
    throw new Error(message)
  }

  return res.json()
}

export async function analyze(
  jd: string,
  resume: string,
  file?: File,
  jdFile?: File
): Promise<Analysis> {
  const form = new FormData()

  if (jd.trim()) form.append('job_description', jd)
  if (jdFile) form.append('jd_file', jdFile)

  if (resume.trim()) form.append('resume_text', resume)
  if (file) form.append('resume_file', file)

  return request('/api/v1/analyses', {
    method: 'POST',
    body: form
  })
}

export function history(params: URLSearchParams) {
  return request<History>(`/api/v1/analyses?${params}`)
}

export function getAnalysis(id: number) {
  return request<Analysis>(`/api/v1/analyses/${id}`)
}

export function deleteAnalysis(id: number) {
  return request(`/api/v1/analyses/${id}`, { method: 'DELETE' })
}