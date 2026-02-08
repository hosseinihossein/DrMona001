import { Routes } from "@angular/router";
import { PatientProfile } from "./patient-profile/patient-profile";
import { authGuard } from "../identity/auth-guard";
import { patientAdminGuard } from "./admin/patient-admin-guard";
import { NewPatientForm } from "./admin/new-patient-form/new-patient-form";
import { PatientList } from "./admin/patient-list/patient-list";
import { PatientProfileSettings } from "./admin/patient-profile-settings/patient-profile-settings";

export const patientRoutes: Routes = [
    {path: "patient-profile/:patientGuid", component:PatientProfile, canActivate: [authGuard]},
    {path: "patient-profile-settings/:patientGuid", component:PatientProfileSettings, canActivate: [patientAdminGuard]},
    {path: "new-patient", component:NewPatientForm, canActivate: [patientAdminGuard]},
    {path: "patient-list", component:PatientList, canActivate: [patientAdminGuard]},
];