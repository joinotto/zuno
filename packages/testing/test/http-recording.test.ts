// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest'
import { createRecordingFetch, createReplayFetch, type HttpRecording } from '../src/index.js'

describe('HTTP recording', () => {
  it('records JSON exchanges and redacts credentials', async () => {
    const recordings: HttpRecording[] = []
    const fetchImplementation = createRecordingFetch({
      fetch: async () =>
        new Response(JSON.stringify({ accessToken: 'response-secret', id: 'account-1' }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'session=secret',
          },
          status: 201,
        }),
      onRecord: (recording) => {
        recordings.push(recording)
      },
    })

    const response = await fetchImplementation(
      'https://provider.test/accounts?access_token=query-secret',
      {
        body: JSON.stringify({ apiKey: 'body-secret', name: 'Account' }),
        headers: {
          authorization: 'Bearer header-secret',
          'content-type': 'application/json',
        },
        method: 'POST',
      },
    )

    await expect(response.json()).resolves.toMatchObject({ id: 'account-1' })
    expect(recordings).toEqual([
      {
        request: {
          body: { apiKey: '[REDACTED]', name: 'Account' },
          headers: {
            authorization: '[REDACTED]',
            'content-type': 'application/json',
          },
          method: 'POST',
          url: 'https://provider.test/accounts?access_token=%5BREDACTED%5D',
        },
        response: {
          body: { accessToken: '[REDACTED]', id: 'account-1' },
          headers: {
            'content-type': 'application/json',
            'set-cookie': '[REDACTED]',
          },
          status: 201,
          statusText: '',
        },
      },
    ])
  })

  it('omits text bodies unless the caller enables them', async () => {
    const recordings: HttpRecording[] = []
    const fetchImplementation = createRecordingFetch({
      fetch: async () => new Response('response text'),
      onRecord: (recording) => {
        recordings.push(recording)
      },
    })

    await fetchImplementation('https://provider.test/text', {
      body: 'request text',
      method: 'POST',
    })

    expect(recordings[0]?.request.body).toBeUndefined()
    expect(recordings[0]?.response.body).toBeUndefined()
  })
})

describe('HTTP replay', () => {
  it('matches recorded requests and returns independent responses', async () => {
    const replay = createReplayFetch([
      {
        request: {
          body: { id: 'account-1' },
          headers: {},
          method: 'POST',
          url: 'https://provider.test/accounts',
        },
        response: {
          body: { active: true },
          headers: { 'content-type': 'application/json' },
          status: 200,
          statusText: 'OK',
        },
      },
    ])

    const response = await replay.fetch('https://provider.test/accounts', {
      body: JSON.stringify({ id: 'account-1' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })

    await expect(response.json()).resolves.toEqual({ active: true })
    expect(replay.remaining()).toBe(0)
  })

  it('rejects requests without a matching recording', async () => {
    const replay = createReplayFetch([])

    await expect(replay.fetch('https://provider.test/missing')).rejects.toThrow(
      'No HTTP recording matches GET https://provider.test/missing.',
    )
  })
})
