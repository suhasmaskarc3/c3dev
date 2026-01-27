import random
from datetime import date
from dateutil.relativedelta import relativedelta
import string
from collections import deque
import bisect


'''
    Seeded Random Object for Pseudo-Random Data Generation
'''
SEED = 42
_random = random.Random(SEED)

'''
    Utility Functions
'''

def _upsert_helper(array, Type, batch_size=1000):
    """
    Utility function to upsert mini-batches of data. This puts less pressure on the server and makes the data faster to ingest.

    Args:
        Type: An object representing a C3 Type.
        batch_size: The number of data points to ingest with each batch.
        
    Returns:
        None
    """

    start = 0

    # Loop through data unto all of it has been upserted
    while start < len(array):
        # Choose a mini-batch of the data containing batch_size number of examples
        mini_batch = array[start:start + batch_size]
        # Ingest the mini-batch onto that Type
        Type.upsertBatch(mini_batch)
        # Increase the index by batch_size amount and continue
        start += batch_size

'''
    Constants
'''
NUM_AIRCRAFTS = 500
NUM_BASES = 10
NUM_OPERATIONS = 5769
NUM_WORK_ORDERS = 14495
NUM_MAINTENANCE_RECORDS = 43552

START_DATE = date.today()
END_DATE = START_DATE + relativedelta(years=1)

'''
    Type Methods:

        1. Generate Base Data
        2. Generate Operation Data
        3. Generate Aircraft Data

        ** Generation must be done in this order to ensure that Bases and Aircrafts exist before Operations are generated.
        ** The data generation functions will not generate data if the data already exists.
'''
def createAllData(cls):
    ''' Generates all data for the project in the correct order '''
    res = []

    res.append(cls.createBaseData())
    res.append(cls.createOperationData())
    res.append(cls.createAircraftData())
    res.append(cls.createWorkOrderData())
    res.append(cls.createMaintenanceRecordData())

    return "\n".join(res)

def createBaseData(cls):
    ''' Generates data for NUM_BASES bases '''
    if c3.Base.fetchCount() == NUM_BASES:
        return "Base data already exists. Skipping data generation."

    def _generate_random_base_name(index):
        bases = [
            "Maxwell Ridge Air Force Base",
            "Falcon Crest Air Base",
            "Silverwood Air Reserve Station",
            "Redstone Plains AFB",
            "Thunder Valley Air Station",
            "Iron Mesa Air Base",
            "Clearwater Range AFB",
            "Eagle Harbor Air Station",
            "Black Canyon Air Reserve Base",
            "Glacier Point Air Station"
        ]

        return bases[index - 1] # subtract 1 since index starts at 1

    def _get_us_city_coordinates():
        # Major U.S. cities with their coordinates
        us_cities = [
            (37.7749, -122.4194),  # San Francisco, CA
            (34.0522, -118.2437),  # Los Angeles, CA
            (32.7157, -117.1611),  # San Diego, CA
            (33.4484, -112.0740),  # Phoenix, AZ
            (39.7392, -104.9903),  # Denver, CO
            (29.7604, -95.3698),   # Houston, TX
            (32.7767, -96.7970),   # Dallas, TX
            (29.4241, -98.4936),   # San Antonio, TX
            (41.8781, -87.6298),   # Chicago, IL
            (39.0997, -94.5786),   # Kansas City, MO
            (38.9072, -77.0369),   # Washington, DC
            (40.7128, -74.0060),   # New York, NY
            (42.3601, -71.0589),   # Boston, MA
            (33.7490, -84.3880),   # Atlanta, GA
            (25.7617, -80.1918),   # Miami, FL
        ]
        
        return us_cities

    us_city_coords = _get_us_city_coordinates()

    if NUM_BASES > len(us_city_coords):
        raise ValueError(f"{NUM_BASES} exceeds the amount of hard-coded locations in DataGenerator.createBaseData(). Please add more coordinate pairs or decrease NUM_BASES.")

    base_objs = []
    for i in range(1, NUM_BASES + 1):
        latitude, longitude = us_city_coords[i]

        base_objs.append({
            "id": f"BASE-{i}",
            "name": _generate_random_base_name(i),
            "latitude": latitude,
            "longitude": longitude,
        })

    _upsert_helper(base_objs, c3.Base)

    post_upsert_ct = c3.Base.fetchCount()

    if post_upsert_ct != NUM_BASES:
        return f"Warning: Expected to generate {NUM_BASES} Bases, but generated {post_upsert_ct}."

    return f"Generated {post_upsert_ct} Bases"

'''
    SortedList Class 
    A simple sorted list implementation using bisect for insertion.

    This class is used to manage a sorted list of aircrafts that are currently in use during operations.
    I wrote it manually to avoid having to modify the runtime to include an external library (sortedcontainers).
    It provides methods to add, remove, and access elements while maintaining order.
'''
class SortedList:
    def __init__(self, iterable=None):
        self._list = []
        if iterable is not None:
            for item in iterable:
                self.add(item)

    def add(self, value):
        """Insert value into the sorted list."""
        bisect.insort(self._list, value)

    def pop(self, index=-1):
        """Remove and return item at index."""
        return self._list.pop(index)

    def __len__(self):
        return len(self._list)

def createOperationData(cls):
    ''' Generates data for the num_operations operations '''

    if c3.Operation.fetchCount() == NUM_OPERATIONS:
        return "Operation data already exists. Skipping data generation."

    def _generate_random_description():
        description_map = ["Mission", "Training", "Test"]
            
        return _random.choice(description_map)

    def _generate_random_end_date(operation_start):
        return operation_start + relativedelta(days=_random.randint(0,15))
    
    def _generate_random_alerts():
        alerts = ["Engine Check", "Fuel Low", "Navigation System Fault", "Communication Error",
            "Landing Gear Issue", "Hydraulic System Warning", "Weather Alert", "Air Traffic Control Delay",
            "Security Alert", "Maintenance Required"]
        
        sample_size = _random.randint(0,5)

        if sample_size == 0:
            return []
        
        alerts = _random.sample(alerts, sample_size)

        return alerts
    
    def _generate_random_status():
        statuses = ["Planned", "In Progress", "Completed"]
        return _random.choice(statuses)
    
    def _generate_random_base():
        return f"BASE-{_random.randint(1, NUM_BASES)}"
    
    available_aircrafts = SortedList([f"AIRCRAFT-{i}" for i in range(1, NUM_AIRCRAFTS + 1)])

    aircrafts_in_use = deque()

    curr_date = START_DATE

    operation_objs = []
    while curr_date < END_DATE:
        # Free aircrafts whose operations have ended
        while aircrafts_in_use and aircrafts_in_use[0][1] <= curr_date:
            finished_aircraft_id, _ = aircrafts_in_use.popleft()
            available_aircrafts.add(finished_aircraft_id)
        
        num_objs_to_generate = _random.randint(1, 30)
        
        for _ in range(num_objs_to_generate):
            if len(available_aircrafts) == 0:
                break
            
            # Use sim_start as the operation start date
            operation_start = curr_date
            operation_end = _generate_random_end_date(operation_start)

            # Randomly select an aircraft from the available aircrafts
            aircraft_id = available_aircrafts.pop(_random.randint(0, len(available_aircrafts) - 1))
            
            aircrafts_in_use.append((aircraft_id, operation_end))

            operation_objs.append({
                "id": f"OPERATION-{len(operation_objs) + 1}",
                "aircraft": aircraft_id,
                "description": _generate_random_description(),
                "startDate": operation_start,
                "endDate": operation_end,
                "alerts": _generate_random_alerts(),
                "status": _generate_random_status(),
                "origin": _generate_random_base(),
                "destination": _generate_random_base()
            })

        # Move the simulation start date to the next day
        curr_date += relativedelta(days=1)

    _upsert_helper(operation_objs, c3.Operation)

    post_upsert_ct = c3.Operation.fetchCount()

    if post_upsert_ct != NUM_OPERATIONS:
        return f"Warning: Expected to generate {NUM_OPERATIONS} Operations, but generated {post_upsert_ct}."
    
    return f"Generated {post_upsert_ct} Operations"

def createAircraftData(cls):
    ''' Generates data for NUM_AIRCRAFTS aircrafts '''
    if c3.Aircraft.fetchCount() == NUM_AIRCRAFTS:
        return "Aircraft data already exists. Skipping data generation."
    
    if c3.Operation.fetchCount() != NUM_OPERATIONS:
        return "Operation data must be generated before Aircraft data. Please generate Operation data first."

    def _generate_random_registration_number():
        prefix = ["N"]
        numbers = [str(_random.randint(0,9)) for _ in range(3)]
        suffix = [_random.choice(string.ascii_uppercase) for _ in range(2)]

        reg_num = prefix + numbers + suffix
        reg_num_str = "".join(reg_num)
        return reg_num_str
    
    def _generate_random_model():
        models = ["F-16C", "F-16D", "C17-A", "C130-H", "C130-J", "KC135-R", "KC135-T"]

        return _random.choice(models)

    def _generate_random_date_within_range(start, end):
        delta = end - start
        random_days = _random.randint(0, delta.days)
        return start + relativedelta(days=random_days)
    
    def _get_last_aircraft_location(aircraft_id, last_aircraft_locs):
        if aircraft_id in last_aircraft_locs.index:
            return last_aircraft_locs.loc[aircraft_id]["destination"].id
        
        # Handle case where aircraft has no operations yet
        return f"BASE-{_random.randint(1, NUM_BASES)}"
    
    def _generate_random_status():
        statuses = ["Ready", "In Maintenance", "Grounded", "Deployed"]
        
        probabilites = [0.50, 0.15, 0.05, 0.30]

        return _random.choices(statuses, probabilites)[0]

    def _get_last_aircraft_destinations():
        # Retrieve all operations data
        operations_data = c3.Operation.eval(limit=-1).to_pandas()

        operations_data['aircraft'] = operations_data['aircraft'].astype(str)

        # Get the last operation for each aircraft based on startDate
        last_ops = operations_data.loc[operations_data.groupby('aircraft')['startDate'].idxmax()]
        last_ops = last_ops[['aircraft', 'destination']]

        # Set 'aircraft' as the index for fast lookups
        last_locs = last_ops.set_index("aircraft").sort_index()

        return last_locs

    last_aircraft_locs = _get_last_aircraft_destinations()

    aircraft_objs = []
    for i in range(1, NUM_AIRCRAFTS + 1):
        aircraft_id = f"AIRCRAFT-{i}"
        aircraft_objs.append({
            "id": aircraft_id,
            "registrationNumber": _generate_random_registration_number(),
            "model": _generate_random_model(),
            "status": _generate_random_status(),
            "lastInspectionDate": _generate_random_date_within_range(START_DATE, END_DATE),
            "location": _get_last_aircraft_location(aircraft_id, last_aircraft_locs)
        })

    _upsert_helper(aircraft_objs, c3.Aircraft)

    post_upsert_ct = c3.Aircraft.fetchCount()

    if post_upsert_ct != NUM_AIRCRAFTS:
        return f"Warning: Expected to generate {NUM_AIRCRAFTS} Aircrafts, but generated {post_upsert_ct}."

    return f"Generated {post_upsert_ct} Aircrafts"

def createWorkOrderData(cls):
    import pandas as pd

    ''' Generates data for NUM_WORK_ORDERS work orders '''
    if c3.WorkOrder.fetchCount() == NUM_WORK_ORDERS:
        return "Work Order data already exists. Skipping data generation."
    
    if c3.Operation.fetchCount() != NUM_OPERATIONS:
        return "Operation data must be generated before Aircraft data. Please generate Operation data first."

    def _get_alert_work_order_description(alert):
        alert_to_description = {
            "Engine Check": "Perform engine inspection and maintenance",
            "Fuel Low": "Refuel aircraft to operational capacity",
            "Navigation System Fault": "Repair navigation system components",
            "Communication Error": "Fix communication equipment and systems",
            "Landing Gear Issue": "Inspect and repair landing gear assembly",
            "Hydraulic System Warning": "Service hydraulic systems and check for leaks",
            "Weather Alert": "Perform weather-related damage inspection",
            "Air Traffic Control Delay": "Complete delayed maintenance procedures",
            "Security Alert": "Conduct security inspection and clearance",
            "Maintenance Required": "Perform scheduled maintenance tasks"
        }
        
        return alert_to_description[alert]

    def _get_alert_priority(alert):
        priority_map = {
            "Engine Check": "HIGH",
            "Fuel Low": "HIGH",
            "Navigation System Fault": "HIGH",
            "Communication Error": "MEDIUM",
            "Landing Gear Issue": "HIGH",
            "Hydraulic System Warning": "HIGH",
            "Weather Alert": "MEDIUM",
            "Air Traffic Control Delay": "LOW",
            "Security Alert": "HIGH",
            "Maintenance Required": "MEDIUM"
        }

        return priority_map[alert]
        
    operations_data = c3.Operation.eval(limit=-1).to_pandas()

    work_order_objs = []

    for row in operations_data.itertuples():
        alerts = row.alerts
        startDate = row.startDate

        if not alerts:
            continue

        for alert in alerts:
            dueDate = startDate + relativedelta(days=_random.randint(1,5))

            status = "CLOSED" if dueDate < pd.Timestamp(END_DATE) else "OPEN"

            work_order_objs.append({
                "id": f"WORK-ORDER-{len(work_order_objs) + 1}",
                "aircraft": row.aircraft.id,
                "description": _get_alert_work_order_description(alert),
                "priority": _get_alert_priority(alert),
                "status": status,
                "createdDate": startDate,
                "dueDate": dueDate
            })

    _upsert_helper(work_order_objs, c3.WorkOrder)

    post_upsert_ct = c3.WorkOrder.fetchCount()

    if post_upsert_ct != NUM_WORK_ORDERS:
        return f"Warning: Expected to generate {NUM_WORK_ORDERS} Work Orders, but generated {post_upsert_ct}."

    return f"Generated {post_upsert_ct} Work Orders"

def createMaintenanceRecordData(cls):
    ''' Generates data for NUM_WORK_ORDERS work orders '''
    if c3.MaintenanceRecord.fetchCount() == NUM_MAINTENANCE_RECORDS:
        return "Work Order data already exists. Skipping data generation."
    
    if c3.WorkOrder.fetchCount() != NUM_WORK_ORDERS:
        return "Work Order data must be generated before Maintenance Record data. Please generate Work Order data first."

    def _generate_random_maintenance_type():
        return _random.choice(["SCHEDULED", "UNSCHEDULED", "EMERGENCY"])

    def _generate_random_maintenance_record_description(description):
        work_order_desc_to_maintenance_record_desc = {
            "Perform engine inspection and maintenance": [
                "Replaced worn turbine blades",
                "Cleaned fuel injectors and filters",
                "Recalibrated engine sensors",
                "Replaced engine oil and filter",
                "Inspected combustion chamber for cracks"
            ],
            "Refuel aircraft to operational capacity": [
                "Filled main fuel tanks to capacity",
                "Inspected fuel lines for leaks",
                "Verified fuel quality and contamination check",
                "Topped off auxiliary fuel tanks",
                "Calibrated fuel quantity indicators"
            ],
            "Repair navigation system components": [
                "Replaced faulty GPS module",
                "Recalibrated inertial navigation system",
                "Updated navigation software to latest version",
                "Repaired antenna connection",
                "Replaced navigation display unit"
            ],
            "Fix communication equipment and systems": [
                "Replaced radio transceiver unit",
                "Repaired antenna cable connection",
                "Updated communication software",
                "Cleaned and tested headset jacks",
                "Replaced intercom system amplifier"
            ],
            "Inspect and repair landing gear assembly": [
                "Replaced worn brake pads",
                "Serviced and greased landing gear struts",
                "Replaced damaged tire",
                "Inspected and adjusted wheel alignment",
                "Replaced landing gear actuator seal"
            ],
            "Service hydraulic systems and check for leaks": [
                "Replaced leaking hydraulic line",
                "Topped off hydraulic fluid reservoir",
                "Replaced worn hydraulic pump seals",
                "Cleaned hydraulic filter and replaced element",
                "Tested system pressure and flow rates"
            ],
            "Perform weather-related damage inspection": [
                "Inspected exterior for hail damage",
                "Checked wing surfaces for lightning strike marks",
                "Examined control surfaces for wind damage",
                "Inspected windshield for crack propagation",
                "Assessed corrosion from moisture exposure"
            ],
            "Complete delayed maintenance procedures": [
                "Completed 100-hour inspection checklist",
                "Performed overdue avionics system test",
                "Executed deferred structural inspection",
                "Completed postponed engine run-up test",
                "Finished pending electrical system checks"
            ],
            "Conduct security inspection and clearance": [
                "Performed thorough cabin security sweep",
                "Inspected cargo hold for unauthorized items",
                "Verified integrity of access panels and doors",
                "Checked security seals on sensitive equipment",
                "Conducted pre-flight security screening"
            ],
            "Perform scheduled maintenance tasks": [
                "Completed routine pre-flight inspection",
                "Performed scheduled lubrication service",
                "Executed 50-hour maintenance checklist",
                "Conducted periodic system functional tests",
                "Performed routine safety equipment inspection"
            ]
        }
        
        return _random.choice(work_order_desc_to_maintenance_record_desc[description])

    def _generate_random_supplier_name():
        suppliers = ["AeroTech Solutions", "Precision Aviation Services", "SkyMaster Maintenance Corp", 
            "Apex Aircraft Support", "Horizon Aviation Systems", "TitanAir Logistics",
            "Premier Flight Services"]
        return _random.choice(suppliers)

    def _generate_random_technician_name():
        technicians = ["James Rodriguez", "Sarah Chen", "Michael Thompson", "Emily Davis",
            "Robert Martinez", "Jennifer Kim", "David Anderson"]
        return _random.choice(technicians)
    
    work_orders_data = c3.WorkOrder.eval(limit=-1,order="ascending(id)").to_pandas()

    maintenance_record_objs = []

    for row in work_orders_data.itertuples():
        num_maintenance_records = _random.randint(2,4)
        for _ in range(num_maintenance_records):
            aircraft_id, work_order_id= row.aircraft, row.id
            createdDate, dueDate = row.createdDate, row.dueDate
            description = row.description
    
            total_duration_in_days = (dueDate - createdDate).days

            # Generate start date within the work order timeframe
            num_days_from_start = _random.randint(0, total_duration_in_days)
            startDate = createdDate + relativedelta(days=num_days_from_start)

            # Generate maintenance duration (how many days the work takes)
            remaining_days = total_duration_in_days - num_days_from_start
            maintenance_duration = _random.randint(0, max(1, remaining_days))  # At least 0 days
            endDate = startDate + relativedelta(days=maintenance_duration)
            
            maintenance_record_objs.append({
                "aircraft": aircraft_id,
                "maintenanceType": _generate_random_maintenance_type(),
                "startDate": startDate,
                "endDate": endDate,
                "description": _generate_random_maintenance_record_description(description),
                "workOrder": work_order_id,
                "supplierName": _generate_random_supplier_name(),
                "technician": _generate_random_technician_name()
            })

    _upsert_helper(maintenance_record_objs, c3.MaintenanceRecord)

    post_upsert_ct = c3.MaintenanceRecord.fetchCount()
    
    if post_upsert_ct != NUM_MAINTENANCE_RECORDS:
        return f"Warning: Expected to generate {NUM_MAINTENANCE_RECORDS} Maintenance Records, but generated {post_upsert_ct}."

    return f"Generated {post_upsert_ct} Maintenance Records"

def clearAllData(cls):
    ''' Clears data from all Types in the data model '''
    res = []

    Types_to_clear = [c3.Aircraft, c3.Base, c3.Operation, c3.WorkOrder, c3.MaintenanceRecord]

    for Type in Types_to_clear:
        num_pre_clear = Type.fetchCount()
        Type.clearCollection(None, True)
        num_after_clear = Type.fetchCount()

        res.append(f"Cleared {num_pre_clear - num_after_clear} {Type.name()}s")

        if num_after_clear != 0:
            res.append(f"Warning: Not all {Type.name()} data was cleared. There are still {num_after_clear} records remaining.")

    return "\n".join(res)