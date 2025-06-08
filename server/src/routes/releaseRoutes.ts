import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context'
import { createReleaseStatsController } from '../controllers/releaseStatsController'

// 릴리즈 관련 라우트 등록
export const createReleaseRoutes = (context: AppContext) => async (fastify: FastifyInstance) => {
  const releaseStatsController = createReleaseStatsController({
    releaseStatsService: context.releaseStatsService
  })

  // 릴리즈 통계 조회
  fastify.get('/stats', releaseStatsController.getReleaseStats)
}
