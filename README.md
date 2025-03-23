# Hospital Roster Scheduling Application

A web-based application for managing hospital staff schedules, considering various shift types, staff wishes, and scheduling constraints.

## Features

- Manage different shift types (HD, ICU, Transplant, On-call, etc.)
- Track staff availability, absences, and vacation days
- Allow staff to submit shift preferences/wishes
- Import wishes via Excel spreadsheet
- Generate optimal schedules based on constraints
- Visual schedule display with color-coding
- Track schedule violations (e.g., overwork, consecutive shifts)
- Support for scheduling rules:
  - Maximum 2 weekends per month per staff
  - Maximum 4 HD shifts per month per staff
  - Next day off after night shifts
  - Special handling for transplant and on-call shifts

## Shift Types

| Shift Type | Hours | Description |
|------------|-------|-------------|
| HD | 09:00-09:00 (24h) | HD shift with next day off |
| ICU Morning | 07:00-17:00 | ICU morning shift |
| ICU Midday | 12:00-22:00 | ICU midday shift |
| ICU Night | 21:30-08:00 | ICU night shift with next day off |
| Rufdienst | 11:00-08:00 | On-call from morning 11 to 8 pm, then on-call until 7 am |
| OA | 12:00-20:00 | OA shift on-site and then on-call |
| Transplant Implant | 07:00-07:00 (24h) | Transplant implant shift |
| Transplant Explant 1 | 07:00-07:00 (24h) | First transplant explant shift |
| Transplant Explant 2 | 07:00-07:00 (24h) | Second transplant explant shift |

## Installation

1. Clone the repository:
```
git clone [repository-url]
cd roster_app
```

2. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Run the application:
```
python backend/server.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Uploading Wishes via Excel

The application supports uploading staff wishes via Excel spreadsheet. The spreadsheet should have the following columns:
- Staff ID
- Date
- Shift
- Priority (High/Medium/Low)
- Notes (optional)

A template can be downloaded from the Wishes page.

## Development

### Frontend
The frontend is built with HTML, CSS, and JavaScript, using Bootstrap for styling.

### Backend
The backend is built with Flask, a Python web framework.

### Data Storage
The application uses JSON files for data storage. In a production environment, this should be replaced with a database.

## License

This project is licensed under the MIT License - see the LICENSE file for details.