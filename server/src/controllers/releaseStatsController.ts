import { FastifyRequest, FastifyReply } from 'fastify'
import { createSuccessResponse, createErrorResponse } from '../utils/response'
import { ReleaseStatsService } from '../services/releaseStatsService'

type ReleaseStatsControllerDeps = {
  releaseStatsService: ReleaseStatsService
}

export const createReleaseStatsController = ({
  releaseStatsService
}: ReleaseStatsControllerDeps) => {
  const getReleaseStats = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('Fetching release statistics and generating CSV...')

      // releaseStatsService를 통해 GitHub 데이터 수집 및 CSV 생성 트리거
      const stats = await releaseStatsService.getReleaseStats()

      // CSV 생성 성공 여부 확인
      const csvCreated =
        stats.metadata?.csvFilePath && stats.metadata.csvFilePath !== 'CSV generation failed'

      if (csvCreated && stats.metadata?.csvFilePath) {
        request.log.info(`Unified CSV file created successfully: ${stats.metadata.csvFilePath}`)

        // 성공 응답에 CSV 생성 메시지 추가
        const responseData = {
          ...stats,
          csvStatus: 'Unified CSV file created successfully',
          csvPath: stats.metadata.csvFilePath
        }

        return reply
          .code(200)
          .send(
            createSuccessResponse(
              responseData,
              'Release statistics fetched and unified CSV file created successfully'
            )
          )
      } else {
        // CSV 생성은 실패했지만 통계 데이터는 정상적으로 반환
        request.log.warn('CSV generation failed, but statistics data is available')

        const responseData = {
          ...stats,
          csvStatus: 'CSV generation failed',
          csvPath: null
        }

        return reply
          .code(200)
          .send(
            createSuccessResponse(
              responseData,
              'Release statistics fetched successfully, but CSV generation failed'
            )
          )
      }
    } catch (error) {
      request.log.error('Error in getReleaseStats:', error)

      // 에러 타입에 따른 구체적인 메시지
      let errorMessage = '릴리즈 통계를 불러오는데 실패했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('GitHub API')) {
          errorMessage = 'GitHub API 연결에 실패했습니다. 네트워크를 확인해주세요.'
        } else if (error.message.includes('CSV')) {
          errorMessage = 'CSV 파일 생성에 실패했습니다.'
        }
      }

      return reply.code(500).send(createErrorResponse(errorMessage))
    }
  }

  return {
    getReleaseStats
  }
}

export type ReleaseStatsController = ReturnType<typeof createReleaseStatsController>
