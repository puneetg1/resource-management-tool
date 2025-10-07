from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Any
from db.db import list_collection  # Assuming your db connection is here
from models.models import Employee  # Assuming your Pydantic model is here
from bson import ObjectId
import pymongo
import json
from datetime import datetime, timedelta # Import timedelta
from io import BytesIO
from openpyxl import Workbook
import asyncio

router = APIRouter()

def employee_helper(employee: Any) -> dict:
    if employee and "_id" in employee:
        employee["_id"] = str(employee["_id"])
    return employee

def build_query(
    Project: Optional[str],
    project: Optional[str],
    Stream: Optional[str],
    allocationStatus: Optional[str],
    expiringStatus: Optional[str],
    Contract_Perm: Optional[str]
) -> dict:
    query = {}
    
    project_filter_value = Project or project
    if project_filter_value:
        query["Project"] = {"$regex": project_filter_value, "$options": "i"}
    if Stream:
        query["Stream"] = Stream
    if Contract_Perm:
        query["Contract / Perm"] = Contract_Perm
    
    if allocationStatus == "partial":
        query["% Allocation"] = {"$lt": 100}
    elif allocationStatus == "full":
        query["% Allocation"] = 100

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    # UPDATED: "at-risk" now includes contracts that have already expired.
    if expiringStatus == "at-risk":
        query["Resource End date"] = {"$lte": today + timedelta(days=30)}
    elif expiringStatus == "0-30":
        query["Resource End date"] = {"$gte": today, "$lte": today + timedelta(days=30)}
    elif expiringStatus == "31-60":
        query["Resource End date"] = {"$gte": today + timedelta(days=31), "$lte": today + timedelta(days=60)}
    elif expiringStatus == "61-90":
        query["Resource End date"] = {"$gte": today + timedelta(days=61), "$lte": today + timedelta(days=90)}
        
    return query

# --- Employee Data Endpoints ---

@router.get("/employees", response_model=List[dict])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationStatus: Optional[str] = None,
    expiringStatus: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm"),
    sortBy: Optional[str] = Query("First name", alias="sortBy"),
    sortDirection: Optional[str] = Query("ascending", alias="sortDirection")
):
    try:
        query = build_query(Project, project, Stream, allocationStatus, expiringStatus, Contract_Perm)
        direction = pymongo.ASCENDING if sortDirection == "ascending" else pymongo.DESCENDING
        
        employees_cursor = list_collection.find(query).sort(sortBy, direction).skip(skip).limit(limit)
        employees = await employees_cursor.to_list(length=limit)
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for emp in employees:
            end_date = emp.get("Resource End date")
            if end_date and isinstance(end_date, datetime):
                delta = end_date - today
                emp["Countdown"] = delta.days 
            else:
                emp["Countdown"] = None

        return [employee_helper(emp) for emp in employees]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employees/count", response_model=dict)
async def get_employees_count(
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationStatus: Optional[str] = None,
    expiringStatus: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm")
):
    try:
        query = build_query(Project, project, Stream, allocationStatus, expiringStatus, Contract_Perm)
        count = await list_collection.count_documents(query)
        return {"total": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/employees", response_model=dict)
async def create_employee(employee: Employee):
    try:
        employee_data = employee.dict(by_alias=True)
        # Countdown is dynamically calculated, so we can remove it from here.
        numeric_fields = ["% Allocation"]

        for key, value in employee_data.items():
            if isinstance(value, str):
                employee_data[key] = value.strip()
            if key in numeric_fields and value == "":
                employee_data[key] = 0
        
        # Remove Countdown from the payload if it exists
        employee_data.pop("Countdown", None)

        if not employee_data:
            raise HTTPException(status_code=400, detail="No employee data provided")
        result = await list_collection.insert_one(employee_data)
        return {"_id": str(result.inserted_id), "message": "Employee created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/employees/{employee_id}", response_model=dict)
async def update_employee(employee_id: str, employee_data: Employee):
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(status_code=400, detail="Invalid employee ID format")
    
    update_data = employee_data.dict(by_alias=True, exclude_unset=True)
    
    # Remove Countdown from the payload if it exists, as it's a calculated field
    update_data.pop("Countdown", None)

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    result = await list_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 1:
        return {"message": "Employee updated successfully"}
    
    existing_employee = await list_collection.find_one({"_id": ObjectId(employee_id)})
    if existing_employee:
        return {"message": "Employee data is the same, no update was performed."}

    raise HTTPException(status_code=404, detail=f"Employee with ID {employee_id} not found")


@router.delete("/employees/{employee_id}", response_model=dict)
async def delete_employee(employee_id: str):
    if not ObjectId.is_valid(employee_id):
        raise HTTPException(status_code=400, detail="Invalid employee ID format")
        
    result = await list_collection.delete_one({"_id": ObjectId(employee_id)})

    if result.deleted_count == 1:
        return {"message": "Employee deleted successfully"}

    raise HTTPException(status_code=404, detail=f"Employee with ID {employee_id} not found")

@router.post("/employees/bulk-import-file", response_model=dict)
async def bulk_import_employees_from_file(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith('.json'):
            raise ValueError("Invalid file type. Please upload a JSON file.")
        
        contents = await file.read()
        data = json.loads(contents)

        if not isinstance(data, dict) or "resources" not in data:
            raise ValueError("Invalid JSON format: must contain a 'resources' key.")
        
        employees_raw_data = data["resources"]
        if not isinstance(employees_raw_data, list):
            raise ValueError("'resources' key must contain a list.")
        
        created_count = 0
        updated_count = 0
        
        for record in employees_raw_data:
            if not record.get("First name") or not record.get("Last name"):
                continue

            processed_record = {
                "First name": record.get("First name"), "Last name": record.get("Last name"),
                "Line Manager": record.get("Line Manager"), "Project": record.get("Project"),
                "Open Air ID": record.get("Open Air ID"), "Location": record.get("Location"),
                "Stream": record.get("Stream"), "Tech Skills": record.get("Tech Skills"),
                "Job Title": record.get("Job Title"), "Contract / Perm": record.get("Contract / Perm"),
                "Billable": record.get("Billable"), "Notes": record.get("Notes")
            }
            processed_record["% Allocation"] = int(record.get("% Allocation") or 0)
            
            end_date_str = record.get("Resource End date")
            if end_date_str and isinstance(end_date_str, str) and end_date_str.strip():
                try:
                    processed_record["Resource End date"] = datetime.strptime(end_date_str, "%d/%m/%Y")
                except ValueError:
                    processed_record["Resource End date"] = None
            else:
                processed_record["Resource End date"] = None
            
            query = {"First name": processed_record["First name"], "Last name": processed_record["Last name"]}
            update_data = {"$set": processed_record}
            result = await list_collection.update_one(query, update_data, upsert=True)

            if result.upserted_id:
                created_count += 1
            elif result.modified_count > 0:
                updated_count += 1
        
        return {
            "message": f"Successfully processed {len(employees_raw_data)} records.",
            "created_count": created_count,
            "updated_count": updated_count
        }
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


# @router.get("/employees/export-excel")
# async def export_employees_to_excel(
#     Project: Optional[str] = None,
#     project: Optional[str] = None,
#     Stream: Optional[str] = None,
#     allocationStatus: Optional[str] = None,
#     expiringStatus: Optional[str] = None,
#     Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm")
# ):
#     try:
#         query = build_query(Project, project, Stream, allocationStatus, expiringStatus, Contract_Perm)
#         employees_cursor = list_collection.find(query)
#         employees = await employees_cursor.to_list(length=None)

#         if not employees:
#             raise HTTPException(status_code=404, detail="No employees found to export")

#         wb = Workbook()
#         ws = wb.active
#         ws.title = "Employees"
        
#         headers = list(employees[0].keys()) if employees else []
#         if "Countdown" not in headers:
#             headers.append("Countdown")
#         ws.append(headers)
        
#         today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

#         for emp in employees:
#             end_date = emp.get("Resource End date")
#             if end_date and isinstance(end_date, datetime):
#                 delta = end_date - today
#                 emp["Countdown"] = delta.days
#             else:
#                 emp["Countdown"] = None

#             row_data = []
#             for col in headers:
#                 value = emp.get(col)
#                 if isinstance(value, list):
#                     row_data.append(", ".join(map(str, value)))
#                 elif isinstance(value, datetime):
#                     row_data.append(value.strftime("%d/%m/%Y"))
#                 else:
#                     row_data.append(value)
#             ws.append(row_data)

#         output = BytesIO()
#         wb.save(output)
#         output.seek(0)

#         return StreamingResponse(
#             output,
#             media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#             headers={"Content-Disposition": "attachment; filename=employees.xlsx"}
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/employees/export-excel")
async def export_employees_to_excel(
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationStatus: Optional[str] = None,
    expiringStatus: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm")
):
    try:
        query = build_query(Project, project, Stream, allocationStatus, expiringStatus, Contract_Perm)
        employees_cursor = list_collection.find(query)
        employees = await employees_cursor.to_list(length=None)

        if not employees:
            raise HTTPException(status_code=404, detail="No employees found to export")

        wb = Workbook()
        ws = wb.active
        ws.title = "Employees"
        
        headers = list(employees[0].keys()) if employees else []
        if "Countdown" not in headers:
            headers.append("Countdown")
        ws.append(headers)
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        for emp in employees:
            end_date = emp.get("Resource End date")
            if end_date and isinstance(end_date, datetime):
                delta = end_date - today
                emp["Countdown"] = delta.days
            else:
                emp["Countdown"] = None

            row_data = []
            for col in headers:
                value = emp.get(col)
                # --- FIX: Convert ObjectId to string ---
                if isinstance(value, ObjectId):
                    row_data.append(str(value))
                elif isinstance(value, list):
                    row_data.append(", ".join(map(str, value)))
                elif isinstance(value, datetime):
                    row_data.append(value.strftime("%d/%m/%Y"))
                else:
                    row_data.append(value)
            ws.append(row_data)

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=employees.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# --- UPDATED DASHBOARD SUMMARY ---
@router.get("/dashboard-summary")
async def get_dashboard_summary():
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_from_now = today + timedelta(days=30)
        ninety_days_from_now = today + timedelta(days=90)

        # UPDATED: Query now includes expired contracts
        at_risk_query = {"Resource End date": {"$lte": thirty_days_from_now}}
        
        expiring_contracts_pipeline = [
            # UPDATED: Match includes expired contracts up to 90 days from now
            {"$match": {"Resource End date": {"$lte": ninety_days_from_now}}},
            {"$addFields": {
                "days_diff": {"$dateDiff": {"startDate": today, "endDate": "$Resource End date", "unit": "day"}}
            }},
            # UPDATED: Boundaries now correctly bucket negative (expired) days
            {"$bucket": {
                "groupBy": "$days_diff",
                "boundaries": [-99999, 31, 61, 91],
                "default": "Other",
                "output": {"count": {"$sum": 1}}
            }},
            {"$project": {
                "name": {"$switch": {"branches": [
                    # UPDATED: Label is clearer for the first bucket
                    {"case": {"$eq": ["$_id", -99999]}, "then": "Expired / 0-30 Days"},
                    {"case": {"$eq": ["$_id", 31]}, "then": "31-60 Days"},
                    {"case": {"$eq": ["$_id", 61]}, "then": "61-90 Days"}
                ], "default": "Other"}},
                "value": "$count", "_id": 0
            }}
        ]

        at_risk_employees_pipeline = [
            {"$match": at_risk_query},
            {"$addFields": {
                "daysLeft": {"$dateDiff": {"startDate": today, "endDate": "$Resource End date", "unit": "day"}}
            }},
            {"$sort": {"daysLeft": 1}},
            {"$limit": 5},
            {"$project": {
                "id": {"$toString": "$_id"},
                "name": {"$concat": ["$First name", " ", "$Last name"]},
                "daysLeft": "$daysLeft",
                "project": "$Project", "_id": 0
            }}
        ]

        results = await asyncio.gather(
            list_collection.count_documents({}),
            list_collection.count_documents(at_risk_query),
            list_collection.count_documents({"% Allocation": {"$lt": 100}}),
            list_collection.distinct("Project"),
            list_collection.aggregate([{"$group": {"_id": "$Stream", "value": {"$sum": 1}}}, {"$project": {"name": "$_id", "value": 1, "_id": 0}}]).to_list(length=None),
            list_collection.aggregate([{"$group": {"_id": "$Project", "value": {"$sum": 1}}}, {"$project": {"name": "$_id", "value": 1, "_id": 0}}, {"$sort": {"value": -1}}]).to_list(length=None),
            list_collection.aggregate(expiring_contracts_pipeline).to_list(length=None),
            list_collection.aggregate(at_risk_employees_pipeline).to_list(length=None),
            list_collection.aggregate([{"$group": {"_id": {"project": "$Project", "stream": "$Stream"}, "count": {"$sum": 1}}}, {"$group": {"_id": "$_id.project", "streams": {"$push": {"k": "$_id.stream", "v": "$count"}}}}, {"$addFields": {"streams_obj": {"$arrayToObject": "$streams"}}}, {"$project": {"_id": 0, "project": "$_id", "Backend": {"$ifNull": ["$streams_obj.Backend", 0]}, "Frontend": {"$ifNull": ["$streams_obj.Frontend", 0]}, "QA": {"$ifNull": ["$streams_obj.QA", 0]}}}, {"$sort": {"project": 1}}]).to_list(length=None)
        )

        (total_headcount, at_risk_contracts, partially_allocated, active_projects, 
         headcount_by_stream, headcount_per_project, expiring_contracts_breakdown, 
         at_risk_employees, project_stream_distribution) = results

        # Filter out "Other" bucket if it exists
        expiring_contracts_breakdown = [b for b in expiring_contracts_breakdown if b.get("name") != "Other"]

        return {
            "kpis": {
                "totalHeadcount": total_headcount,
                "atRiskContracts": at_risk_contracts,
                "partiallyAllocated": partially_allocated,
                "activeProjects": len(active_projects)
            },
            "charts": {
                "headcountByStream": headcount_by_stream,
                "headcountPerProject": headcount_per_project,
                "expiringContractsBreakdown": expiring_contracts_breakdown,
                "projectStreamDistribution": project_stream_distribution
            },
            "atRiskEmployees": at_risk_employees
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/skill-distribution")
async def get_skill_distribution():
    try:
        pipeline = [
            {"$match": {"Stream": {"$in": ["Frontend", "Backend", "QA"]}}},
            {"$addFields": {
                "skills_array": {
                    "$cond": {
                        "if": {"$isArray": "$Tech Skills"}, "then": "$Tech Skills",
                        "else": {"$cond": { "if": {"$ne": ["$Tech Skills", None]}, "then": ["$Tech Skills"], "else": [] }}
                    }
                }
            }},
            {"$unwind": "$skills_array"},
            {"$addFields": {
                "cleaned_skill": {"$trim": {"input": "$skills_array"}}
            }},
            {"$group": {
                "_id": {"stream": "$Stream", "skill": "$cleaned_skill"},
                "count": {"$sum": 1}
            }},
            {"$group": {
                "_id": "$_id.stream",
                "skills": {"$push": {"name": "$_id.skill", "count": "$count"}}
            }},
            {"$project": {
                "_id": 0, "stream": "$_id", "skills": 1
            }}
        ]
        skill_data = await list_collection.aggregate(pipeline).to_list(length=None)
        return skill_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))