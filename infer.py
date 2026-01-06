import torch
import numpy as np
from reco_env import SequentialRecEnv
from dqn_agent import QNetwork

# -----------------------------
# State preprocessing (same as training)
# -----------------------------
def preprocess_obs(obs, env, device):
    embed_dim = env.embed_dim
    user_embed = obs[:embed_dim]
    last_seq = obs[embed_dim:].astype(int)

    last_seq = np.clip(last_seq, 0, env.num_groups - 1)
    last_emb = env.group_embeddings[last_seq].mean(axis=0)

    state = np.concatenate([user_embed, last_emb]).astype(np.float32)
    return torch.tensor(state).unsqueeze(0).to(device)


# -----------------------------
# Inference Setup
# -----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

env = SequentialRecEnv(
    num_groups=50,
    num_users=200,
    embed_dim=8,
    seq_len=5,
    max_steps=20
)

input_dim = env.embed_dim * 2

model = QNetwork(input_dim, env.num_groups).to(device)
model.load_state_dict(torch.load("dqn_recommender.pth", map_location=device))
model.eval()

# -----------------------------
# Recommendation Function
# -----------------------------
def recommend_top_k(obs, env, model, k=5):
    state = preprocess_obs(obs, env, device)

    with torch.no_grad():
        q_values = model(state).squeeze(0)

    # Exclude already-seen groups
    seen_groups = set(obs[env.embed_dim:].astype(int).tolist())
    for g in seen_groups:
        q_values[g] = -1e9  # mask seen items

    top_k = torch.topk(q_values, k).indices.tolist()
    return top_k


# -----------------------------
# Run a demo inference
# -----------------------------
obs, _ = env.reset(seed=42)

recommended_groups = recommend_top_k(obs, env, model, k=5)

print("Recommended group IDs (Top-5):")
print(recommended_groups)
