
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Any
from db.db import list_collection
from models.models import Employee
from bson import ObjectId
import pymongo
import json
from datetime import datetime
from io import BytesIO
import openpyxl
import asyncio

router = APIRouter()

# Helper to convert MongoDB document to a dictionary
def employee_helper(employee: Any) -> dict:
    employee["_id"] = str(employee["_id"])
    return employee

# --- Employee Data Endpoints ---

@router.get("/employees", response_model=List[dict])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    # Accept both 'Project' and 'project' as filter keys
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationRange: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm"),
    sortBy: Optional[str] = Query("First name", alias="sortBy"),
    sortDirection: Optional[str] = Query("ascending", alias="sortDirection")
):
    try:
        query = {}
        
        # Consolidate the project filter value
        project_filter_value = Project or project
        if project_filter_value:
            query["Project"] = {"$regex": project_filter_value, "$options": "i"}
            
        if Stream:
            query["Stream"] = Stream
        if Contract_Perm:
            query["Contract / Perm"] = Contract_Perm
        if allocationRange and '-' in allocationRange:
            try:
                min_val, max_val = map(int, allocationRange.split('-'))
                query["% Allocation"] = {"$gte": min_val, "$lte": max_val}
            except (ValueError, IndexError):
                pass
        
        direction = pymongo.ASCENDING if sortDirection == "ascending" else pymongo.DESCENDING
        
        employees_cursor = list_collection.find(query).sort(sortBy, direction).skip(skip).limit(limit)
        employees = await employees_cursor.to_list(length=limit)
        return [employee_helper(emp) for emp in employees]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/employees/count", response_model=dict)
async def get_employees_count(
    # Accept both 'Project' and 'project' as filter keys
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationRange: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm")
):
    try:
        query = {}
        
        # Consolidate the project filter value
        project_filter_value = Project or project
        if project_filter_value:
            query["Project"] = {"$regex": project_filter_value, "$options": "i"}

        if Stream:
            query["Stream"] = Stream
        if Contract_Perm:
            query["Contract / Perm"] = Contract_Perm
        if allocationRange and '-' in allocationRange:
            try:
                min_val, max_val = map(int, allocationRange.split('-'))
                query["% Allocation"] = {"$gte": min_val, "$lte": max_val}
            except (ValueError, IndexError):
                pass
        
        count = await list_collection.count_documents(query)
        return {"total": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/employees", response_model=dict)
async def create_employee(employee: Employee):
    try:
        employee_data = employee.dict(by_alias=True, exclude_unset=True)
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


# --- Import / Export Endpoints ---

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
            processed_record["Countdown"] = int(record.get("Countdown") or 0)
            
            end_date_str = record.get("Resource End date")
            if end_date_str and isinstance(end_date_str, str) and end_date_str.strip():
                processed_record["Resource End date"] = datetime.strptime(end_date_str, "%d/%m/%Y")
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


@router.get("/employees/export-excel")
async def export_employees_to_excel(
    # Accept both 'Project' and 'project' as filter keys
    Project: Optional[str] = None,
    project: Optional[str] = None,
    Stream: Optional[str] = None,
    allocationRange: Optional[str] = None,
    Contract_Perm: Optional[str] = Query(None, alias="Contract / Perm")
):
    try:
        query = {}
        
        # Consolidate the project filter value
        project_filter_value = Project or project
        if project_filter_value:
            query["Project"] = {"$regex": project_filter_value, "$options": "i"}

        if Stream:
            query["Stream"] = Stream
        if Contract_Perm:
            query["Contract / Perm"] = Contract_Perm
        if allocationRange and '-' in allocationRange:
            try:
                min_val, max_val = map(int, allocationRange.split('-'))
                query["% Allocation"] = {"$gte": min_val, "$lte": max_val}
            except (ValueError, IndexError):
                pass

        employees_cursor = list_collection.find(query)
        employees = await employees_cursor.to_list(length=None)

        if not employees:
            raise HTTPException(status_code=404, detail="No employees found to export")

        for emp in employees:
            emp["_id"] = str(emp["_id"])
            for key, value in emp.items():
                if isinstance(value, list):
                    emp[key] = ", ".join(map(str, value))
                elif isinstance(value, datetime):
                    emp[key] = value.strftime("%d/%m/%Y")

        wb = Workbook()
        ws = wb.active
        ws.title = "Employees"
        headers = list(employees[0].keys())
        ws.append(headers)

        for emp in employees:
            row = [emp.get(col, "") for col in headers]
            ws.append(row)

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


# --- Dashboard Endpoint ---

@router.get("/dashboard-summary")
async def get_dashboard_summary():
    try:
        total_headcount_task = list_collection.count_documents({})
        at_risk_contracts_task = list_collection.count_documents({"Countdown": {"$lte": 30}})
        partially_allocated_task = list_collection.count_documents({"% Allocation": {"$lt": 100}})
        active_projects_task = list_collection.distinct("Project")

        headcount_by_stream_pipeline = [{"$group": {"_id": "$Stream", "value": {"$sum": 1}}}, {"$project": {"name": "$_id", "value": 1, "_id": 0}}]
        headcount_by_stream_task = list_collection.aggregate(headcount_by_stream_pipeline).to_list(length=None)
        
        headcount_per_project_pipeline = [{"$group": {"_id": "$Project", "value": {"$sum": 1}}}, {"$project": {"name": "$_id", "value": 1, "_id": 0}}, {"$sort": {"value": -1}}]
        headcount_per_project_task = list_collection.aggregate(headcount_per_project_pipeline).to_list(length=None)

        expiring_contracts_pipeline = [{"$match": {"Countdown": {"$gte": 0, "$lte": 90}}}, {"$bucket": {"groupBy": "$Countdown", "boundaries": [0, 31, 61, 91], "default": "Other", "output": {"count": {"$sum": 1}}}}, {"$project": {"name": {"$switch": {"branches": [{"case": {"$eq": ["$_id", 0]}, "then": "0-30 Days"}, {"case": {"$eq": ["$_id", 31]}, "then": "31-60 Days"}, {"case": {"$eq": ["$_id", 61]}, "then": "61-90 Days"}]}}, "value": "$count", "_id": 0}}]
        expiring_contracts_task = list_collection.aggregate(expiring_contracts_pipeline).to_list(length=None)

        at_risk_employees_pipeline = [{"$match": {"Countdown": {"$lte": 30}}}, {"$sort": {"Countdown": 1}}, {"$limit": 5}, {"$project": {"id": {"$toString": "$_id"}, "name": {"$concat": ["$First name", " ", "$Last name"]}, "daysLeft": "$Countdown", "project": "$Project", "_id": 0}}]
        at_risk_employees_task = list_collection.aggregate(at_risk_employees_pipeline).to_list(length=None)

        # ✅ NEW: Aggregation pipeline for project-wise stream distribution
        project_stream_distribution_pipeline = [
            # Stage 1: Group by Project and Stream to count combinations
            {"$group": {"_id": {"project": "$Project", "stream": "$Stream"}, "count": {"$sum": 1}}},
            # Stage 2: Group by Project only, and pivot the streams into an array
            {"$group": {"_id": "$_id.project", "streams": {"$push": {"k": "$_id.stream", "v": "$count"}}}},
            # Stage 3: Convert the array of k-v pairs into a single object
            {"$addFields": {"streams_obj": {"$arrayToObject": "$streams"}}},
            # Stage 4: Project the final shape, ensuring all streams have a value (defaulting to 0)
            {"$project": {
                "_id": 0,
                "project": "$_id",
                "Backend": {"$ifNull": ["$streams_obj.Backend", 0]},
                "Frontend": {"$ifNull": ["$streams_obj.Frontend", 0]},
                "QA": {"$ifNull": ["$streams_obj.QA", 0]}
            }},
            {"$sort": {"project": 1}} # Sort alphabetically by project name
        ]
        project_stream_distribution_task = list_collection.aggregate(project_stream_distribution_pipeline).to_list(length=None)

        # --- Run all queries in parallel ---
        results = await asyncio.gather(
            total_headcount_task, at_risk_contracts_task, partially_allocated_task,
            active_projects_task, headcount_by_stream_task, headcount_per_project_task,
            expiring_contracts_task, at_risk_employees_task,
            project_stream_distribution_task # ✅ Add the new task
        )

        (total_headcount, at_risk_contracts, partially_allocated, active_projects, 
         headcount_by_stream, headcount_per_project, expiring_contracts_breakdown, 
         at_risk_employees, project_stream_distribution) = results

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
                # ✅ Add the new data to the response payload
                "projectStreamDistribution": project_stream_distribution
            },
            "atRiskEmployees": at_risk_employees
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")



