import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.send('Help page');
});

export default router
