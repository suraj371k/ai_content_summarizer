import { Router } from "express";
import { deleteSummary, generateSummary, getSummary, getSummaryById, updateSummary } from "../controllers/summary.controller.js";

const router = Router()


router.post('/' , generateSummary)

router.get('/' , getSummary)

router.get('/:id' , getSummaryById)

router.delete('/:id' , deleteSummary)

router.put('/:id' , updateSummary)

export default router