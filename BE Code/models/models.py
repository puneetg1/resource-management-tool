# file: models/models.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Employee(BaseModel):
    # Use Field(alias=...) for JSON keys that are not valid Python variable names
    first_name: Optional[str] = Field(None, alias="First name")
    last_name: Optional[str] = Field(None, alias="Last name")
    allocation: Optional[int] = Field(None, alias="% Allocation")
    billable: Optional[str] = Field(None, alias="Billable")
    contract_perm: Optional[str] = Field(None, alias="Contract / Perm")
    countdown: Optional[int] = Field(None, alias="Countdown")
    job_title: Optional[str] = Field(None, alias="Job Title")
    line_manager: Optional[str] = Field(None, alias="Line Manager")
    location: Optional[str] = Field(None, alias="Location")
    notes: Optional[str] = Field(None, alias="Notes")
    open_air_id: Optional[List[str]] = Field(None, alias="Open Air ID") # Handle array of strings
    project: Optional[str] = Field(None, alias="Project")
    resource_end_date: Optional[datetime] = Field(None, alias="Resource End date")
    stream: Optional[str] = Field(None, alias="Stream")
    tech_skills: Optional[List[str]] = Field(None, alias="Tech Skills") # Handle array of strings

    class Config:
        # This allows Pydantic to work with the aliases defined above
        allow_population_by_field_name = True
        # This ensures that when converting the model to a dict, it uses the aliases
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d") if v else None
        }