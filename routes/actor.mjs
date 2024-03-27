import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.send('Actor page');
});

router.get('/settings', (req, res) => {
    res.send('Settings page');
  });

export default router
