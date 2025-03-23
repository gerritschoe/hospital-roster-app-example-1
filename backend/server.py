from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Data storage (in a real app, use a database)
SCHEDULES_FILE = 'data/schedules.json'
STAFF_FILE = 'data/staff.json'
ABSENCES_FILE = 'data/absences.json'
WISHES_FILE = 'data/wishes.json'

# Create data directory
os.makedirs('data', exist_ok=True)
print(f"Data directory: {os.path.abspath('data')}")

# Initialize files if they don't exist
if not os.path.exists(SCHEDULES_FILE):
    print(f"Creating {SCHEDULES_FILE}...")
    with open(SCHEDULES_FILE, 'w') as f:
        json.dump({}, f)
else:
    print(f"{SCHEDULES_FILE} already exists")

if not os.path.exists(STAFF_FILE):
    print(f"Creating {STAFF_FILE}...")
    with open(STAFF_FILE, 'w') as f:
        json.dump([], f)
else:
    print(f"{STAFF_FILE} already exists")
        
if not os.path.exists(ABSENCES_FILE):
    print(f"Creating {ABSENCES_FILE}...")
    with open(ABSENCES_FILE, 'w') as f:
        json.dump([], f)
else:
    print(f"{ABSENCES_FILE} already exists")
        
if not os.path.exists(WISHES_FILE):
    print(f"Creating {WISHES_FILE}...")
    with open(WISHES_FILE, 'w') as f:
        json.dump([], f)
else:
    print(f"{WISHES_FILE} already exists")

# Shift definitions
SHIFTS = {
    'HD': {'start': '09:00', 'end': '09:00', 'duration': 24, 'next_day_off': True, 'monthly_limit': 4},
    'ICU_morning': {
        'start': '07:00', 
        'end': '17:00', 
        'duration': 10, 
        'next_day_off': False, 
        'display_order': 1,
        'consecutive_days': 5,    # One person should do mornings for a full week
        'weekend_available': True  # Available on weekends
    },
    'ICU_midday': {
        'start': '12:00', 
        'end': '22:00', 
        'duration': 10, 
        'next_day_off': False, 
        'display_order': 2,
        'consecutive_days': 5,    # One person should do midday for a full week
        'weekend_available': False # Not available on weekends
    },
    'ICU_night': {
        'start': '21:30', 
        'end': '08:00', 
        'duration': 10.5, 
        'next_day_off': True, 
        'display_order': 3,
        'consecutive_days': 3,    # Person should do 3-4 consecutive night shifts
        'min_consecutive': 3,
        'max_consecutive': 4,
        'weekend_available': True  # Available on weekends
    },
    'Rufdienst': {
        'start': '11:00', 
        'end': '08:00', 
        'duration': 21, 
        'next_day_off': False, 
        'on_call': True, 
        'consecutive_weekend_only': True,  # Only on weekends
        'weekend_pair': True  # Should be assigned to same person for both weekend days
    },
    'OA': {
        'start': '12:00', 
        'end': '20:00', 
        'duration': 8, 
        'next_day_off': False, 
        'on_call': True,
        'weekend_pair': True  # Should be assigned to same person for both weekend days
    },
    'Transplant_implant': {
        'start': '07:00', 
        'end': '07:00', 
        'duration': 24, 
        'next_day_off': True, 
        'on_call': True,
        'weekend_block': True,  # Friday to Sunday block
        'weekend_block_start': 'Friday'
    },
    'Transplant_explant_1': {
        'start': '07:00', 
        'end': '07:00', 
        'duration': 24, 
        'next_day_off': True, 
        'on_call': True,
        'weekend_block': True,  # Friday to Sunday block
        'weekend_block_start': 'Friday'
    },
    'Transplant_explant_2': {
        'start': '07:00', 
        'end': '07:00', 
        'duration': 24, 
        'next_day_off': True, 
        'on_call': True,
        'weekend_block': True,  # Friday to Sunday block
        'weekend_block_start': 'Friday'
    }
}

# API routes
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/shifts', methods=['GET'])
def get_shifts():
    return jsonify(SHIFTS)

@app.route('/api/staff', methods=['GET', 'POST'])
def staff():
    if request.method == 'GET':
        with open(STAFF_FILE, 'r') as f:
            staff_list = json.load(f)
        return jsonify(staff_list)
    else:
        data = request.json
        with open(STAFF_FILE, 'w') as f:
            json.dump(data, f)
        return jsonify({"status": "success"})

@app.route('/api/absences', methods=['GET', 'POST'])
def absences():
    if request.method == 'GET':
        with open(ABSENCES_FILE, 'r') as f:
            absences_list = json.load(f)
        return jsonify(absences_list)
    else:
        data = request.json
        with open(ABSENCES_FILE, 'w') as f:
            json.dump(data, f)
        return jsonify({"status": "success"})

@app.route('/api/wishes', methods=['GET', 'POST'])
def wishes():
    if request.method == 'GET':
        with open(WISHES_FILE, 'r') as f:
            wishes_list = json.load(f)
        return jsonify(wishes_list)
    else:
        data = request.json
        with open(WISHES_FILE, 'w') as f:
            json.dump(data, f)
        return jsonify({"status": "success"})

@app.route('/api/upload/wishes', methods=['POST'])
def upload_wishes():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith(('.xls', '.xlsx')):
        try:
            df = pd.read_excel(file)
            wishes_data = df.to_dict(orient='records')
            
            with open(WISHES_FILE, 'w') as f:
                json.dump(wishes_data, f)
                
            return jsonify({"status": "success", "message": "Wishes uploaded successfully"})
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/schedule', methods=['GET', 'POST'])
def schedule():
    if request.method == 'GET':
        month = request.args.get('month')
        year = request.args.get('year')
        
        if not month or not year:
            return jsonify({"error": "Month and year are required"}), 400
            
        schedule_key = f"{year}-{month}"
        
        with open(SCHEDULES_FILE, 'r') as f:
            schedules = json.load(f)
            
        if schedule_key in schedules:
            return jsonify(schedules[schedule_key])
        else:
            return jsonify([])
    else:
        data = request.json
        month = data.get('month')
        year = data.get('year')
        schedule_data = data.get('schedule')
        
        if not month or not year or not schedule_data:
            return jsonify({"error": "Month, year and schedule data are required"}), 400
            
        schedule_key = f"{year}-{month}"
        
        with open(SCHEDULES_FILE, 'r') as f:
            schedules = json.load(f)
        
        schedules[schedule_key] = schedule_data
        
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f)
            
        return jsonify({"status": "success"})

@app.route('/api/generate-schedule', methods=['POST'])
def generate_schedule():
    data = request.json
    month = data.get('month')
    year = data.get('year')
    
    if not month or not year:
        return jsonify({"error": "Month and year are required"}), 400
        
    # Load data
    with open(STAFF_FILE, 'r') as f:
        staff_list = json.load(f)
        
    with open(ABSENCES_FILE, 'r') as f:
        absences_list = json.load(f)
        
    with open(WISHES_FILE, 'r') as f:
        wishes_list = json.load(f)
    
    # Generate schedule based on constraints and preferences
    schedule = generate_optimal_schedule(int(month), int(year), staff_list, absences_list, wishes_list)
    
    # Save the generated schedule
    schedule_key = f"{year}-{month}"
    with open(SCHEDULES_FILE, 'r') as f:
        schedules = json.load(f)
    
    schedules[schedule_key] = schedule
    
    with open(SCHEDULES_FILE, 'w') as f:
        json.dump(schedules, f)
        
    return jsonify({"status": "success", "schedule": schedule})

def generate_optimal_schedule(month, year, staff, absences, wishes):
    """
    Generate an optimal schedule considering all constraints and wishes.
    This is an enhanced version with additional shift rules.
    """
    # Create a calendar for the month
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month + 1, 1) - timedelta(days=1)
    
    num_days = (last_day - first_day).days + 1
    
    # Initialize empty schedule
    schedule = []
    for day in range(1, num_days + 1):
        date = datetime(year, month, day).strftime("%Y-%m-%d")
        daily_schedule = {
            "date": date,
            "day": day,
            "weekday": datetime(year, month, day).strftime("%A"),
            "shifts": {}
        }
        
        # Initialize shifts
        for shift_name in SHIFTS:
            # Skip ICU_midday on weekends
            if shift_name == 'ICU_midday' and daily_schedule["weekday"] in ["Saturday", "Sunday"]:
                daily_schedule["shifts"][shift_name] = {"assigned": None, "notes": "Not scheduled on weekends"}
            else:
                daily_schedule["shifts"][shift_name] = {"assigned": None, "notes": ""}
        
        schedule.append(daily_schedule)
    
    # Staff availability (excluding absences)
    available_staff = {s["id"]: s["name"] for s in staff}
    
    # Map absences by date
    absences_by_date = {}
    for absence in absences:
        start_date = datetime.strptime(absence["start_date"], "%Y-%m-%d")
        end_date = datetime.strptime(absence["end_date"], "%Y-%m-%d")
        delta = end_date - start_date
        
        for i in range(delta.days + 1):
            current_date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            if current_date not in absences_by_date:
                absences_by_date[current_date] = []
            absences_by_date[current_date].append(absence["staff_id"])
    
    # Map wishes by date and shift
    wishes_by_date = {}
    for wish in wishes:
        date = wish["date"]
        if date not in wishes_by_date:
            wishes_by_date[date] = {}
        
        shift = wish["shift"]
        if shift not in wishes_by_date[date]:
            wishes_by_date[date][shift] = []
            
        wishes_by_date[date][shift].append(wish["staff_id"])
    
    # Track staff assignments for constraints
    staff_assignments = {
        staff_id: {
            "weekends": 0, 
            "HD_count": 0, 
            "last_shift": None,
            "shift_streaks": {},  # Track consecutive days for each shift type
            "assigned_shifts": []  # Track all assigned shifts for this staff
        } for staff_id in available_staff
    }
    
    # Create a specialized assignment function for shift series
    def assign_shift_series(staff_id, shift_type, start_day_idx, num_days):
        """Assign a series of consecutive shifts to a staff member"""
        for i in range(num_days):
            if start_day_idx + i >= len(schedule):
                break  # Don't go beyond the month
                
            day_to_assign = schedule[start_day_idx + i]
            date_to_assign = day_to_assign["date"]
            is_weekend_day = day_to_assign["weekday"] in ["Saturday", "Sunday"]
            
            # Skip if staff is unavailable
            if staff_id in absences_by_date.get(date_to_assign, []):
                continue
                
            # Skip if the shift isn't available on weekends
            shift_info = SHIFTS[shift_type]
            if is_weekend_day and not shift_info.get('weekend_available', True):
                continue
            
            # Mark as assigned
            day_to_assign["shifts"][shift_type]["assigned"] = staff_id
            day_to_assign["shifts"][shift_type]["notes"] = f"Series assignment ({i+1}/{num_days})"
            
            # Update tracking
            staff_assignments[staff_id]["last_shift"] = {"date": date_to_assign, "shift": shift_type}
            staff_assignments[staff_id]["assigned_shifts"].append({"date": date_to_assign, "shift": shift_type})
            
            if is_weekend_day:
                staff_assignments[staff_id]["weekends"] += 1
            
            # Initialize or increment streak counter
            if shift_type not in staff_assignments[staff_id]["shift_streaks"]:
                staff_assignments[staff_id]["shift_streaks"][shift_type] = 0
            staff_assignments[staff_id]["shift_streaks"][shift_type] += 1
    
    # First, identify the weekend blocks for transplant shifts
    weekend_blocks = []
    for day_idx, day_schedule in enumerate(schedule):
        if day_schedule["weekday"] == "Friday":
            # Check if this starts a Friday-Sunday block
            if day_idx + 2 < len(schedule) and schedule[day_idx + 2]["weekday"] == "Sunday":
                weekend_blocks.append((day_idx, day_idx + 2))  # (start_idx, end_idx) inclusive
    
    # Assign Transplant shifts for weekend blocks (Friday-Sunday)
    for block_start, block_end in weekend_blocks:
        transplant_shifts = [shift for shift in SHIFTS if shift.startswith('Transplant_') and SHIFTS[shift].get('weekend_block', False)]
        
        for shift_name in transplant_shifts:
            # Find valid staff for this weekend block
            valid_staff = []
            for staff_id in available_staff:
                staff_member = next((s for s in staff if s["id"] == staff_id), None)
                
                # Check capabilities
                if staff_member and "capabilities" in staff_member and shift_name in staff_member["capabilities"]:
                    # Check not scheduled during the block days
                    is_available = True
                    for day_idx in range(block_start, block_end + 1):
                        date = schedule[day_idx]["date"]
                        if staff_id in absences_by_date.get(date, []):
                            is_available = False
                            break
                    
                    if is_available:
                        valid_staff.append(staff_id)
            
            # Assign if valid staff available
            if valid_staff:
                assigned_staff = valid_staff[0]  # Choose the first valid staff
                
                # Assign for all days in the block
                for day_idx in range(block_start, block_end + 1):
                    day_schedule = schedule[day_idx]
                    day_schedule["shifts"][shift_name]["assigned"] = assigned_staff
                    day_schedule["shifts"][shift_name]["notes"] = f"Weekend block assignment ({day_idx - block_start + 1}/3)"
                    
                    # Update staff assignments tracking
                    date = day_schedule["date"]
                    is_weekend = day_schedule["weekday"] in ["Saturday", "Sunday"]
                    
                    staff_assignments[assigned_staff]["last_shift"] = {"date": date, "shift": shift_name}
                    staff_assignments[assigned_staff]["assigned_shifts"].append({"date": date, "shift": shift_name})
                    
                    if is_weekend:
                        staff_assignments[assigned_staff]["weekends"] += 1
    
    # Process schedule by week (for ICU shifts that follow weekly patterns)
    for week_start in range(0, num_days, 7):
        week_end = min(week_start + 6, num_days - 1)
        
        # Assign ICU morning shifts for the week (one person for whole week)
        valid_morning_staff = []
        for staff_id in available_staff:
            staff_member = next((s for s in staff if s["id"] == staff_id), None)
            
            # Check capabilities
            if staff_member and "capabilities" in staff_member and "ICU_morning" in staff_member["capabilities"]:
                # Check availability for most of the week
                days_available = 0
                for day_idx in range(week_start, week_end + 1):
                    if day_idx < len(schedule):
                        date = schedule[day_idx]["date"]
                        if staff_id not in absences_by_date.get(date, []):
                            days_available += 1
                
                # Available for at least 4 days of the week
                if days_available >= 4:
                    valid_morning_staff.append(staff_id)
        
        if valid_morning_staff:
            assigned_staff = valid_morning_staff[0]
            for day_idx in range(week_start, week_end + 1):
                if day_idx < len(schedule):
                    day_schedule = schedule[day_idx]
                    date = day_schedule["date"]
                    weekday = day_schedule["weekday"]
                    
                    # Skip weekend if midday
                    if weekday in ["Saturday", "Sunday"] and not SHIFTS["ICU_morning"].get('weekend_available', True):
                        continue
                        
                    # Skip if staff is unavailable on this day
                    if assigned_staff in absences_by_date.get(date, []):
                        continue
                    
                    day_schedule["shifts"]["ICU_morning"]["assigned"] = assigned_staff
                    day_schedule["shifts"]["ICU_morning"]["notes"] = "Weekly assignment"
                    
                    # Update tracking
                    staff_assignments[assigned_staff]["last_shift"] = {"date": date, "shift": "ICU_morning"}
                    staff_assignments[assigned_staff]["assigned_shifts"].append({"date": date, "shift": "ICU_morning"})
                    
                    if weekday in ["Saturday", "Sunday"]:
                        staff_assignments[assigned_staff]["weekends"] += 1
        
        # Assign ICU midday shifts for the week (one person for whole week, weekdays only)
        valid_midday_staff = []
        for staff_id in available_staff:
            staff_member = next((s for s in staff if s["id"] == staff_id), None)
            
            if staff_member and "capabilities" in staff_member and "ICU_midday" in staff_member["capabilities"]:
                # Check availability for most weekdays
                days_available = 0
                for day_idx in range(week_start, week_end + 1):
                    if day_idx < len(schedule):
                        date = schedule[day_idx]["date"]
                        weekday = schedule[day_idx]["weekday"]
                        if weekday not in ["Saturday", "Sunday"] and staff_id not in absences_by_date.get(date, []):
                            days_available += 1
                
                # Available for at least 3 weekdays
                if days_available >= 3:
                    valid_midday_staff.append(staff_id)
        
        if valid_midday_staff:
            assigned_staff = valid_midday_staff[0]
            for day_idx in range(week_start, week_end + 1):
                if day_idx < len(schedule):
                    day_schedule = schedule[day_idx]
                    date = day_schedule["date"]
                    weekday = day_schedule["weekday"]
                    
                    # Skip weekends for midday shifts
                    if weekday in ["Saturday", "Sunday"]:
                        continue
                        
                    # Skip if staff is unavailable on this day
                    if assigned_staff in absences_by_date.get(date, []):
                        continue
                    
                    day_schedule["shifts"]["ICU_midday"]["assigned"] = assigned_staff
                    day_schedule["shifts"]["ICU_midday"]["notes"] = "Weekly assignment"
                    
                    # Update tracking
                    staff_assignments[assigned_staff]["last_shift"] = {"date": date, "shift": "ICU_midday"}
                    staff_assignments[assigned_staff]["assigned_shifts"].append({"date": date, "shift": "ICU_midday"})
    
    # Process night shifts in 3-4 day consecutive blocks
    day_idx = 0
    while day_idx < len(schedule):
        # Try to assign a 3-4 day block of ICU night shifts
        valid_night_staff = []
        for staff_id in available_staff:
            staff_member = next((s for s in staff if s["id"] == staff_id), None)
            
            if staff_member and "capabilities" in staff_member and "ICU_night" in staff_member["capabilities"]:
                # Check availability for 3-4 consecutive days
                max_consecutive = 0
                for block_size in [4, 3]:  # Try 4, then 3
                    if day_idx + block_size <= len(schedule):
                        is_available = True
                        for i in range(block_size):
                            date = schedule[day_idx + i]["date"]
                            if staff_id in absences_by_date.get(date, []):
                                is_available = False
                                break
                        
                        if is_available:
                            max_consecutive = block_size
                            break
                
                if max_consecutive >= 3:
                    valid_night_staff.append((staff_id, max_consecutive))
        
        if valid_night_staff:
            assigned_staff, block_size = valid_night_staff[0]
            
            # Assign the block
            for i in range(block_size):
                if day_idx + i < len(schedule):
                    day_schedule = schedule[day_idx + i]
                    date = day_schedule["date"]
                    weekday = day_schedule["weekday"]
                    
                    day_schedule["shifts"]["ICU_night"]["assigned"] = assigned_staff
                    day_schedule["shifts"]["ICU_night"]["notes"] = f"Block assignment ({i+1}/{block_size})"
                    
                    # Update tracking
                    staff_assignments[assigned_staff]["last_shift"] = {"date": date, "shift": "ICU_night"}
                    staff_assignments[assigned_staff]["assigned_shifts"].append({"date": date, "shift": "ICU_night"})
                    
                    if weekday in ["Saturday", "Sunday"]:
                        staff_assignments[assigned_staff]["weekends"] += 1
            
            # Move to the next block
            day_idx += block_size
        else:
            # If no valid staff for a block, just move ahead one day
            day_idx += 1
    
    # Assign weekend OA shifts (both Saturday and Sunday to the same person)
    for day_idx in range(len(schedule) - 1):
        if schedule[day_idx]["weekday"] == "Saturday" and schedule[day_idx + 1]["weekday"] == "Sunday":
            # Find valid staff for OA weekend pair
            valid_staff = []
            for staff_id in available_staff:
                staff_member = next((s for s in staff if s["id"] == staff_id), None)
                
                if staff_member and "capabilities" in staff_member and "OA" in staff_member["capabilities"]:
                    # Check availability for both Saturday and Sunday
                    saturday_date = schedule[day_idx]["date"]
                    sunday_date = schedule[day_idx + 1]["date"]
                    
                    if (staff_id not in absences_by_date.get(saturday_date, []) and 
                        staff_id not in absences_by_date.get(sunday_date, [])):
                        valid_staff.append(staff_id)
            
            if valid_staff:
                assigned_staff = valid_staff[0]
                
                # Assign Saturday
                schedule[day_idx]["shifts"]["OA"]["assigned"] = assigned_staff
                schedule[day_idx]["shifts"]["OA"]["notes"] = "Weekend pair (1/2)"
                
                # Assign Sunday
                schedule[day_idx + 1]["shifts"]["OA"]["assigned"] = assigned_staff
                schedule[day_idx + 1]["shifts"]["OA"]["notes"] = "Weekend pair (2/2)"
                
                # Update tracking
                staff_assignments[assigned_staff]["weekends"] += 1  # Count as one weekend
                staff_assignments[assigned_staff]["assigned_shifts"].append({"date": saturday_date, "shift": "OA"})
                staff_assignments[assigned_staff]["assigned_shifts"].append({"date": sunday_date, "shift": "OA"})
    
    # Assign Rufdienst for weekend pairs
    for day_idx in range(len(schedule) - 1):
        if schedule[day_idx]["weekday"] == "Saturday" and schedule[day_idx + 1]["weekday"] == "Sunday":
            # Find valid staff for Rufdienst weekend pair
            valid_staff = []
            for staff_id in available_staff:
                staff_member = next((s for s in staff if s["id"] == staff_id), None)
                
                if staff_member and "capabilities" in staff_member and "Rufdienst" in staff_member["capabilities"]:
                    # Check availability for both Saturday and Sunday
                    saturday_date = schedule[day_idx]["date"]
                    sunday_date = schedule[day_idx + 1]["date"]
                    
                    # Check if not already assigned to OA or other shifts on these days
                    already_assigned = False
                    for day in [schedule[day_idx], schedule[day_idx + 1]]:
                        for shift_name, shift_data in day["shifts"].items():
                            if shift_data["assigned"] == staff_id:
                                already_assigned = True
                                break
                    
                    if (not already_assigned and
                        staff_id not in absences_by_date.get(saturday_date, []) and 
                        staff_id not in absences_by_date.get(sunday_date, [])):
                        valid_staff.append(staff_id)
            
            if valid_staff:
                assigned_staff = valid_staff[0]
                
                # Assign Saturday
                schedule[day_idx]["shifts"]["Rufdienst"]["assigned"] = assigned_staff
                schedule[day_idx]["shifts"]["Rufdienst"]["notes"] = "Weekend pair (1/2)"
                
                # Assign Sunday
                schedule[day_idx + 1]["shifts"]["Rufdienst"]["assigned"] = assigned_staff
                schedule[day_idx + 1]["shifts"]["Rufdienst"]["notes"] = "Weekend pair (2/2)"
                
                # Update tracking
                staff_assignments[assigned_staff]["weekends"] += 1  # Count as one weekend
                staff_assignments[assigned_staff]["assigned_shifts"].append({"date": saturday_date, "shift": "Rufdienst"})
                staff_assignments[assigned_staff]["assigned_shifts"].append({"date": sunday_date, "shift": "Rufdienst"})
    
    # Fill in remaining shifts greedily
    for day_idx, day_schedule in enumerate(schedule):
        date = day_schedule["date"]
        is_weekend = day_schedule["weekday"] in ["Saturday", "Sunday"]
        
        # Get unavailable staff for this day
        unavailable_staff = absences_by_date.get(date, [])
        
        # Add staff who need a day off after night shifts
        for staff_id, data in staff_assignments.items():
            if data["last_shift"] and data["last_shift"]["date"] == (datetime.strptime(date, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d"):
                shift_info = SHIFTS[data["last_shift"]["shift"]]
                if shift_info.get("next_day_off", False):
                    unavailable_staff.append(staff_id)
        
        # Also add staff who are already assigned to shifts on this day
        for shift_name, shift_data in day_schedule["shifts"].items():
            if shift_data["assigned"]:
                unavailable_staff.append(shift_data["assigned"])
        
        # Assign remaining shifts based on wishes and constraints
        for shift_name in SHIFTS:
            # Skip if already assigned or if ICU_midday on weekend
            if day_schedule["shifts"][shift_name]["assigned"] is not None:
                continue
                
            if shift_name == "ICU_midday" and is_weekend:
                continue  # Skip ICU_midday on weekends
            
            # Get staff who wish for this shift
            wishlist = wishes_by_date.get(date, {}).get(shift_name, [])
            
            # Filter out unavailable staff
            wishlist = [staff_id for staff_id in wishlist if staff_id not in unavailable_staff]
            
            # Apply constraints
            valid_staff = []
            for staff_id in wishlist:
                staff_member = next((s for s in staff if s["id"] == staff_id), None)
                
                # Check if staff has the capability for this shift
                if staff_member and "capabilities" in staff_member:
                    if shift_name not in staff_member["capabilities"]:
                        continue
                
                # Check HD monthly limit
                if shift_name == "HD" and staff_assignments[staff_id]["HD_count"] >= SHIFTS["HD"]["monthly_limit"]:
                    continue
                
                # Check weekend constraint
                if is_weekend and staff_assignments[staff_id]["weekends"] >= 2:
                    continue
                
                valid_staff.append(staff_id)
            
            # If no valid staff with wishes, try other available staff
            if not valid_staff:
                for staff_id in available_staff:
                    if staff_id in unavailable_staff:
                        continue
                    
                    staff_member = next((s for s in staff if s["id"] == staff_id), None)
                    
                    # Check if staff has the capability for this shift
                    if staff_member and "capabilities" in staff_member:
                        if shift_name not in staff_member["capabilities"]:
                            continue
                    
                    # Apply the same constraints
                    if shift_name == "HD" and staff_assignments[staff_id]["HD_count"] >= SHIFTS["HD"]["monthly_limit"]:
                        continue
                    
                    if is_weekend and staff_assignments[staff_id]["weekends"] >= 2:
                        continue
                    
                    valid_staff.append(staff_id)
            
            # Assign shift if valid staff available
            if valid_staff:
                assigned_staff = valid_staff[0]  # Simple selection
                
                day_schedule["shifts"][shift_name]["assigned"] = assigned_staff
                day_schedule["shifts"][shift_name]["notes"] = "Assigned based on " + ("wish" if assigned_staff in wishlist else "availability")
                
                # Update staff assignments tracking
                staff_assignments[assigned_staff]["last_shift"] = {"date": date, "shift": shift_name}
                staff_assignments[assigned_staff]["assigned_shifts"].append({"date": date, "shift": shift_name})
                
                if is_weekend:
                    staff_assignments[assigned_staff]["weekends"] += 1
                
                if shift_name == "HD":
                    staff_assignments[assigned_staff]["HD_count"] += 1
                
                # Mark as unavailable for other shifts on the same day
                unavailable_staff.append(assigned_staff)
    
    return schedule

# Statistics and forecasting
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    year = request.args.get('year', default=datetime.now().year, type=int)
    month = request.args.get('month', default=None, type=int)
    
    # Load all schedules
    with open(SCHEDULES_FILE, 'r') as f:
        schedules = json.load(f)
        
    # Load staff
    with open(STAFF_FILE, 'r') as f:
        staff_list = json.load(f)
        
    # Create staff lookup
    staff_lookup = {s['id']: s for s in staff_list}
    
    # Initialize statistics
    statistics = {
        'staff': {},
        'shifts': {},
        'absences': {},
        'wishes_granted': {},
        'shift_distribution': {}
    }
    
    # Initialize stats for each staff member
    for staff in staff_list:
        staff_id = staff['id']
        statistics['staff'][staff_id] = {
            'name': staff['name'],
            'total_shifts': 0,
            'shifts_by_type': {},
            'absences': 0,
            'sick_days': 0,
            'vacation_days': 0,
            'weekends_worked': 0,
            'wishes_granted': 0,
            'required_shifts': staff.get('required_shifts', 0),
            'remaining_shifts': staff.get('required_shifts', 0)
        }
        
        # Initialize shifts by type
        for shift_type in SHIFTS:
            statistics['staff'][staff_id]['shifts_by_type'][shift_type] = 0
    
    # Process each schedule
    for schedule_key, schedule_data in schedules.items():
        # Extract year and month from key (format: "YYYY-MM")
        schedule_year, schedule_month = map(int, schedule_key.split('-'))
        
        # Filter by year and optionally by month
        if year == schedule_year and (month is None or month == schedule_month):
            process_schedule_for_statistics(schedule_data, statistics, staff_lookup)
    
    # Load absences
    with open(ABSENCES_FILE, 'r') as f:
        absences_list = json.load(f)
        
    # Process absences
    for absence in absences_list:
        staff_id = absence['staff_id']
        if staff_id in statistics['staff']:
            abs_type = absence['type']
            start = datetime.strptime(absence['start_date'], '%Y-%m-%d')
            end = datetime.strptime(absence['end_date'], '%Y-%m-%d')
            delta = (end - start).days + 1
            
            # Only count absences for the requested year/month
            if (month is None and start.year == year) or (month is not None and start.year == year and start.month == month):
                statistics['staff'][staff_id]['absences'] += delta
                
                if abs_type == 'sick':
                    statistics['staff'][staff_id]['sick_days'] += delta
                elif abs_type == 'vacation':
                    statistics['staff'][staff_id]['vacation_days'] += delta
    
    # Calculate remaining shifts
    for staff_id, stats in statistics['staff'].items():
        stats['remaining_shifts'] = max(0, stats['required_shifts'] - stats['total_shifts'])
    
    # Generate forecast
    forecast = generate_forecast(statistics, staff_list)
    
    return jsonify({
        'statistics': statistics,
        'forecast': forecast
    })

def process_schedule_for_statistics(schedule_data, statistics, staff_lookup):
    """Process a schedule to update statistics"""
    for day in schedule_data:
        is_weekend = day['weekday'] in ['Saturday', 'Sunday']
        
        for shift_name, shift_data in day['shifts'].items():
            if shift_data['assigned']:
                staff_id = shift_data['assigned']
                
                # Skip if staff doesn't exist in statistics
                if staff_id not in statistics['staff']:
                    continue
                
                # Update total shifts
                statistics['staff'][staff_id]['total_shifts'] += 1
                
                # Update shifts by type
                statistics['staff'][staff_id]['shifts_by_type'][shift_name] += 1
                
                # Update weekends worked
                if is_weekend:
                    statistics['staff'][staff_id]['weekends_worked'] += 1
                
                # Track if this was a granted wish
                is_wish = 'wish' in shift_data['notes'].lower()
                if is_wish:
                    statistics['staff'][staff_id]['wishes_granted'] += 1

def generate_forecast(statistics, staff_list):
    """Generate a forecast of future shifts needed"""
    forecast = {}
    
    for staff in staff_list:
        staff_id = staff['id']
        if staff_id in statistics['staff']:
            stats = statistics['staff'][staff_id]
            
            # Calculate shifts remaining
            remaining = max(0, staff.get('required_shifts', 0) - stats['total_shifts'])
            
            forecast[staff_id] = {
                'name': staff['name'],
                'remaining_shifts': remaining,
                'recommended_shifts': {}
            }
            
            # Generate recommended shift distribution based on capabilities
            capabilities = staff.get('capabilities', [])
            if capabilities and remaining > 0:
                # Simple distribution - evenly distribute remaining shifts among capabilities
                per_shift = remaining / len(capabilities)
                for shift in capabilities:
                    forecast[staff_id]['recommended_shifts'][shift] = round(per_shift)
    
    return forecast

@app.route('/api/calendar/<staff_id>', methods=['GET'])
def get_staff_calendar(staff_id):
    """Get a calendar view of shifts for a specific staff member"""
    year = request.args.get('year', default=datetime.now().year, type=int)
    month = request.args.get('month', default=None, type=int)
    
    # Load all schedules
    with open(SCHEDULES_FILE, 'r') as f:
        schedules = json.load(f)
    
    calendar_data = []
    
    # Process each schedule
    for schedule_key, schedule_data in schedules.items():
        # Extract year and month from key
        schedule_year, schedule_month = map(int, schedule_key.split('-'))
        
        # Filter by year and optionally by month
        if year == schedule_year and (month is None or month == schedule_month):
            # Extract shifts for this staff member
            for day in schedule_data:
                date = day['date']
                day_shifts = []
                
                for shift_name, shift_data in day['shifts'].items():
                    if shift_data['assigned'] == staff_id:
                        shift_info = SHIFTS.get(shift_name, {})
                        day_shifts.append({
                            'shift': shift_name,
                            'start': shift_info.get('start', ''),
                            'end': shift_info.get('end', ''),
                            'duration': shift_info.get('duration', 0),
                            'notes': shift_data['notes']
                        })
                
                if day_shifts:
                    calendar_data.append({
                        'date': date,
                        'weekday': day['weekday'],
                        'shifts': day_shifts
                    })
    
    # Load absences for this staff member
    with open(ABSENCES_FILE, 'r') as f:
        absences_list = json.load(f)
    
    absences_data = []
    for absence in absences_list:
        if absence['staff_id'] == staff_id:
            start = datetime.strptime(absence['start_date'], '%Y-%m-%d')
            end = datetime.strptime(absence['end_date'], '%Y-%m-%d')
            
            # Only include absences for the requested year/month
            if (month is None and start.year == year) or (month is not None and start.year == year and start.month == month):
                absences_data.append({
                    'type': absence['type'],
                    'start_date': absence['start_date'],
                    'end_date': absence['end_date'],
                    'status': absence['status']
                })
    
    return jsonify({
        'shifts': calendar_data,
        'absences': absences_data
    })

# Debug endpoint to check if the API is working
@app.route('/api/debug', methods=['GET'])
def debug():
    return jsonify({
        "status": "ok",
        "message": "API is running",
        "data_files": {
            "schedules": os.path.exists(SCHEDULES_FILE),
            "staff": os.path.exists(STAFF_FILE),
            "absences": os.path.exists(ABSENCES_FILE),
            "wishes": os.path.exists(WISHES_FILE)
        },
        "static_folder": app.static_folder,
        "static_url_path": app.static_url_path
    })

if __name__ == '__main__':
    print(f"Starting Flask app with static folder: {os.path.abspath(app.static_folder)}")
    app.run(debug=True, port=5000, host='0.0.0.0')