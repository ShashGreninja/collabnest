from fastapi import FastAPI
from func import *
import pandas as pd
import numpy as np
import ast
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "https://collabnest.iitp.ac.in",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sanitize_data(data):
    """Recursively replace NaN and Infinity values in dictionaries or lists."""
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(v) for v in data]
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return 0  # Replace with 0 (or None if required)
    return data  # Return unchanged for other data types

def _stringify_lists(df):
    """Element-wise: join list cells to strings.

    DataFrame.applymap was removed in pandas 3.0; DataFrame.map is its
    element-wise replacement (pandas >= 2.1). Fall back for older pandas.
    """
    func = lambda x: ','.join(map(str, x)) if isinstance(x, list) else x
    mapper = getattr(df, "map", None)
    if callable(mapper):
        return mapper(func)
    return df.applymap(func)  # pandas < 2.1

@app.get("/recommend/{user_id}")
async def read_item(user_id):
    ml_data = fetch_ml_data()
    
    users_df = pd.DataFrame(ml_data['user_data'])
    projects_df = pd.DataFrame(ml_data['project_data'])

    users_df = _stringify_lists(users_df)
    projects_df = _stringify_lists(projects_df)

    users_df["difficulty_done"] = users_df["difficulty_done"].apply(compute_avg_difficulty)
    users_df["difficulty_applied"] = users_df["difficulty_applied"].apply(compute_avg_difficulty)

    final_data = generate_project_recommendations(users_df, projects_df)

    # 🔹 Convert invalid values before returning
    final_data = sanitize_data(final_data)


    return {
        "data": final_data[user_id]
    }
