import { z } from "zod";

export const studentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  rollNo: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  guardianRelation: z.string().optional(),
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  role: z.enum(["VICE_ADMIN", "TEACHER", "ACCOUNTANT"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  joiningDate: z.string().optional(),
});

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().optional(),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().min(1).max(200).default(40),
});

export const batchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  capacity: z.coerce.number().min(1).max(200).default(30),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  days: z.string().optional(),
  facultyId: z.string().optional(),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
});

export const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  type: z.enum(["UNIT_TEST", "MID_TERM", "FINAL", "MOCK_TEST", "WEEKLY_TEST", "PRACTICE"]),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const examSubjectSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  examDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxMarks: z.coerce.number().min(1, "Max marks must be at least 1").max(1000),
  passingMarks: z.coerce.number().min(0, "Passing marks must be 0 or more"),
});

export const createExamSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  type: z.enum(["UNIT_TEST", "MID_TERM", "FINAL", "MOCK_TEST", "WEEKLY_TEST", "PRACTICE"]),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subjects: z.array(examSubjectSchema).min(1, "At least one subject is required"),
});

export const markEntrySchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  marksObtained: z.coerce.number().min(0, "Marks cannot be negative"),
  remarks: z.string().optional(),
});

export const saveMarksSchema = z.object({
  examSubjectId: z.string().min(1, "Exam subject is required"),
  marks: z.array(markEntrySchema).min(1, "At least one mark entry is required"),
});

export const homeworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

export const feeStructureSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  frequency: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  dueDay: z.coerce.number().min(1).max(28).default(1),
  lateFee: z.coerce.number().min(0).default(0),
  academicYearId: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feePaymentIds: z.array(z.string()).min(1, "Select at least one fee to pay"),
  amountPaying: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  discount: z.coerce.number().min(0).default(0),
  discountReason: z.string().optional(),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"]),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

export const generateFeesSchema = z.object({
  feeStructureId: z.string().min(1, "Fee structure is required"),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).max(2100).optional(),
});

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["ANNOUNCEMENT", "FEE_REMINDER", "ATTENDANCE_ALERT", "EXAM_SCHEDULE", "HOMEWORK", "GENERAL"]).default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetRoles: z.array(z.string()).optional(),
  targetClassId: z.string().optional(),
  targetBatchId: z.string().optional(),
});

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED"]),
  remarks: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  classId: z.string().optional(),
  batchId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  records: z.array(attendanceRecordSchema).min(1, "At least one record is required"),
});

export const timetableEntrySchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  dayOfWeek: z.coerce.number().min(1).max(7),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().optional(),
});

export const saveTimetableSchema = z.object({
  classId: z.string().optional(),
  batchId: z.string().optional(),
  entries: z.array(timetableEntrySchema),
});

export type StudentInput = z.infer<typeof studentSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type ExamSubjectInput = z.infer<typeof examSubjectSchema>;
export type MarkEntryInput = z.infer<typeof markEntrySchema>;
export type SaveMarksInput = z.infer<typeof saveMarksSchema>;
export type HomeworkInput = z.infer<typeof homeworkSchema>;
export type FeeStructureInput = z.infer<typeof feeStructureSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type GenerateFeesInput = z.infer<typeof generateFeesSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type TimetableEntryInput = z.infer<typeof timetableEntrySchema>;
export type SaveTimetableInput = z.infer<typeof saveTimetableSchema>;

// ==================== WhatsApp Schemas ====================

export const whatsAppSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  sendFeeReminders: z.boolean().optional(),
  sendAttendanceAlerts: z.boolean().optional(),
  sendEventNotifications: z.boolean().optional(),
  sendResultNotifications: z.boolean().optional(),
  sendLibraryReminders: z.boolean().optional(),
  dailyLimit: z.coerce.number().min(0).max(5000).optional(),
  defaultCountryCode: z.string().min(1).max(5).optional(),
});

export const whatsAppNotificationSchema = z.object({
  templateName: z.string().min(1, "Template is required"),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(1000),
  targetType: z.enum(["ALL", "CLASS", "BATCH", "ROLE"]),
  targetClassId: z.string().optional(),
  targetBatchId: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
});

export type WhatsAppSettingsInput = z.infer<typeof whatsAppSettingsSchema>;
export type WhatsAppNotificationInput = z.infer<typeof whatsAppNotificationSchema>;
