import { Router } from 'express';
import { FieldExecutiveController } from '../controllers/field-executive.controller';
import { protect, restrictTo } from '../../../core/middlewares/auth.middleware';
import { UserRole } from '../../users/models/User';
import { Task } from '../../zones/models/Task';
import { AuthRequest } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.use(restrictTo(UserRole.FIELD_EXECUTIVE));

router.get('/workers', FieldExecutiveController.getWorkers);
router.get('/worker/:id/status', FieldExecutiveController.getWorkerStatus);
router.get('/visits', FieldExecutiveController.getVisits);
router.post('/worker/:id/visit', FieldExecutiveController.logVisit);
router.get('/quality-audit', FieldExecutiveController.getQualityAudits);
router.post('/quality-audit/:jobId', FieldExecutiveController.submitQualityAudit);

// Tasks
router.get('/tasks', async (req: AuthRequest, res, next) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('assignedBy', 'name email')
            .populate('zone', 'name city')
            .populate('job', 'serviceType subServiceName status location')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, results: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
});

router.get('/tasks/:taskId', async (req: AuthRequest, res, next) => {
    try {
        const task = await Task.findOne({ _id: req.params.taskId, assignedTo: req.user._id })
            .populate('assignedBy', 'name email')
            .populate('zone', 'name city')
            .populate('job', 'serviceType subServiceName status location');
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

router.patch('/tasks/:taskId/resolve', async (req: AuthRequest, res, next) => {
    try {
        const { resolutionNotes } = req.body;
        const task = await Task.findOneAndUpdate(
            { _id: req.params.taskId, assignedTo: req.user._id },
            { status: 'RESOLVED', resolutionNotes, resolvedAt: new Date() },
            { new: true }
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

router.patch('/tasks/:taskId/progress', async (req: AuthRequest, res, next) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.taskId, assignedTo: req.user._id },
            { status: 'IN_PROGRESS' },
            { new: true }
        );
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

export default router;
