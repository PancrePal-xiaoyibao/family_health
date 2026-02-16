from fastapi import Request
from fastapi.responses import JSONResponse


def ok(data, trace_id: str):
    return {"code": 0, "data": data, "message": "ok", "trace_id": trace_id}


def error(code: int, message: str, trace_id: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"code": code, "data": None, "message": message, "trace_id": trace_id},
    )


def trace_id_from_request(request: Request) -> str:
    return getattr(request.state, "trace_id", "unknown")
