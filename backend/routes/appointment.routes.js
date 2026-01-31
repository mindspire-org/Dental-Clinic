const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
// const auth = require('../middleware/auth.middleware');
// const authorize = require('../middleware/role.middleware');


// router.use(auth);


// Appointment routes
router.get('/', appointmentController.getAllAppointments);
router.get('/calendar', appointmentController.getCalendarView);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.post('/:id/confirm', appointmentController.confirmAppointment);
router.post('/:id/complete', appointmentController.completeAppointment);
router.post('/:id/no-show', appointmentController.markNoShow);
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;
