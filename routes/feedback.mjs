import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.send('Feedback page');
});

export default router
