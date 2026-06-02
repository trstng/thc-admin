from .airtable import TABLES, create_record


async def log(
    *,
    client_name: str,
    job_id: str,
    automation_type: str,
    channel: str,
    status: str,
    client_record_id: str | None = None,
    job_record_id: str | None = None,
    note: str | None = None,
) -> None:
    fields: dict = {
        "Client Name": client_name,
        "Job ID": job_id,
        "Automation Type": automation_type,
        "Channel": channel,
        "Status": status,
    }
    if client_record_id:
        fields["Related Client (Linked)"] = [client_record_id]
    if job_record_id:
        fields["Related Job (Linked)"] = [job_record_id]
    if note:
        fields["Automation Note"] = note
    await create_record(TABLES["AUTOMATIONS_LOG"], fields)
