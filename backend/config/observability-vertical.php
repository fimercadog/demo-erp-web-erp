<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Extensiones por Vertical - Clínica Veterinaria
    |--------------------------------------------------------------------------
    */

    'additional_sensitive_fields' => [
        'pet_medical_history',
        'clinical_notes',
        'vet_prescriptions',
        'owner_national_id',
        'owner_contact_details',
    ],

    'custom_events' => [
        'patient_registered' => true,
        'prescription_issued' => true,
    ],

    'module_name' => 'clinica_veterinaria',

];
