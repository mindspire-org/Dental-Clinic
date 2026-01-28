const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');

// Get all appointments with filters
exports.getAllAppointments = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, dentist, date, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (dentist) query.dentist = dentist;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.appointmentDate = { $gte: startDate, $lt: endDate };
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone email')
            .populate('dentist', 'firstName lastName')
            .sort({ appointmentDate: -1, startTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                appointments,
                meta: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get calendar view data
exports.getCalendarView = async (req, res, next) => {
    try {
        const { start, end, dentist } = req.query;

        let query = {
            appointmentDate: {
                $gte: new Date(start),
                $lte: new Date(end)
            }
        };

        if (dentist) query.dentist = dentist;

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone')
            .populate('dentist', 'firstName lastName')
            .sort({ appointmentDate: 1, startTime: 1 });

        // Format for calendar
        const calendarEvents = appointments.map(apt => ({
            id: apt._id,
            title: `${apt.patient.firstName} ${apt.patient.lastName}`,
            start: new Date(`${apt.appointmentDate.toISOString().split('T')[0]}T${apt.startTime}`),
            end: new Date(`${apt.appointmentDate.toISOString().split('T')[0]}T${apt.endTime}`),
            dentist: `Dr. ${apt.dentist.firstName} ${apt.dentist.lastName}`,
            type: apt.type,
            status: apt.status,
            phone: apt.patient.phone
        }));

        res.status(200).json({
            status: 'success',
            data: { events: calendarEvents }
        });
    } catch (error) {
        next(error);
    }
};

// Get available time slots
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { dentistId, date } = req.query;

        if (!dentistId || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'Dentist ID and date are required'
            });
        }

        const dentist = await User.findById(dentistId);
        if (!dentist) {
            return res.status(404).json({
                status: 'error',
                message: 'Dentist not found'
            });
        }

        // Get dentist's schedule for the day
        const dayOfWeek = new Date(date).getDay();
        const schedule = dentist.schedule?.find(s => s.dayOfWeek === dayOfWeek);

        if (!schedule) {
            return res.status(200).json({
                status: 'success',
                data: { slots: [] }
            });
        }

        // Get existing appointments for the day
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const existingAppointments = await Appointment.find({
            dentist: dentistId,
            appointmentDate: { $gte: startDate, $lt: endDate },
            status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
        });

        // Generate time slots (30-minute intervals)
        const slots = [];
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

            // Check if slot is available
            const isBooked = existingAppointments.some(apt =>
                apt.startTime <= timeStr && apt.endTime > timeStr
            );

            slots.push({
                time: timeStr,
                available: !isBooked
            });

            // Increment by 30 minutes
            currentMin += 30;
            if (currentMin >= 60) {
                currentMin = 0;
                currentHour++;
            }
        }

        res.status(200).json({
            status: 'success',
            data: { slots }
        });
    } catch (error) {
        next(error);
    }
};

// Create appointment
exports.createAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.create(req.body);
        await appointment.populate('patient dentist');

        res.status(201).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Update appointment
exports.updateAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('patient dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Confirm appointment
exports.confirmAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'confirmed' },
            { new: true }
        ).populate('patient dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Complete appointment
exports.completeAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'completed' },
            { new: true }
        ).populate('patient dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Mark as no-show
exports.markNoShow = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status: 'no_show' },
            { new: true }
        ).populate('patient dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                status: 'cancelled',
                cancelledBy: req.user._id,
                cancellationReason: reason
            },
            { new: true }
        ).populate('patient dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient')
            .populate('dentist');

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

// Delete appointment
exports.deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Appointment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
