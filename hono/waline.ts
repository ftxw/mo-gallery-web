import 'server-only'
import Waline from '@waline/vercel'

export const walineHandler = Waline({
  async postSave(_comment: Record<string, unknown>) {
    console.log('Comment saved')
  },
  async postDelete(_commentId: string) {
    console.log('Comment deleted')
  },
  async postUpdate() {},
})
