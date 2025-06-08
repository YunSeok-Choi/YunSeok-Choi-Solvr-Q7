import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context'
import { createUserRoutes } from './userRoutes'
import { createReleaseRoutes } from './releaseRoutes'
import { dashboardRoutes } from './dashboardRoutes'
import healthRoutes from './healthRoutes'

// 모든 라우트 등록
export const createRoutes = (context: AppContext) => async (fastify: FastifyInstance) => {
  // 헬스 체크 라우트
  fastify.register(healthRoutes, { prefix: '/api/health' })

  // 사용자 관련 라우트
  fastify.register(createUserRoutes(context), { prefix: '/api/users' })

  // 릴리즈 관련 라우트
  fastify.register(createReleaseRoutes(context), { prefix: '/api/releases' })

  // 대시보드 관련 라우트 (새로 추가)
  fastify.register(dashboardRoutes, { prefix: '/api' })
}
