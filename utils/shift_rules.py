"""
Shift rules and constraints for hospital roster scheduling
"""

# Shift definitions with rules
SHIFT_DEFINITIONS = {
    'HD': {
        'name': 'HD Shift',
        'start': '09:00',
        'end': '09:00',
        'duration_hours': 24,
        'next_day_off': True,
        'monthly_limit': 4,
        'description': 'HD shift from 9:00 to 9:00 the next day'
    },
    'ICU_morning': {
        'name': 'ICU Morning',
        'start': '07:00',
        'end': '17:00',
        'duration_hours': 10,
        'next_day_off': False,
        'description': 'ICU morning shift from 7:00 to 17:00'
    },
    'ICU_midday': {
        'name': 'ICU Midday',
        'start': '12:00',
        'end': '22:00',
        'duration_hours': 10,
        'next_day_off': False,
        'description': 'ICU midday shift from 12:00 to 22:00'
    },
    'ICU_night': {
        'name': 'ICU Night',
        'start': '21:30',
        'end': '08:00',
        'duration_hours': 10.5,
        'next_day_off': True,
        'description': 'ICU night shift from 21:30 to 8:00 the next day (that day is free)'
    },
    'Rufdienst': {
        'name': 'Rufdienst',
        'start': '11:00',
        'end': '08:00',
        'duration_hours': 21,
        'on_call': True,
        'consecutive_weekend_only': True,
        'next_day_off': False,
        'description': 'On-call shift from 11:00 to 20:00 on-site, then on-call until 7:00 next day'
    },
    'OA': {
        'name': 'OA Shift',
        'start': '12:00',
        'end': '20:00',
        'duration_hours': 8,
        'on_call': True,
        'next_day_off': False,
        'description': 'OA shift from 12:00 to 20:00 on-site, then on-call'
    },
    'Transplant_implant': {
        'name': 'Transplant Implant',
        'start': '07:00',
        'end': '07:00',
        'duration_hours': 24,
        'on_call': True,
        'next_day_off': True,
        'description': 'Transplant implant shift from 7:00 to 7:00 next day, on-call at night'
    },
    'Transplant_explant_1': {
        'name': 'Transplant Explant 1',
        'start': '07:00',
        'end': '07:00',
        'duration_hours': 24,
        'on_call': True,
        'next_day_off': True,
        'description': 'First transplant explant shift from 7:00 to 7:00 next day, on-call at night'
    },
    'Transplant_explant_2': {
        'name': 'Transplant Explant 2',
        'start': '07:00',
        'end': '07:00',
        'duration_hours': 24,
        'on_call': True,
        'next_day_off': True,
        'description': 'Second transplant explant shift from 7:00 to 7:00 next day, on-call at night'
    }
}

# General rules
SCHEDULING_RULES = {
    'max_weekends_per_month': 2,  # Maximum 2 weekends per month per person
    'max_hd_shifts_per_month': 4,  # Maximum 4 HD shifts per month per person
    'consecutive_transplant_shifts_allowed': True,  # Possible to have transplant shifts on consecutive days
    'consecutive_rufdienst_weekend_only': True,  # Rufdienst is only consecutive on weekends
    'min_rest_hours': 11,  # Minimum rest hours between shifts
}

def get_shift_types():
    """Returns a list of available shift types"""
    return list(SHIFT_DEFINITIONS.keys())

def get_shift_info(shift_type):
    """Returns information about a specific shift type"""
    return SHIFT_DEFINITIONS.get(shift_type, None)

def get_all_shift_info():
    """Returns information about all shift types"""
    return SHIFT_DEFINITIONS

def get_scheduling_rules():
    """Returns all scheduling rules"""
    return SCHEDULING_RULES