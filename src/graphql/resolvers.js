const prisma = require('../prismaClient');
const { requireAuth, requireRole } = require('../auth');
const GraphQLJSON = require('graphql-type-json');

function toISO(obj) {
  return {
    ...obj,
    createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : new Date(obj.createdAt).toISOString(),
    updatedAt: obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : new Date(obj.updatedAt).toISOString(),
    dateOfBirth: obj.dateOfBirth
      ? obj.dateOfBirth instanceof Date
        ? obj.dateOfBirth.toISOString()
        : new Date(obj.dateOfBirth).toISOString()
      : null
  };
}

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    me: async (_, __, { user }) => requireAuth(user),

    patients: async (_, __, { user }) => {
      requireRole(user, 'DOCTOR');
      const patients = await prisma.patient.findMany({ include: { user: true } });
      return patients.map(toISO);
    },

    doctors: async (_, __, { user }) => {
      requireAuth(user);
      const doctors = await prisma.doctor.findMany({ include: { user: true } });
      return doctors.map(toISO);
    },

    myPatients: async (_, __, { user }) => {
      requireRole(user, 'DOCTOR');
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.id }
      });
      if (!doctor) throw new Error('Doctor not found');

      const approvedAccess = await prisma.accessRequest.findMany({
        where: { doctorId: doctor.id, status: 'APPROVED' },
        include: { patient: { include: { user: true } } }
      });

      return approvedAccess.map(req => toISO(req.patient));
    },

    myRecords: async (_, __, { user }) => {
      requireRole(user, 'PATIENT');
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        include: {
          records: {
            include: { doctor: { include: { user: true } } }
          }
        }
      });
      return (patient?.records || []).map(toISO);
    },

    accessRequests: async (_, __, { user }) => {
      requireRole(user, 'DOCTOR');
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.id },
        include: {
          accessRequests: {
            include: { patient: { include: { user: true } } }
          }
        }
      });
      return (doctor?.accessRequests || []).map(toISO);
    },

    pendingRequests: async (_, __, { user }) => {
      requireRole(user, 'PATIENT');
      const patient = await prisma.patient.findUnique({
        where: { userId: user.id },
        include: {
          accessRequests: {
            where: { status: 'PENDING' },
            include: { doctor: { include: { user: true } } }
          }
        }
      });
      return (patient?.accessRequests || []).map(toISO);
    },

    patientRecords: async (_, { patientId }, { user }) => {
      requireRole(user, 'DOCTOR');
      const records = await prisma.record.findMany({
        where: { patientId },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });
      return records.map(toISO);
    },
    canCreateRecord: async (_, { patientId }, { user }) => {
      console.log("🔍 user in canCreateRecord:", user);
      requireRole(user, 'DOCTOR');
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: { userId: user.id }
        });
      }
      const access = await prisma.accessRequest.findFirst({
        where: {
          doctorId: doctor.id,
          patientId,
          status: 'APPROVED'
        }
      });
      return !!access;
    },
},
  Mutation: {
    createUser: async (_, { input }) => {
      const { doctorData, patientData, ...base } = input;
      const newUser = await prisma.user.create({
        data: {
          ...base,
          Doctor: base.role === 'DOCTOR' ? { create: doctorData } : undefined,
          Patient: base.role === 'PATIENT' ? { create: patientData } : undefined
        }
      });
      return toISO(newUser);
    },
    

    updateProfile: async (_, { input }, { user }) => {
      requireAuth(user);
      const updates = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.avatar !== undefined) updates.avatar = input.avatar;

      if (user.role === 'DOCTOR' && input.doctorData) {
        await prisma.doctor.update({ where: { userId: user.id }, data: input.doctorData });
      }
      if (user.role === 'PATIENT' && input.patientData) {
        await prisma.patient.update({ where: { userId: user.id }, data: input.patientData });
      }

      const updatedUser = await prisma.user.update({ where: { id: user.id }, data: updates });
      return toISO(updatedUser);
    },

    createAccessRequest: async (_, { input }, { user }) => {
      requireRole(user, 'DOCTOR');
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });

      const req = await prisma.accessRequest.create({
        data: {
          doctorId: doctor.id,
          patientId: input.patientId,
          reason: input.reason,
          message: input.message
        }
      });
      return toISO(req);
    },

    updateAccessRequest: async (_, { input }, { user }) => {
      requireRole(user, 'PATIENT');
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: input.id }
      });

      if (!accessRequest) throw new Error('Access request not found');

      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (accessRequest.patientId !== patient.id) throw new Error('Access denied');

      const updated = await prisma.accessRequest.update({
        where: { id: input.id },
        data: { status: input.status }
      });

      return toISO(updated);
    },

    createRecord: async (_, { input }, { user }) => {
      requireRole(user, 'DOCTOR');
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: { userId: user.id }
        });
      }
      const access = await prisma.accessRequest.findFirst({
        where: {
          doctorId: doctor.id,
          patientId: input.patientId,
          status: 'APPROVED'
        }
      });
      if (!access) {
        throw new Error('Access denied: Doctor does not have approved access to this patient.');
      }
      const record = await prisma.record.create({
        data: {
          title: input.title,
          content: input.content,
          diagnosis: input.diagnosis,
          treatment: input.treatment,
          medications: input.medications,
          notes: input.notes,
          patientId: input.patientId,
          doctorId: doctor.id
        },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });
      return toISO(record);
},


    updateRecord: async (_, { input }, { user }) => {
      requireAuth(user);
      const record = await prisma.record.findUnique({ where: { id: input.id } });
      if (!record) throw new Error('Record not found');

      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });

      if (user.role === 'PATIENT') {
        if (record.patientId !== patient.id) throw new Error('Access denied');
      }

      if (user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: user.id },
          include: { patients: true }
        });
        const hasAccess = doctor.patients.some(p => p.id === record.patientId);
        if (!hasAccess) throw new Error('Access denied');
      }

      const updateData = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.diagnosis !== undefined) updateData.diagnosis = input.diagnosis;
      if (input.treatment !== undefined) updateData.treatment = input.treatment;
      if (input.medications !== undefined) updateData.medications = input.medications;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const updated = await prisma.record.update({ where: { id: input.id }, data: updateData });
      return toISO(updated);
    },

    deleteRecord: async (_, { id }, { user }) => {
      requireAuth(user);
      const record = await prisma.record.findUnique({ where: { id } });
      if (!record) throw new Error('Record not found');

      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });

      if (user.role === 'PATIENT' && record.patientId !== patient.id)
        throw new Error('Access denied');

      if (user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: user.id },
          include: { patients: true }
        });
        const hasAccess = doctor.patients.some(p => p.id === record.patientId);
        if (!hasAccess) throw new Error('Access denied');
      }

      await prisma.record.delete({ where: { id } });
      return true;
    },

    setUserRole: async (_, { role, data }, { user }) => {
      requireAuth(user);
      if (!['DOCTOR', 'PATIENT'].includes(role)) throw new Error('Invalid role');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role,
          Doctor: role === 'DOCTOR' ? { create: data } : undefined,
          Patient: role === 'PATIENT' ? { create: data } : undefined
        }
      });

      return true;
    }
  }
};
