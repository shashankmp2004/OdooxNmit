import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  // Basic rate limit: 5 attempts per 5 minutes per IP
  const ip = getClientIp(req)
  const rl = checkRateLimit(`signup:${ip}`, 5, 5 * 60 * 1000)
  rateLimitResponse(res, rl.remaining, rl.resetAt)
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests, please try again later' })

  const parse = schema.safeParse(req.body || {})
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() })
  }
  const { name, email, password } = parse.data

  try {
  const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: 'OPERATOR'
      },
      select: { id: true, name: true, email: true, role: true }
    })

    return res.status(201).json(user)
  } catch (e) {
    console.error('simple-signup error:', e)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}
