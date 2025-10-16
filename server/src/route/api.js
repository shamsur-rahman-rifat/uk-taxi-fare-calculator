import { Router } from 'express'
import { calculateFare  } from '../controller/fareController.js'

const router=Router()

router.post('/calculateFare', calculateFare);

export default router;