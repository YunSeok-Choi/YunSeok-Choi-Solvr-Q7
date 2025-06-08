import { UserService } from '../services/userService'
import { ReleaseStatsService } from '../services/releaseStatsService'
import { GithubService } from '../services/githubService'

export type AppContext = {
  userService: UserService
  releaseStatsService: ReleaseStatsService
  githubService: GithubService
}
