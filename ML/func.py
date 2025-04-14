import pandas as pd
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests

def fetch_ml_data():
    url = "http://host.docker.internal:3000/api/fetchMLdata"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for HTTP errors (4xx, 5xx)
        
        data = response.json()  # Parse the JSON response
        print("Fetched Data:", data)
        return data
    except requests.exceptions.RequestException as e:
        print("Error fetching data:", e)
        return None



def compute_avg_difficulty(difficulty_column):
    if pd.isna(difficulty_column):  # Handle NaN or None values
        return 0

    if isinstance(difficulty_column, list):  
        num_list = [x for x in difficulty_column if isinstance(x, (int, float))]  # Ensure all elements are numbers
        return np.mean(num_list) if num_list else 0

    if isinstance(difficulty_column, str):  
        num_list = [int(x) for x in difficulty_column.replace(" ", "").split(",") if x.isdigit()]
        return np.mean(num_list) if num_list else 0  

    if isinstance(difficulty_column, (int, float)):
        return float(difficulty_column)  

    return 0  # Default case


def generate_project_recommendations(users_df, projects_df, applied_weight=0.5, alpha_cbf=0.7, beta_cbf=0.3, alpha_cf=0.6, beta_cf=0.2, gamma_cf=0.2, alpha_hybrid=0.5, beta_hybrid=0.5, K=5):
    def preprocess_domains(done_domains, applied_domains, applied_weight):
        done_list = done_domains.split(",") if isinstance(done_domains, str) else []
        applied_list = applied_domains.split(",") if isinstance(applied_domains, str) else []
        
        done_counts = Counter(done_list)
        applied_counts = Counter(applied_list)
        
        processed_text = []
        for domain, count in done_counts.items():
            processed_text.append(f"{domain} " * count)
        
        for domain, count in applied_counts.items():
            weighted_count = max(1, round(count * applied_weight))
            processed_text.append(f"{domain} " * weighted_count)
        
        return " ".join(processed_text).strip()

    users_df["processed_domains"] = users_df.apply(
        lambda row: preprocess_domains(row["past_project_domains_done"], row["past_project_domains_applied"], applied_weight), axis=1
    )
    projects_df["processed_domains"] = projects_df["domains_required"].apply(lambda domains: " ".join(domains.split(", ")))

    vectorizer = TfidfVectorizer()
    user_domain_vectors = vectorizer.fit_transform(users_df["processed_domains"])
    project_domain_vectors = vectorizer.transform(projects_df["processed_domains"])
    
    domain_similarity = cosine_similarity(user_domain_vectors, project_domain_vectors)
    
    users_df["difficulty_done_norm"] = users_df["difficulty_done"] / users_df["difficulty_done"].max()
    projects_df["difficulty_required_norm"] = projects_df["difficulty_required"] / projects_df["difficulty_required"].max()
    
    difficulty_similarity = 1 - np.abs(users_df["difficulty_done_norm"].values[:, None] - projects_df["difficulty_required_norm"].values)
    
    cbf_scores = alpha_cbf * domain_similarity + beta_cbf * difficulty_similarity
    
    vectorizer_users = TfidfVectorizer()
    user_vectors = vectorizer_users.fit_transform(users_df["past_project_domains_done"])
    user_similarity = cosine_similarity(user_vectors)
    
    users_df["score_norm"] = users_df["score"] / users_df["score"].max()
    difficulty_similarity_users = 1 - np.abs(users_df["difficulty_done_norm"].values[:, None] - users_df["difficulty_done_norm"].values)
    score_similarity = 1 - np.abs(users_df["score_norm"].values[:, None] - users_df["score_norm"].values)
    
    final_user_similarity = (alpha_cf * user_similarity) + (beta_cf * difficulty_similarity_users) + (gamma_cf * score_similarity)
    
    recommended_domains = {}
    for user_idx, user_id in enumerate(users_df["user_id"]):
        similar_user_indices = np.argsort(final_user_similarity[user_idx])[::-1][1:K+1]
        similar_users = users_df.iloc[similar_user_indices]
        
        applied_domains = np.concatenate([applied.split(",") for applied in similar_users["past_project_domains_applied"].dropna()])
        domain_counts = Counter(applied_domains)
        recommended_domains[user_id] = [domain for domain, _ in domain_counts.most_common()]
    
    cf_scores = {}
    for user_id, domains in recommended_domains.items():
        if not domains:
            cf_scores[user_id] = {}
            continue
        
        matching_projects = projects_df[projects_df["domains_required"].apply(
            lambda d: bool(set(d.split(",")).intersection(set(domains)))
        )]
        
        if matching_projects.empty:
            cf_scores[user_id] = {}
            continue
        
        user_difficulty = users_df.loc[users_df["user_id"] == user_id, "difficulty_done_norm"].values[0]
        matching_projects = matching_projects.copy()
        matching_projects["difficulty_sim"] = 1 - np.abs(matching_projects["difficulty_required_norm"] - user_difficulty)
        
        project_scores = dict(zip(matching_projects["project_id"], matching_projects["difficulty_sim"]))
        cf_scores[user_id] = project_scores
    final_recommendations = {}
    for user_idx, user_id in enumerate(users_df["user_id"]):
        hybrid_scores = {}

        for project_idx, project_id in enumerate(projects_df["project_id"]):
            cbf_score = cbf_scores[user_idx, project_idx]
            cf_score = cf_scores.get(user_id, {}).get(project_id, 0)
            cf_score = cf_score if cf_score > 0 else 0.1

            hybrid_scores[project_id] = (alpha_hybrid * cbf_score) + (beta_hybrid * cf_score)

        # Store only sorted project IDs
        final_recommendations[user_id] = [project_id for project_id, _ in sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:3]]

    
    return final_recommendations

