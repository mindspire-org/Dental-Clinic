const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');


router.use(auth);


// Appointment routes
router.get('/', appointmentController.getAllAppointments);
router.get('/calendar', appointmentController.getCalendarView);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', authorize('admin', 'dentist', 'receptionist'), appointmentController.createAppointment);
router.put('/:id', authorize('admin', 'dentist', 'receptionist'), appointmentController.updateAppointment);
router.post('/:id/confirm', authorize('admin', 'receptionist'), appointmentController.confirmAppointment);
router.post('/:id/complete', authorize('admin', 'dentist'), appointmentController.completeAppointment);
router.post('/:id/no-show', authorize('admin', 'receptionist'), appointmentController.markNoShow);
router.delete('/:id', authorize('admin', 'dentist', 'receptionist'), appointmentController.cancelAppointment);

module.exports = router;
