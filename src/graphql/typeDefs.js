const { gql } = require('graphql-tag');

module.exports = gql`
  scalar JSON

  type User {
    id: ID!
    email: String!
    name: String
    role: Role!
    auth0Id: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
    Doctor: Doctor
    Patient: Patient
  }

  type Doctor {
    id: ID!
    userId: ID!
    user: User!
    specialization: String
    licenseNumber: String
    hospital: String
    patients: [Patient!]!
    accessRequests: [AccessRequest!]!
    createdAt: String!
    updatedAt: String!
  }

  type Patient {
    id: ID!
    userId: ID!
    user: User!
    ethereumAddress: String
    dateOfBirth: String
    phoneNumber: String
    address: String
    emergencyContact: String
    bloodType: String
    allergies: String
    doctors: [Doctor!]!
    records: [Record!]!
    accessRequests: [AccessRequest!]!
    createdAt: String!
    updatedAt: String!
  }
  enum SyncStatus {
    PENDING
    SYNCED
    FAILED
  }

  type Record {
    id: ID!
    title: String!
    cid: String!
    blockchainTx: String    
    syncStatus: SyncStatus 
    diagnosis: String
    treatment: String
    medications: String
    notes: String
    patientId: ID!
    patient: Patient!
    doctor: Doctor!
    createdAt: String!
    updatedAt: String!
  }

  type AccessRequest {
    id: ID!
    doctorId: ID!
    patientId: ID!
    status: RequestStatus!
    reason: String
    message: String
    doctor: Doctor!
    patient: Patient!
    createdAt: String!
    updatedAt: String!
  }

  enum Role {
    UNASSIGNED
    DOCTOR
    PATIENT
    ADMIN
  }

  enum RequestStatus {
    PENDING
    APPROVED
    DENIED
  }

  type Query {
    me: User
    patients: [Patient!]!
    doctors: [Doctor!]!
    myPatients: [Patient!]!
    myRecords: [Record!]!
    accessRequests: [AccessRequest!]!
    pendingRequests: [AccessRequest!]!
    patientRecords(patientId: ID!): [Record!]!
    canCreateRecord(patientId: ID!): Boolean!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateProfile(input: UpdateProfileInput!): User!
    createAccessRequest(input: CreateAccessRequestInput!): AccessRequest!
    updateAccessRequest(input: UpdateAccessRequestInput!): AccessRequest!
    createRecord(input: CreateRecordInput!): Record!
    updateRecord(input: UpdateRecordInput!): Record!
    deleteRecord(id: ID!): Boolean!
    setUserRole(role: Role!, data: JSON): Boolean!
    updateEthereumAddress(ethereumAddress: String!): Patient!
  }

  input CreateUserInput {
    email: String!
    name: String!
    role: Role!
    auth0Id: String!
    avatar: String
    doctorData: DoctorInput
    patientData: PatientInput
  }

  input UpdateProfileInput {
    name: String
    avatar: String
    doctorData: DoctorInput
    patientData: PatientInput
  }

  input DoctorInput {
    specialization: String
    licenseNumber: String
    hospital: String
  }

  input PatientInput {
    ethereumAddress: String!
    dateOfBirth: String
    phoneNumber: String
    address: String
    emergencyContact: String
    bloodType: String
    allergies: String
  }

  input CreateAccessRequestInput {
    patientId: ID!
    reason: String
    message: String
  }

  input UpdateAccessRequestInput {
    id: ID!
    status: RequestStatus!
  }

  input CreateRecordInput {
    title: String!
    content: String!
    diagnosis: String
    treatment: String
    medications: String
    notes: String
    patientId: ID!
  }

  input UpdateRecordInput {
    id: ID!
    title: String
    content: String
    diagnosis: String
    treatment: String
    medications: String
    notes: String
  }
`;
